const ATSCache = require("../models/ATSCache.model");
const {
  computeAnalysisHash,
  runDeterministicATSScoring,
  buildDeterministicResult,
} = require("./atsScoring.engine");
const { generateSuggestions } = require("./atsSuggestions.service");

async function getCachedResult(hash) {
  const cached = await ATSCache.findOne({ hash }).lean();
  return cached ? cached.result : null;
}

async function storeCachedResult(hash, result) {
  await ATSCache.findOneAndUpdate(
    { hash },
    { hash, result },
    { upsert: true, new: true }
  );
}

/**
 * Deterministic ATS analysis. Scores are rule-based only; AI may enrich suggestions.
 */
const analyzeATS = async (resumeText, jobDescription = "", keywords = [], options = {}) => {
  const { skipCache = false, skipSuggestions = false } = options;

  if (!resumeText || !resumeText.trim()) {
    throw new Error("Resume text is required for ATS analysis");
  }

  const hash = computeAnalysisHash(resumeText, jobDescription, keywords);

  if (!skipCache) {
    const cached = await getCachedResult(hash);
    if (cached) {
      return { ...cached, cacheHit: true, analysisHash: hash };
    }
  }

  const scores = runDeterministicATSScoring(resumeText, jobDescription, keywords);
  const deterministic = buildDeterministicResult(scores, jobDescription, keywords);

  let suggestionsPayload = {
    suggestions: [],
    strengths: [],
    weaknesses: [],
    improvementTips: [],
  };

  if (!skipSuggestions) {
    suggestionsPayload = await generateSuggestions(
      resumeText,
      jobDescription,
      keywords,
      scores
    );
  }

  const finalSuggestions = (suggestionsPayload.suggestions || []).map((s, idx) => ({
    ...s,
    id: idx + 1,
  }));

  const result = {
    ...deterministic,
    suggestions: finalSuggestions,
    strengths: suggestionsPayload.strengths || [],
    weaknesses: suggestionsPayload.weaknesses || [],
    improvementTips: suggestionsPayload.improvementTips || [],
    analysisHash: hash,
    cacheHit: false,
  };

  if (!skipCache) {
    await storeCachedResult(hash, result);
  }

  return result;
};

module.exports = {
  analyzeATS,
  runDeterministicATSScoring,
  buildDeterministicResult,
  computeAnalysisHash,
};
