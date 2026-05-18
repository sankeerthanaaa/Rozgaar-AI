const { getAIResponse } = require("./ai.service");

const getSkillGap = async (resumeText, jobDescription) => {
  try {
    const prompt = `
      Analyze the skill gap between this resume and job description.
      Return a JSON object with this exact structure:
      {
        "overallGapScore": <number between 0-100, 100 means no gap>,
        "summary": "<brief summary of skill gap>",
        "technicalSkills": {
          "have": ["<skill1>", "<skill2>"],
          "missing": ["<skill1>", "<skill2>"],
          "partial": ["<skill1>", "<skill2>"]
        },
        "softSkills": {
          "have": ["<skill1>", "<skill2>"],
          "missing": ["<skill1>", "<skill2>"]
        },
        "heatmap": [
          {
            "skill": "<skill name>",
            "level": "<none | beginner | intermediate | expert>",
            "required": "<none | beginner | intermediate | expert>",
            "gap": "<none | low | medium | high>"
          }
        ],
        "learningPath": [
          {
            "skill": "<skill name>",
            "priority": "<high | medium | low>",
            "resources": ["<resource1>", "<resource2>"]
          }
        ],
        "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"]
      }

      Resume Text:
      ${resumeText}

      Job Description:
      ${jobDescription}
    `;

    const result = await getAIResponse(prompt);
    return result;
  } catch (error) {
    console.error("Skill Gap Service Error:", error);
    throw error;
  }
};

module.exports = { getSkillGap };