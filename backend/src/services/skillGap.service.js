const {
  runDeterministicATSScoring,
  normalizeText,
} = require("./atsScoring.engine");

const SOFT_SKILL_PATTERNS = [
  "communication",
  "leadership",
  "teamwork",
  "problem solving",
  "collaboration",
  "time management",
];

function detectSoftSkills(text, normalizedText) {
  const have = [];
  const missing = [];
  SOFT_SKILL_PATTERNS.forEach((skill) => {
    if (normalizedText.includes(skill)) {
      have.push(skill.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
    } else {
      missing.push(skill.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
    }
  });
  return { have, missing };
}

/**
 * Deterministic skill gap analysis — no AI.
 */
const getSkillGap = async (resumeText, jobDescription) => {
  const scores = runDeterministicATSScoring(resumeText, jobDescription, []);
  const normalizedResume = normalizeText(resumeText);
  const softSkills = detectSoftSkills(resumeText, normalizedResume);

  const heatmap = scores.missingKeywords.map((skill) => ({
    skill,
    level: "none",
    required: "intermediate",
    gap: "high",
  }));

  scores.presentKeywords.forEach((skill) => {
    heatmap.push({
      skill,
      level: "intermediate",
      required: "intermediate",
      gap: "none",
    });
  });

  const learningPath = scores.missingKeywords.slice(0, 5).map((skill, idx) => ({
    skill,
    priority: idx < 2 ? "high" : idx < 4 ? "medium" : "low",
    resources: [
      `Official ${skill} documentation`,
      `${skill} fundamentals course`,
    ],
  }));

  const suggestions = [];
  if (scores.missingKeywords.length > 0) {
    suggestions.push(
      `Prioritize learning: ${scores.missingKeywords.slice(0, 3).join(", ")}.`
    );
  }
  if (softSkills.missing.length > 0) {
    suggestions.push(
      `Highlight soft skills in your summary: ${softSkills.missing.slice(0, 3).join(", ")}.`
    );
  }

  return {
    overallGapScore: scores.keywordScore,
    summary: `Skill coverage is ${scores.keywordScore}%. ${scores.missingKeywords.length} technical skills from the job description are not reflected on the resume.`,
    technicalSkills: {
      have: scores.presentKeywords,
      missing: scores.missingKeywords,
      partial: [],
    },
    softSkills,
    heatmap,
    learningPath,
    suggestions,
  };
};

module.exports = { getSkillGap };
