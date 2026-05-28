const {
  runDeterministicATSScoring,
  normalizeText,
} = require("./atsScoring.engine");

/**
 * Deterministic JD match — no AI. Uses the same keyword engine as ATS scoring.
 */
const matchJD = async (resumeText, jobDescription) => {
  const scores = runDeterministicATSScoring(resumeText, jobDescription, []);

  const normalizedResume = normalizeText(resumeText);
  const hasExperience = /experience|work history|employment/i.test(normalizedResume);
  const hasEducation = /education|university|college|degree/i.test(normalizedResume);

  const experienceScore = hasExperience ? Math.min(100, scores.sectionScore + 40) : 30;
  const educationScore = hasEducation ? Math.min(100, scores.sectionScore + 30) : 25;

  const suggestions = [];
  if (scores.missingKeywords.length > 0) {
    suggestions.push(
      `Add missing skills from the job description: ${scores.missingKeywords.slice(0, 5).join(", ")}.`
    );
  }
  if (!hasExperience) {
    suggestions.push("Add a clearly labeled Experience section with quantified bullet points.");
  }
  if (!hasEducation) {
    suggestions.push("Include an Education section with degree and institution.");
  }

  return {
    matchScore: scores.keywordScore,
    summary: `Keyword alignment is ${scores.keywordScore}%. ${scores.presentKeywords.length} of ${scores.presentKeywords.length + scores.missingKeywords.length} target skills matched.`,
    matchedSkills: scores.presentKeywords,
    missingSkills: scores.missingKeywords,
    experienceMatch: {
      score: experienceScore,
      comment: hasExperience
        ? "Experience section detected with relevant structure."
        : "No clear experience section found.",
    },
    educationMatch: {
      score: educationScore,
      comment: hasEducation
        ? "Education section detected."
        : "No clear education section found.",
    },
    suggestions,
  };
};

module.exports = { matchJD };
