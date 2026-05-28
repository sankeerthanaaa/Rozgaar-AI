const linkedinService = require("../services/linkedin.service");
const { analyzeATS } = require("../services/ats.service");
const { freezeResumeText } = require("../services/atsScoring.engine");
const Resume = require("../models/Resume.model");

const linkedinCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code is required",
      });
    }

    const profile = await linkedinService.handleCallback(code);

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("LinkedIn Callback Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const importLinkedinProfile = async (req, res) => {
  try {
    const { accessToken, profileUrl, jobDescription, role } = req.body;

    if (!accessToken && !profileUrl) {
      return res.status(400).json({
        success: false,
        message: "Access token or profile URL is required",
      });
    }

    let profileData;
    let resumeText = "";

    if (profileUrl) {
      profileData = await linkedinService.importProfileFromUrl(profileUrl, role);
      resumeText = profileData.textRepresentation;
    } else {
      profileData = await linkedinService.importProfile(accessToken);
      resumeText = `
        Name: ${profileData.name}
        Email: ${profileData.email}
        Headline: ${profileData.headline || ""}
        Summary: ${profileData.summary || ""}
        Skills: ${(profileData.skills || []).join(", ")}
      `;
    }

    const frozenText = freezeResumeText(resumeText);

    const keywords = role ? [role] : [];
    let atsResultData = null;
    let atsScoreVal = 0;
    let suggestionsArr = [];

    try {
      atsResultData = await analyzeATS(frozenText, jobDescription, keywords);
      atsScoreVal = atsResultData.atsScore || 0;
      suggestionsArr = atsResultData.suggestions || [];
    } catch (atsError) {
      console.error("Failed to run ATS analysis during LinkedIn import:", atsError);
    }

    // Save as a Resume database entry under the authenticated user
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: `linkedin_${profileData.name.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileUrl: profileUrl || "https://linkedin.com",
      fileSize: 0,
      mimeType: "application/linkedin",
      parsedText: frozenText,
      parsedData: {
        name: profileData.name,
        email: profileData.email,
        summary: profileData.summary || "",
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        education: profileData.education || [],
      },
      atsScore: atsScoreVal,
      atsResult: atsResultData || {},
      suggestions: suggestionsArr,
      status: atsResultData ? "analyzed" : "parsed",
    });

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("LinkedIn Import Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = { linkedinCallback, importLinkedinProfile };