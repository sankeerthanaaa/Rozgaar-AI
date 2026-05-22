const { getAIResponse } = require("./ai.service");

// Common technical skills list for fallback scanner
const CORE_KEYWORDS = [
  "react", "angular", "vue", "node.js", "express", "next.js", "javascript", "typescript",
  "python", "django", "flask", "java", "spring", "c#", ".net", "go", "rust", "ruby", "rails",
  "sql", "mysql", "postgresql", "mongodb", "nosql", "redis", "docker", "kubernetes",
  "aws", "azure", "gcp", "git", "ci/cd", "html", "css", "rest api", "graphql",
  "microservices", "tailwind", "bootstrap", "redux", "webpack", "jira", "agile", "scrum",
  "c++", "c", "php", "laravel", "sass", "less", "webpack", "babel", "testing", "jest",
  "cypress", "selenium", "machine learning", "deep learning", "nlp", "tableau", "powerbi",
  "excel", "data analysis", "cloud", "serverless", "amplitude", "segment", "graphql",
  "figma", "sketch", "adobe xd", "ui/ux", "product management", "scrum master"
];

// Target role keyword mappings for fallback baselines
const ROLE_BASELINES = {
  "software engineer": ["react", "node.js", "javascript", "sql", "git", "rest api"],
  "frontend developer": ["react", "javascript", "typescript", "html", "css", "tailwind", "git"],
  "backend developer": ["node.js", "express", "sql", "mongodb", "rest api", "docker", "git"],
  "data analyst": ["sql", "python", "excel", "tableau", "powerbi", "data analysis"],
  "data scientist": ["python", "machine learning", "deep learning", "sql", "nlp"],
  "product manager": ["product management", "agile", "scrum", "jira", "roadmaps"],
  "ux designer": ["ui/ux", "figma", "sketch", "adobe xd", "wireframing"],
  "devops engineer": ["docker", "kubernetes", "aws", "ci/cd", "linux", "terraform", "git"],
  "full stack developer": ["react", "node.js", "javascript", "sql", "mongodb", "rest api", "git"]
};

// Clean and normalize text: lowercase, remove punctuation
function normalizeText(txt) {
  if (!txt) return "";
  return txt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')        // normalize spaces
    .trim();
}

// Compare skills intelligently with support for aliases/partial checks
function isSkillInResume(targetSkill, resumeTextNormalized, rawResumeText) {
  const skill = targetSkill.toLowerCase().trim();
  if (!skill) return false;
  
  // Match using word boundaries in raw text first (e.g., C#, .NET, C++)
  const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const rawRegex = new RegExp(`\\b${escaped}\\b`, 'i');
  if (rawRegex.test(rawResumeText)) {
    return true;
  }
  
  // Normalize both for fuzzy matching
  const cleanTarget = skill.replace(/[^a-z0-9]/g, '');
  const cleanResume = resumeTextNormalized.replace(/[^a-z0-9]/g, '');
  if (!cleanTarget) return false;

  if (cleanResume.includes(cleanTarget)) {
    return true;
  }
  
  // Common alias dictionaries
  const aliases = {
    "nodejs": ["node", "node.js"],
    "node": ["nodejs", "node.js"],
    "node.js": ["node", "nodejs"],
    "expressjs": ["express"],
    "express": ["expressjs"],
    "js": ["javascript"],
    "javascript": ["js"],
    "ts": ["typescript"],
    "typescript": ["ts"],
    "golang": ["go"],
    "go": ["golang"],
    "k8s": ["kubernetes"],
    "kubernetes": ["k8s"],
    "git": ["github", "gitlab"],
    "postgres": ["postgresql"],
    "postgresql": ["postgres"]
  };
  
  if (aliases[cleanTarget]) {
    for (const alias of aliases[cleanTarget]) {
      const cleanAlias = alias.replace(/[^a-z0-9]/g, '');
      if (cleanResume.includes(cleanAlias)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Strips markdown fences and extracts the first valid JSON object from
 * an AI response string. Throws if nothing parseable is found.
 */
function extractJSON(text) {
  // Remove markdown code fences
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  // Find the outermost JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No valid JSON object found in AI response');
}

const analyzeATS = async (resumeText, jobDescription, keywords) => {
  try {
    const jdContext = jobDescription ? `\n\nTarget Job Description:\n${jobDescription}` : '';
    const keywordsContext = (keywords && keywords.length > 0) ? `\n\nTarget Keywords:\n${keywords.join(', ')}` : '';

    const prompt = `
      Analyze this resume for ATS (Applicant Tracking System) compatibility${jobDescription || keywords ? ' against the provided Job Description and/or Keywords' : ''}.
      Return a JSON object with this exact structure:
      {
        "atsScore": <number between 0-100>,
        "jobRole": "<job role matched or Software Engineer>",
        "breakdown": [
          { "label": "Keyword match", "value": <number 0-100> },
          { "label": "Section completeness", "value": <number 0-100> },
          { "label": "Formatting score", "value": <number 0-100> }
        ],
        "keywords": {
          "present": ["<keyword1>", "<keyword2>"],
          "missing": ["<keyword1>", "<keyword2>"]
        },
        "jdMatch": {
          "score": <number 0-100>,
          "present": ["<keyword1>", "<keyword2>"],
          "missing": ["<keyword1>", "<keyword2>"]
        },
        "suggestions": [
          {
            "id": 1,
            "section": "<Experience|Skills|Summary|Education>",
            "type": "<Improve|Add|Remove>",
            "priority": "<High|Medium|Low>",
            "before": "<original text or null>",
            "after": "<suggested text or action>"
          }
        ]
      }

      Resume Text:
      ${resumeText}
      ${jdContext}
      ${keywordsContext}
    `;

    try {
      const responseText = await getAIResponse(
        prompt,
        "You are an expert resume analyzer. You must respond with ONLY a valid JSON object. No markdown, no code fences, no explanation text before or after. No dashes, no bullet points. Start your response with { and end with }."
      );

      try {
        const parsed = extractJSON(responseText);
        return parsed;
      } catch (parseErr) {
        console.log("AI response was not valid JSON, using local fallback:", parseErr.message);
        return runFallbackATS(resumeText, jobDescription, keywords);
      }
    } catch (aiError) {
      console.log("AI unavailable in analyzeATS, using local fallback:", aiError.message);
      return runFallbackATS(resumeText, jobDescription, keywords);
    }
  } catch (error) {
    console.error("ATS Service Error:", error);
    throw error;
  }
};

/**
 * Fallback ATS scanner - executes when AI is not configured
 */
function runFallbackATS(resumeText, jobDescription = "", keywords = []) {
  const normalizedResume = normalizeText(resumeText);
  
  // 1. Identify skills present in the resume
  const resumeSkills = CORE_KEYWORDS.filter(skill => 
    isSkillInResume(skill, normalizedResume, resumeText)
  );

  // 2. Identify target skills from Job Description / Role / Custom keywords
  let targetSkills = [];

  // Extract from Job Description
  if (jobDescription && jobDescription.trim().length > 0) {
    const normalizedJd = normalizeText(jobDescription);
    targetSkills = CORE_KEYWORDS.filter(skill => 
      isSkillInResume(skill, normalizedJd, jobDescription)
    );
  }

  // Merge with role-based baseline skills if a role is provided
  if (keywords && keywords.length > 0) {
    keywords.forEach(kw => {
      const cleanKw = kw.toLowerCase().trim();
      if (ROLE_BASELINES[cleanKw]) {
        targetSkills = [...new Set([...targetSkills, ...ROLE_BASELINES[cleanKw]])];
      } else {
        const customExtracted = CORE_KEYWORDS.filter(skill => 
          isSkillInResume(skill, normalizeText(kw), kw)
        );
        if (customExtracted.length > 0) {
          targetSkills = [...new Set([...targetSkills, ...customExtracted])];
        } else if (cleanKw && !targetSkills.includes(cleanKw)) {
          targetSkills.push(cleanKw);
        }
      }
    });
  }

  // If targetSkills is still empty, fallback to a general baseline
  if (targetSkills.length === 0) {
    targetSkills = ["react", "node.js", "javascript", "sql", "git", "rest api"];
  }

  // 3. Compute matching and missing skills
  const presentKeywords = targetSkills.filter(skill => 
    isSkillInResume(skill, normalizedResume, resumeText)
  );
  const missingKeywords = targetSkills.filter(skill => 
    !isSkillInResume(skill, normalizedResume, resumeText)
  );

  const keywordScore = targetSkills.length > 0 
    ? Math.round((presentKeywords.length / targetSkills.length) * 100)
    : 80;

  // 4. Section completeness score
  let sectionScore = 0;
  const sections = [
    { name: "Experience", patterns: [/experience/i, /work history/i, /employment/i] },
    { name: "Education", patterns: [/education/i, /academic/i, /university/i, /college/i] },
    { name: "Skills", patterns: [/skills/i, /technologies/i, /tools/i] },
    { name: "Projects", patterns: [/projects/i, /portfolio/i, /personal projects/i] },
    { name: "Summary", patterns: [/summary/i, /profile/i, /objective/i, /about me/i] }
  ];
  
  sections.forEach(sec => {
    if (sec.patterns.some(pattern => pattern.test(normalizedResume))) {
      sectionScore += 20;
    }
  });

  // 5. Formatting checks
  let formattingScore = 0;
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText)) formattingScore += 25;
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{10}\b|\+\d{1,3}/.test(resumeText)) formattingScore += 25;
  if (/github\.com|linkedin\.com|http|www\./.test(resumeText)) formattingScore += 25;
  
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount >= 150 && wordCount <= 1200) formattingScore += 25;

  const atsScore = Math.round((keywordScore + sectionScore + formattingScore) / 3);

  // Capitalize helpers
  const capitalize = str => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const cleanPresent = presentKeywords.map(k => capitalize(k));
  const cleanMissing = missingKeywords.map(k => capitalize(k));

  // 6. Suggestions generator
  const suggestions = [];
  let idCounter = 1;

  if (cleanMissing.length > 0) {
    suggestions.push({
      id: idCounter++,
      section: "Skills",
      type: "Add",
      priority: "High",
      before: null,
      after: `Incorporate these missing target keywords to align with the job description: ${cleanMissing.slice(0, 5).join(", ")}.`
    });
  }

  const missingSectionNames = [];
  sections.forEach(sec => {
    if (!sec.patterns.some(pattern => pattern.test(normalizedResume))) {
      missingSectionNames.push(sec.name);
    }
  });

  if (missingSectionNames.length > 0) {
    suggestions.push({
      id: idCounter++,
      section: "Structure",
      type: "Add",
      priority: "High",
      before: null,
      after: `Your resume is missing standard sections: ${missingSectionNames.join(", ")}. Add headings for these to improve parser read rate.`
    });
  }

  if (formattingScore < 100) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      type: "Improve",
      priority: "Medium",
      before: "Missing complete contact details (email, phone, or LinkedIn links).",
      after: "Include your email, phone number, and links to your professional profiles (GitHub, LinkedIn) in a clean header at the top of the resume."
    });
  }

  if (wordCount < 150) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      type: "Improve",
      priority: "Medium",
      before: `Resume word count is low (${wordCount} words).`,
      after: "Expand your experience descriptions, list projects built, and highlight technical skills to present a more comprehensive profile."
    });
  } else if (wordCount > 1200) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      type: "Remove",
      priority: "Low",
      before: `Resume is extremely long (${wordCount} words).`,
      after: "Keep descriptions concise, focus on relevant experience, and remove older or non-technical roles to keep it within 1-2 pages."
    });
  }

  suggestions.push({
    id: idCounter++,
    section: "Experience",
    type: "Improve",
    priority: "Medium",
    before: "Responsible for writing clean code and fixing bugs.",
    after: "Use action-oriented metrics: \"Developed and deployed 5+ scalable frontend features using React, reducing page load times by 20% and resolving critical bugs in production.\""
  });

  return {
    atsScore,
    jobRole: keywords.length > 0 ? keywords[0] : "Software Engineer",
    breakdown: [
      { label: "Keyword match", value: keywordScore },
      { label: "Section completeness", value: sectionScore },
      { label: "Formatting score", value: formattingScore }
    ],
    keywords: {
      present: cleanPresent,
      missing: cleanMissing
    },
    jdMatch: {
      score: keywordScore,
      present: cleanPresent,
      missing: cleanMissing
    },
    suggestions
  };
}

module.exports = { analyzeATS };