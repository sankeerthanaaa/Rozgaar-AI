const resumeService = require("../services/storage.service");
const fileUploadService = require("../services/fileUpload.service");
const { parseResumeFromBuffer } = require("../services/parser.service");
const { analyzeATS } = require("../services/ats.service");
const { freezeResumeText } = require("../services/atsScoring.engine");
const Resume = require("../models/Resume.model");

function parseKeywordsInput(keywords) {
  if (!keywords) return [];
  try {
    return typeof keywords === "string" ? JSON.parse(keywords) : keywords;
  } catch (e) {
    return String(keywords)
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
}

function buildAnalysisResponse(resume, atsResult) {
  const resumeObj = resume?.toObject ? resume.toObject() : { ...resume };
  const analysis = atsResult || resumeObj.atsResult || {};
  const suggestions = Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0
    ? analysis.suggestions
    : Array.isArray(resumeObj.suggestions)
      ? resumeObj.suggestions
      : [];

  resumeObj.suggestions = suggestions;
  resumeObj.atsResult = {
    ...analysis,
    suggestions,
    missingKeywords: analysis.missingKeywords || [],
    roleAlignmentTips: analysis.roleAlignmentTips || [],
    suggestionSummary: analysis.suggestionSummary || "",
    suggestionSource: analysis.suggestionSource || "",
  };

  return {
    success: true,
    data: resumeObj,
    analysis: resumeObj.atsResult,
    suggestions,
  };
}

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { jobDescription, keywords } = req.body;
    const keywordArray = parseKeywordsInput(keywords);

    const fileData = await resumeService.saveFile(req.file);
    const parsedData = await parseResumeFromBuffer(req.file.buffer, req.file.originalname);
    const frozenText = freezeResumeText(parsedData.text || "");

    let atsResultData = null;
    let atsScoreVal = 0;
    let suggestionsArr = [];

    // Run ATS analysis using frozen extracted text (parsed once at upload)
    if (frozenText) {
      try {
        atsResultData = await analyzeATS(frozenText, jobDescription, keywordArray);
        if (typeof atsResultData === 'string') {
          atsResultData = JSON.parse(atsResultData);
        }
        atsScoreVal = atsResultData.atsScore || 0;
        suggestionsArr = atsResultData.suggestions || [];
      } catch (atsError) {
        console.error("Failed to run ATS analysis during upload:", atsError);
      }
    }

    const structuredResume = extractResumeDataFromText(frozenText);

    const resume = await Resume.create({
      userId: req.user.id,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      publicId: fileData.publicId,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      parsedText: frozenText,
      parsedData: structuredResume,
      atsScore: atsScoreVal,
      atsResult: atsResultData,
      suggestions: suggestionsArr,
      status: atsResultData ? "analyzed" : "parsed",
    });

    res.status(201).json(buildAnalysisResponse(resume, atsResultData));
  } catch (error) {
    console.error("Upload Resume Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Re-run ATS using stored parsedText — never re-parses the PDF.
 */
const analyzeResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (!resume.parsedText || !resume.parsedText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Resume has no stored text. Please upload the file again.",
      });
    }

    const { jobDescription, keywords } = req.body;
    const keywordArray = parseKeywordsInput(keywords);

    const resumeText = resume.parsedText;
    const atsResultData = await analyzeATS(
      resumeText,
      jobDescription || "",
      keywordArray
    );

    resume.atsScore = atsResultData.atsScore || 0;
    resume.atsResult = atsResultData;
    resume.suggestions = atsResultData.suggestions || [];
    resume.status = "analyzed";
    await resume.save();

    res.status(200).json(buildAnalysisResponse(resume, atsResultData));
  } catch (error) {
    console.error("Analyze Resume Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error("Get Resumes Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Get Resume Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    try {
      const publicId = resume.publicId;
      if (publicId) {
        await fileUploadService.deleteFromCloudinary(publicId);
      }
    } catch (err) {
      console.error("Failed to delete file from Cloudinary:", err.message);
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Delete Resume Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper to extract structure from text for PDFs
function extractResumeDataFromText(text) {
  if (!text) text = "";
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  const resumeData = {
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };
  
  // Try to find the name (first line that isn't email, phone, web link)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (!line.includes("@") && !line.includes("http") && !line.includes(".com") && !/\d{5}/.test(line) && line.length > 2) {
      resumeData.name = line;
      break;
    }
  }
  if (!resumeData.name) {
    resumeData.name = ""; // Default fallback
  }

  // Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    resumeData.email = emailMatch[0];
  }
  
  // Extract Phone
  const phoneMatch = text.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || text.match(/\b\d{10}\b/) || text.match(/\+91\s\d{5}\s\d{5}/);
  if (phoneMatch) {
    resumeData.phone = phoneMatch[0];
  }

  // Extract Address/Location
  const locationMatch = text.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+|[A-Z]{2})\b/);
  if (locationMatch) {
    resumeData.location = locationMatch[0];
  } else {
    const locationLines = lines.filter(l => l.includes("India") || l.includes("USA") || l.toLowerCase().includes("hyderabad"));
    if (locationLines.length > 0) {
      resumeData.location = locationLines[0].split(/[|]/)[0].trim();
    }
  }

  // Categorize remainder into sections
  let currentSection = "";
  const sectionContent = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    if (/^(education|academic background|studies)$/i.test(line) || lowerLine.startsWith("education:")) {
      currentSection = "education";
    } else if (/^(experience|work experience|work history|employment|professional experience)$/i.test(line) || lowerLine.startsWith("experience:")) {
      currentSection = "experience";
    } else if (/^(projects|personal projects|academic projects)$/i.test(line) || lowerLine.startsWith("projects:")) {
      currentSection = "projects";
    } else if (/^(skills|technical skills|technologies|key skills)$/i.test(line) || lowerLine.startsWith("skills:") || lowerLine.startsWith("technical skills:")) {
      currentSection = "skills";
    } else if (/^(summary|professional summary|about me|career objective|objective)$/i.test(line) || lowerLine.startsWith("summary:") || lowerLine.startsWith("objective:")) {
      currentSection = "summary";
    } else if (/^(certifications|achievements|licenses|awards)$/i.test(line) || lowerLine.startsWith("certifications:") || lowerLine.startsWith("achievements:")) {
      currentSection = "certifications";
    } else if (currentSection && sectionContent[currentSection]) {
      sectionContent[currentSection].push(line);
    }
  });

  resumeData.summary = sectionContent.summary.join(" ");

  // Extract skills
  sectionContent.skills.forEach(sLine => {
    if (sLine.includes(":")) {
      resumeData.skills.push(sLine);
    } else {
      const split = sLine.split(/[,|•\-\t]/).map(s => s.trim()).filter(s => s.length > 1);
      resumeData.skills = [...resumeData.skills, ...split];
    }
  });

  // Extract experience entries
  let currentExp = null;
  sectionContent.experience.forEach(line => {
    const isHeaderLine = line.includes("–") || line.includes("|") || line.includes(" - ") || 
                         /\b(19|20)\d{2}\b/i.test(line) || 
                         (line.length < 60 && line.split(" ").length < 8 && !line.startsWith("-") && !line.startsWith("•"));
    
    if (isHeaderLine) {
      if (currentExp) {
        resumeData.experience.push(currentExp);
      }
      const parts = line.split(/[–|]/);
      currentExp = {
        title: parts[0]?.trim() || "Software Engineer",
        company: parts[1]?.trim() || "Company",
        startDate: "",
        endDate: "",
        description: ""
      };
      const dateMatches = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\b(19|20)\d{2}\b|\bPresent\b/ig);
      if (dateMatches && dateMatches.length > 0) {
        currentExp.startDate = dateMatches[0];
        currentExp.endDate = dateMatches[1] || "Present";
      }
    } else if (currentExp) {
      if (currentExp.description) {
        currentExp.description += "\n" + line;
      } else {
        currentExp.description = line;
      }
    }
  });
  if (currentExp) {
    resumeData.experience.push(currentExp);
  }

  // Extract projects
  let currentProj = null;
  sectionContent.projects.forEach(line => {
    const isHeader = line.length < 50 && !line.startsWith("-") && !line.startsWith("•") && !line.includes("Worked on");
    if (isHeader) {
      if (currentProj) {
        resumeData.projects.push(currentProj);
      }
      currentProj = {
        name: line,
        description: ""
      };
    } else if (currentProj) {
      if (currentProj.description) {
        currentProj.description += "\n" + line;
      } else {
        currentProj.description = line;
      }
    }
  });
  if (currentProj) {
    resumeData.projects.push(currentProj);
  }

  // Extract education
  let currentEdu = null;
  sectionContent.education.forEach(line => {
    const dateMatch = line.match(/\b(19|20)\d{2}\b/i);
    const isHeader = line.includes("–") || line.includes("|") || line.includes(" - ") || dateMatch || (line.length < 60 && line.split(" ").length < 8);
    
    if (isHeader) {
      if (currentEdu) {
        resumeData.education.push(currentEdu);
      }
      const parts = line.split(/[–|]/);
      currentEdu = {
        school: parts[1]?.trim() || parts[0]?.trim() || "University",
        degree: parts[0]?.trim() || "Degree",
        field: parts[2]?.trim() || "",
        startDate: "",
        endDate: ""
      };
      const dates = line.match(/\b(19|20)\d{2}\b/ig);
      if (dates && dates.length > 0) {
        currentEdu.startDate = dates[0];
        currentEdu.endDate = dates[1] || "";
      }
    } else if (currentEdu) {
      currentEdu.degree += " " + line;
    }
  });
  if (currentEdu) {
    resumeData.education.push(currentEdu);
  }

  // Extract certifications
  resumeData.certifications = sectionContent.certifications || [];

  return resumeData;
}

// Helper to apply suggestions to structured resume data
function applySuggestionsToStructuredData(originalData, suggestions, appliedIds) {
  const data = JSON.parse(JSON.stringify(originalData || {}));
  if (!data.name) data.name = "";
  if (!data.email) data.email = "";
  if (!data.skills) data.skills = [];
  if (!data.experience) data.experience = [];
  if (!data.education) data.education = [];
  if (!data.projects) data.projects = [];
  if (!data.certifications) data.certifications = [];
  
  suggestions.forEach(suggestion => {
    if (appliedIds && !appliedIds.includes(suggestion.id)) return;
    
    const section = (suggestion.section || "").toLowerCase().trim();
    const type = (suggestion.type || "").toLowerCase().trim();
    
    const originalText = suggestion.original || suggestion.before || "";
    const improvedText = suggestion.improved || suggestion.after || "";
    
    if (section === "summary" || section === "objective") {
      if (type === "improve" && originalText) {
        if (data.summary && data.summary.includes(originalText)) {
          data.summary = data.summary.replace(originalText, improvedText);
        } else {
          data.summary = improvedText;
        }
      } else if (type === "add") {
        data.summary = data.summary ? `${data.summary}\n${improvedText}` : improvedText;
      } else if (type === "remove" && originalText) {
        if (data.summary) {
          data.summary = data.summary.replace(originalText, "");
        }
      }
    } else if (section === "skills") {
      if (type === "add") {
        const match = improvedText.match(/keywords:\s*(.+)$/i) || improvedText.match(/keywords\s*(.+)$/i);
        const skillsString = match ? match[1] : improvedText;
        const newSkills = skillsString
          .split(/[,|•]/)
          .map(s => s.replace(/\.$/, "").trim())
          .filter(s => s.length > 0 && !s.toLowerCase().includes("incorporate") && !s.toLowerCase().includes("missing"));
        
        if (newSkills.length > 0) {
          data.skills = [...new Set([...data.skills, ...newSkills])];
        } else {
          data.skills.push(improvedText);
        }
      } else if (type === "improve" || type === "remove") {
        if (originalText) {
          data.skills = data.skills.filter(s => s !== originalText);
        }
        if (type === "improve" && improvedText) {
          data.skills.push(improvedText);
        }
      }
    } else if (section === "experience") {
      data.experience.forEach(exp => {
        if (type === "improve" && originalText) {
          if (exp.description && exp.description.includes(originalText)) {
            exp.description = exp.description.replace(originalText, improvedText);
          } else {
            const escaped = originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(escaped, 'i');
            if (exp.description && regex.test(exp.description)) {
              exp.description = exp.description.replace(regex, improvedText);
            }
          }
        } else if (type === "remove" && originalText) {
          if (exp.description && exp.description.includes(originalText)) {
            exp.description = exp.description.replace(originalText, "");
          }
        }
      });
      
      if (type === "add") {
        if (data.experience.length === 0) {
          data.experience.push({
            title: "Software Engineer",
            company: "Organization",
            startDate: "2024",
            endDate: "Present",
            description: improvedText
          });
        } else {
          data.experience[0].description += "\n" + improvedText;
        }
      }
    } else if (section === "projects") {
      data.projects.forEach(proj => {
        if (type === "improve" && originalText) {
          if (proj.description && proj.description.includes(originalText)) {
            proj.description = proj.description.replace(originalText, improvedText);
          }
        } else if (type === "remove" && originalText) {
          if (proj.description && proj.description.includes(originalText)) {
            proj.description = proj.description.replace(originalText, "");
          }
        }
      });
      
      if (type === "add") {
        if (data.projects.length === 0) {
          data.projects.push({
            name: "Project",
            description: improvedText
          });
        } else {
          data.projects[0].description += "\n" + improvedText;
        }
      }
    } else if (section === "education") {
      data.education.forEach(edu => {
        if (type === "improve" && originalText) {
          if (edu.degree && edu.degree.includes(originalText)) {
            edu.degree = edu.degree.replace(originalText, improvedText);
          }
        }
      });
    } else if (section === "certifications" || section === "achievements") {
      if (type === "add") {
        data.certifications.push(improvedText);
      } else if (type === "improve" && originalText) {
        const idx = data.certifications.indexOf(originalText);
        if (idx !== -1) {
          data.certifications[idx] = improvedText;
        } else {
          data.certifications.push(improvedText);
        }
      } else if (type === "remove" && originalText) {
        data.certifications = data.certifications.filter(c => c !== originalText);
      }
    }
  });
  
  return data;
}

// Generate highly formatted professional PDF
const generateProfessionalPDF = (res, resumeData, cleanFilename) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 45, bottom: 45, left: 45, right: 45 }
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}.pdf"`);
  
  doc.pipe(res);

  // Constants for styling
  const primaryColor = "#0f172a";   // Slate 900
  const secondaryColor = "#475569"; // Slate 600
  const accentColor = "#1e40af";    // Blue 800
  const bodyColor = "#334155";      // Slate 700
  const dividerColor = "#cbd5e1";   // Slate 300

  // Margins boundary
  const leftMargin = 45;
  const rightBoundary = 550;
  const contentWidth = rightBoundary - leftMargin;

  // 1. Header (Name, contact details)
  doc.fillColor(primaryColor);
  doc.font("Helvetica-Bold").fontSize(20).text(resumeData.name || "Resume Profile", { align: "center" });
  doc.moveDown(0.25);

  const contactParts = [];
  if (resumeData.email) contactParts.push(resumeData.email);
  if (resumeData.phone) contactParts.push(resumeData.phone);
  if (resumeData.location) contactParts.push(resumeData.location);
  
  doc.fillColor(secondaryColor);
  doc.font("Helvetica").fontSize(9).text(contactParts.join("   |   "), { align: "center" });
  doc.moveDown(0.5);

  // Line divider
  doc.strokeColor(dividerColor).lineWidth(1).moveTo(leftMargin, doc.y).lineTo(rightBoundary, doc.y).stroke();
  doc.moveDown(0.6);

  // Helper function to render section headings with divider lines
  const renderSectionHeader = (title) => {
    if (doc.y > 730) {
      doc.addPage();
    }
    doc.fillColor(accentColor);
    doc.font("Helvetica-Bold").fontSize(11).text(title.toUpperCase(), { lineGap: 3 });
    doc.strokeColor(dividerColor).lineWidth(0.5).moveTo(leftMargin, doc.y).lineTo(rightBoundary, doc.y).stroke();
    doc.moveDown(0.5);
  };

  // 2. Summary
  if (resumeData.summary && resumeData.summary.trim().length > 0) {
    renderSectionHeader("Professional Summary");
    doc.fillColor(bodyColor);
    doc.font("Helvetica").fontSize(9.5).text(resumeData.summary, { align: "justify", lineGap: 2.5, width: contentWidth });
    doc.moveDown(0.8);
  }

  // 3. Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    renderSectionHeader("Skills & Expertise");
    doc.fillColor(bodyColor);
    
    let skillsList = resumeData.skills;
    const categorized = skillsList.some(s => s.includes(":"));
    if (categorized) {
      skillsList.forEach(s => {
        if (doc.y > 760) doc.addPage();
        if (s.includes(":")) {
          const parts = s.split(":");
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor(primaryColor).text(parts[0] + ": ", { continued: true });
          doc.font("Helvetica").fontSize(9.5).fillColor(bodyColor).text(parts[1].trim(), { lineGap: 3.5, width: contentWidth });
        } else {
          doc.font("Helvetica").fontSize(9.5).fillColor(bodyColor).text(s, { lineGap: 3.5, width: contentWidth });
        }
      });
    } else {
      doc.font("Helvetica").fontSize(9.5).text(skillsList.join(", "), { lineGap: 2.5, width: contentWidth });
    }
    doc.moveDown(0.8);
  }

  // 4. Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    renderSectionHeader("Professional Experience");
    
    resumeData.experience.forEach(exp => {
      if (doc.y > 730) {
        doc.addPage();
      }
      
      const currentY = doc.y;
      const companyText = exp.company ? ` at ${exp.company}` : "";
      const expHeaderLeft = `${exp.title || "Software Engineer"}${companyText}`;
      
      // Render Left text with wrapped control width so it never overrides the right date
      doc.fillColor(primaryColor);
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text(expHeaderLeft, leftMargin, currentY, { width: contentWidth - 140 });
      
      // Render Right text (Date) with lineBreak: false so it never wraps vertically
      const dateText = `${exp.startDate || ""} - ${exp.endDate || ""}`;
      doc.fillColor(secondaryColor);
      doc.font("Helvetica").fontSize(9.5);
      const dateWidth = doc.widthOfString(dateText);
      doc.text(dateText, rightBoundary - dateWidth, currentY, { lineBreak: false });
      
      // Advance doc.y based on left text height
      const leftHeight = doc.heightOfString(expHeaderLeft, { width: contentWidth - 140 });
      doc.y = currentY + leftHeight + 3;
      
      // Description bullets
      doc.fillColor(bodyColor);
      doc.font("Helvetica").fontSize(9);
      
      const bullets = (exp.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(bullet => {
        if (doc.y > 760) {
          doc.addPage();
        }
        const cleanBullet = bullet.replace(/^[\-•\*\s]+/, "");
        doc.text(`•   ${cleanBullet}`, { indent: 12, lineGap: 2.5, width: contentWidth - 12 });
      });
      
      doc.moveDown(0.65);
    });
  }

  // 5. Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    renderSectionHeader("Key Projects");
    
    resumeData.projects.forEach(proj => {
      if (doc.y > 730) {
        doc.addPage();
      }
      
      doc.fillColor(primaryColor);
      doc.font("Helvetica-Bold").fontSize(10).text(proj.name || "Project");
      doc.moveDown(0.2);
      
      doc.fillColor(bodyColor);
      doc.font("Helvetica").fontSize(9);
      
      const bullets = (proj.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(bullet => {
        if (doc.y > 760) {
          doc.addPage();
        }
        const cleanBullet = bullet.replace(/^[\-•\*\s]+/, "");
        doc.text(`•   ${cleanBullet}`, { indent: 12, lineGap: 2.5, width: contentWidth - 12 });
      });
      
      doc.moveDown(0.65);
    });
  }

  // 6. Education
  if (resumeData.education && resumeData.education.length > 0) {
    renderSectionHeader("Education");
    
    resumeData.education.forEach(edu => {
      if (doc.y > 730) {
        doc.addPage();
      }
      
      const currentY = doc.y;
      const degreeText = edu.degree ? `${edu.degree}${edu.field ? ' in ' + edu.field : ''}` : "Studies";
      const eduHeaderLeft = `${degreeText} at ${edu.school || "Institution"}`;
      
      doc.fillColor(primaryColor);
      doc.font("Helvetica-Bold").fontSize(9.5);
      doc.text(eduHeaderLeft, leftMargin, currentY, { width: contentWidth - 140 });
      
      const dateText = `${edu.startDate || ""} - ${edu.endDate || ""}`;
      doc.fillColor(secondaryColor);
      doc.font("Helvetica").fontSize(9.5);
      const dateWidth = doc.widthOfString(dateText);
      doc.text(dateText, rightBoundary - dateWidth, currentY, { lineBreak: false });
      
      const leftHeight = doc.heightOfString(eduHeaderLeft, { width: contentWidth - 140 });
      doc.y = currentY + leftHeight + 5;
    });
  }

  // 7. Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    renderSectionHeader("Certifications & Achievements");
    doc.fillColor(bodyColor);
    doc.font("Helvetica").fontSize(9);
    
    resumeData.certifications.forEach(cert => {
      if (doc.y > 750) {
        doc.addPage();
      }
      const cleanCert = cert.replace(/^[\-•\*\s]+/, "");
      doc.text(`•   ${cleanCert}`, { indent: 12, lineGap: 2.5, width: contentWidth - 12 });
    });
  }

  doc.end();
};

// Generate clean plaintext layout
const generateCleanTxt = (resumeData) => {
  let output = `${resumeData.name || "Resume Profile"}\n`;
  const contact = [];
  if (resumeData.email) contact.push(resumeData.email);
  if (resumeData.phone) contact.push(resumeData.phone);
  if (resumeData.location) contact.push(resumeData.location);
  output += contact.join("  |  ") + "\n\n";
  
  if (resumeData.summary) {
    output += `PROFESSIONAL SUMMARY\n====================\n${resumeData.summary}\n\n`;
  }
  
  if (resumeData.skills && resumeData.skills.length > 0) {
    output += `SKILLS & EXPERTISE\n==================\n`;
    let skillsList = resumeData.skills;
    const categorized = skillsList.some(s => s.includes(":"));
    if (categorized) {
      skillsList.forEach(s => {
        output += `${s}\n`;
      });
    } else {
      output += `${skillsList.join(", ")}\n`;
    }
    output += `\n`;
  }
  
  if (resumeData.experience && resumeData.experience.length > 0) {
    output += `PROFESSIONAL EXPERIENCE\n=======================\n`;
    resumeData.experience.forEach(exp => {
      output += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      const bullets = (exp.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(b => {
        output += `  • ${b.replace(/^[\-•\*\s]+/, "")}\n`;
      });
      output += `\n`;
    });
  }
  
  if (resumeData.projects && resumeData.projects.length > 0) {
    output += `KEY PROJECTS\n============\n`;
    resumeData.projects.forEach(proj => {
      output += `${proj.name}\n`;
      const bullets = (proj.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(b => {
        output += `  • ${b.replace(/^[\-•\*\s]+/, "")}\n`;
      });
      output += `\n`;
    });
  }
  
  if (resumeData.education && resumeData.education.length > 0) {
    output += `EDUCATION\n=========\n`;
    resumeData.education.forEach(edu => {
      const degreeText = edu.degree ? `${edu.degree}${edu.field ? ' in ' + edu.field : ''}` : "Studies";
      output += `${degreeText} at ${edu.school} (${edu.startDate} - ${edu.endDate})\n`;
    });
  }

  if (resumeData.certifications && resumeData.certifications.length > 0) {
    output += `CERTIFICATIONS & ACHIEVEMENTS\n=============================\n`;
    resumeData.certifications.forEach(cert => {
      output += `  • ${cert.replace(/^[\-•\*\s]+/, "")}\n`;
    });
  }
  
  return output;
};

// Generate clean Markdown layout
const generateCleanMarkdown = (resumeData) => {
  let output = `# ${resumeData.name || "Resume Profile"}\n\n`;
  const contact = [];
  if (resumeData.email) contact.push(`**Email:** ${resumeData.email}`);
  if (resumeData.phone) contact.push(`**Phone:** ${resumeData.phone}`);
  if (resumeData.location) contact.push(`**Location:** ${resumeData.location}`);
  
  if (contact.length > 0) {
    output += contact.join("  |  ") + "\n\n";
  }
  
  if (resumeData.summary) {
    output += `## Professional Summary\n${resumeData.summary}\n\n`;
  }
  
  if (resumeData.skills && resumeData.skills.length > 0) {
    output += `## Skills & Expertise\n`;
    let skillsList = resumeData.skills;
    const categorized = skillsList.some(s => s.includes(":"));
    if (categorized) {
      skillsList.forEach(s => {
        output += `- ${s}\n`;
      });
    } else {
      output += `- ${skillsList.join(", ")}\n`;
    }
    output += `\n`;
  }
  
  if (resumeData.experience && resumeData.experience.length > 0) {
    output += `## Professional Experience\n`;
    resumeData.experience.forEach(exp => {
      output += `### ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      const bullets = (exp.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(b => {
        output += `- ${b.replace(/^[\-•\*\s]+/, "")}\n`;
      });
      output += `\n`;
    });
  }
  
  if (resumeData.projects && resumeData.projects.length > 0) {
    output += `## Key Projects\n`;
    resumeData.projects.forEach(proj => {
      output += `### ${proj.name}\n`;
      const bullets = (proj.description || "").split(/\r?\n/).map(b => b.trim()).filter(b => b.length > 0);
      bullets.forEach(b => {
        output += `- ${b.replace(/^[\-•\*\s]+/, "")}\n`;
      });
      output += `\n`;
    });
  }
  
  if (resumeData.education && resumeData.education.length > 0) {
    output += `## Education\n`;
    resumeData.education.forEach(edu => {
      const degreeText = edu.degree ? `${edu.degree}${edu.field ? ' in ' + edu.field : ''}` : "Studies";
      output += `* **${degreeText}** at ${edu.school} (${edu.startDate} - ${edu.endDate})\n`;
    });
    output += `\n`;
  }

  if (resumeData.certifications && resumeData.certifications.length > 0) {
    output += `## Certifications & Achievements\n`;
    resumeData.certifications.forEach(cert => {
      output += `- ${cert.replace(/^[\-•\*\s]+/, "")}\n`;
    });
  }
  
  return output;
};

function applySuggestionsToPlainText(parsedText, suggestions, appliedIds) {
  let text = parsedText || "";
  const ids = Array.isArray(appliedIds) ? appliedIds : [];
  const toApply = suggestions.filter((s) => {
    if (!ids.length) return true;
    return ids.includes(s.id);
  });

  for (const s of toApply) {
    const before = String(s.original || s.before || "").trim();
    const after = String(s.improved || s.after || "").trim();
    if (!before || !after) continue;
    if (text.includes(before)) {
      text = text.replace(before, after);
      continue;
    }
    const escaped = before.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    if (regex.test(text)) {
      text = text.replace(regex, after);
    }
  }

  return text;
}

const downloadModifiedResume = async (req, res) => {
  try {
    const { resumeId, appliedIds, format } = req.body;
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    const suggestions =
      resume.suggestions ||
      resume.atsResult?.suggestions ||
      [];
    const cleanFilename = `modified_${(resume.fileName || "resume").replace(/\.[^/.]+$/, "")}`;

    if (resume.parsedText && suggestions.length > 0) {
      const plainTextContent = applySuggestionsToPlainText(
        resume.parsedText,
        suggestions,
        appliedIds || []
      );

      if (format === "json") {
        return res.status(200).json({
          success: true,
          plainText: plainTextContent,
          markdown: plainTextContent,
        });
      }

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}.txt"`);
      return res.send(plainTextContent);
    }

    let resumeData = resume.parsedData;
    if (!resumeData || !resumeData.name || (!resumeData.experience?.length && !resumeData.skills?.length && !resumeData.education?.length)) {
      resumeData = extractResumeDataFromText(resume.parsedText || "");
    }

    const finalResumeData = applySuggestionsToStructuredData(resumeData, suggestions, appliedIds || []);

    if (format === "json") {
      return res.status(200).json({
        success: true,
        plainText: generateCleanTxt(finalResumeData),
        markdown: generateCleanMarkdown(finalResumeData),
      });
    }

    const plainTextContent = generateCleanTxt(finalResumeData);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}.txt"`);
    return res.send(plainTextContent);
  } catch (error) {
    console.error("Download/Apply Modified Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadResume,
  analyzeResume,
  getResumes,
  getResumeById,
  deleteResume,
  downloadModifiedResume,
};