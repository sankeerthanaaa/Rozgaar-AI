const ATSCache = require("../models/ATSCache.model");
const {
  computeAnalysisHash,
  runDeterministicATSScoring,
  buildDeterministicResult,
} = require("./atsScoring.engine");
const {
  generateSuggestions,
  getLocalFallbackSuggestions,
  normalizeSuggestionsList,
} = require("./atsSuggestions.service");

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
    if (
      cached &&
      cached.suggestionsVersion === 4 &&
      Array.isArray(cached.suggestions) &&
      cached.suggestions.length > 0
    ) {
      return {
        ...cached,
        suggestions: normalizeSuggestionsList(cached.suggestions),
        cacheHit: true,
        analysisHash: hash,
      };
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

  let finalSuggestions = normalizeSuggestionsList(suggestionsPayload.suggestions || []);

  if (finalSuggestions.length === 0) {
    const fallback = getLocalFallbackSuggestions(
      scores,
      resumeText,
      jobDescription,
      keywords?.[0] || ""
    );
    finalSuggestions = normalizeSuggestionsList(fallback.suggestions || []);
    suggestionsPayload = fallback;
  }

  finalSuggestions = finalSuggestions
    .slice(0, 3)
    .map((s, idx) => ({ ...s, id: idx + 1 }));

  const result = {
    ...deterministic,
    suggestions: finalSuggestions,
    missingKeywords: suggestionsPayload.missingKeywords || scores.missingKeywords || [],
    roleAlignmentTips: suggestionsPayload.roleAlignmentTips || [],
    suggestionSummary: suggestionsPayload.summary || "",
    suggestionSource: suggestionsPayload.source || "fallback",
    strengths: suggestionsPayload.strengths || [],
    weaknesses: suggestionsPayload.weaknesses || [],
    improvementTips: suggestionsPayload.improvementTips || [],
    suggestionsVersion: 4,
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
