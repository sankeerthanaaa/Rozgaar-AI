const { getAIResponse } = require("./ai.service");

function extractJSON(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("No valid JSON object found in AI response");
}

function getLocalFallbackSuggestions(scoringResult) {
  const { missingKeywords, sectionScore, formattingScore, wordCount } = scoringResult;
  const suggestions = [];
  let idCounter = 1;

  if (missingKeywords.length > 0) {
    suggestions.push({
      id: idCounter++,
      section: "Skills",
      priority: "High",
      type: "Add",
      original: "",
      improved: `Incorporate these missing target keywords to align with the job description: ${missingKeywords.slice(0, 5).join(", ")}.`,
    });
  }

  if (sectionScore < 100) {
    suggestions.push({
      id: idCounter++,
      section: "Structure",
      priority: "High",
      type: "Add",
      original: "",
      improved:
        "Your resume is missing standard sections (Experience, Education, Skills, Projects, or Summary). Add appropriate headings to improve parser read rate.",
    });
  }

  if (formattingScore < 100) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      priority: "Medium",
      type: "Improve",
      original: "",
      improved:
        "Include complete contact details (email, phone, LinkedIn or GitHub links) in a clean header at the top of your resume.",
    });
  }

  if (wordCount < 150) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      priority: "Medium",
      type: "Improve",
      original: "",
      improved:
        "Expand your experience descriptions, list projects built, and highlight technical skills to present a more comprehensive profile.",
    });
  } else if (wordCount > 1200) {
    suggestions.push({
      id: idCounter++,
      section: "Summary",
      priority: "Low",
      type: "Remove",
      original: "",
      improved:
        "Keep descriptions concise, focus on relevant experience, and remove older or non-technical roles to keep it within 1-2 pages.",
    });
  }

  suggestions.push({
    id: idCounter++,
    section: "Experience",
    priority: "Medium",
    type: "Improve",
    original: "Responsible for writing clean code and fixing bugs.",
    improved:
      "Developed and deployed 5+ scalable frontend features using React, reducing page load times by 20% and resolving critical bugs in production.",
  });

  return {
    suggestions,
    strengths: ["Structured layout matching parser guidelines.", "Good basic section layout."],
    weaknesses:
      missingKeywords.length > 0
        ? ["Several missing domain keywords for the role."]
        : ["Bullet points could be more impact-driven."],
    improvementTips: [
      "Use metric-focused bullet points.",
      "Update top header with links to Github and LinkedIn.",
    ],
  };
}

/**
 * AI is used ONLY for suggestions — never for scores.
 */
async function generateSuggestions(resumeText, jobDescription, keywords, scoringResult) {
  const jdContext = jobDescription ? `\n\nTarget Job Description:\n${jobDescription}` : "";
  const keywordsContext =
    keywords && keywords.length > 0 ? `\n\nTarget Keywords:\n${keywords.join(", ")}` : "";

  const prompt = `
You are an expert resume reviewer. Analyze the following resume text and suggest improvements.
${jdContext}
${keywordsContext}

Resume Text:
${resumeText}

Your task is to identify areas for improvement and generate:
1. Actionable suggestions for modifying specific text. For each suggestion, provide the original text (must exist exactly in the resume) and an improved version (action-oriented, quantified if possible).
2. Key strengths of the resume.
3. Key weaknesses of the resume.
4. General improvement tips.

CRITICAL: You must NEVER generate or output any ATS scores, keyword match scores, formatting scores, or job match scores.

You MUST respond with a JSON object in this exact schema:
{
  "suggestions": [
    {
      "id": 1,
      "section": "Experience",
      "priority": "High",
      "type": "Improve",
      "original": "original text from resume here",
      "improved": "improved text to replace original here"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvementTips": ["tip 1", "tip 2"]
}

Only suggest practical, realistic improvements. Ensure the "original" text exists as a substring in the resume so it can be located and replaced.
Respond ONLY with valid JSON. No markdown fences, no explanations.
`;

  try {
    const responseText = await getAIResponse(
      prompt,
      "You are an expert resume reviewer. Respond with ONLY a valid JSON object. No markdown, no code fences. Start with { and end with }."
    );
    const parsed = extractJSON(responseText);
    if (parsed && Array.isArray(parsed.suggestions)) {
      return parsed;
    }
  } catch (aiError) {
    console.log(
      "AI suggestion generation failed, using local fallback:",
      aiError.message
    );
  }

  return getLocalFallbackSuggestions(scoringResult);
}

module.exports = {
  generateSuggestions,
  getLocalFallbackSuggestions,
};
