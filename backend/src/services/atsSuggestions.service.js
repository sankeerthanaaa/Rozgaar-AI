const { getAIResponse } = require("./ai.service");

const HALLUCINATION_PATTERNS = [
  /structural design/i,
  /advanced manufacturing/i,
  /delivered a complex engineering project/i,
];

function extractJSON(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error("No valid JSON object found in AI response");
}

function capitalizeType(type) {
  const t = String(type || "Improve").toLowerCase();
  if (t === "add") return "Add";
  if (t === "remove") return "Remove";
  return "Improve";
}

function normalizeSuggestionEntry(s, idx) {
  const before = String(s.before || s.original || "").trim();
  const after = String(s.after || s.improved || s.text || s.suggestion || "").trim();
  const section = String(s.section || "Resume").trim() || "Resume";
  const priority = ["High", "Medium", "Low"].includes(s.priority) ? s.priority : "Medium";
  const title = String(s.title || "").trim();

  if (!after || after.length < 12) return null;
  if (before && before === after) return null;

  return {
    id: s.id ?? idx + 1,
    section,
    priority: priority,
    type: "Improve",
    title,
    original: before,
    improved: after,
    before,
    after,
  };
}

function normalizeSuggestionsList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((s, idx) => normalizeSuggestionEntry(s, idx)).filter(Boolean);
}

function collapseWhitespace(text) {
  return String(text).replace(/\s+/g, " ").trim().toLowerCase();
}

function isSubstringInResume(needle, resumeText) {
  if (!needle || needle.length < 8) return false;
  const hay = collapseWhitespace(resumeText);
  const n = collapseWhitespace(needle);
  if (hay.includes(n)) return true;
  const words = n.split(" ").filter((w) => w.length > 3);
  if (words.length < 4) return false;
  const matched = words.filter((w) => hay.includes(w));
  return matched.length / words.length >= 0.75;
}

function hasFabricatedMetrics(before, after) {
  const metricRe = /\b\d{1,3}\s*%|\b\d+\s*(x|times)\b/i;
  return metricRe.test(after || "") && !metricRe.test(before || "");
}

function validateAiSuggestion(s, resumeText) {
  const before = String(s.before || s.original || "").trim();
  const after = String(s.after || s.improved || "").trim();
  if (capitalizeType(s.type) !== "Improve") return false;
  if (after.length < 12) return false;
  if (before && before === after) return false;
  if (before.length >= 10 && !isSubstringInResume(before, resumeText)) return false;
  if (hasFabricatedMetrics(before, after)) return false;
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(after) && !pattern.test(before)) return false;
  }
  return true;
}

function findSkillsLine(resumeText) {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (/^(technical )?skills|technologies|tools\b/i.test(lines[i])) {
      const next = lines[i + 1] || lines[i];
      if (next.length > 10) return next;
    }
    if (/skills\s*:/i.test(lines[i]) && lines[i].length > 12) return lines[i];
  }
  return null;
}

function getFallbackSuggestions(resumeText, scoringResult, jobDescription, role) {
  const missingKeywords = scoringResult.missingKeywords || [];
  const suggestions = [];
  const roleAlignmentTips = [];
  const improvementTips = [];

  if (role) {
    roleAlignmentTips.push(`Tailor bullets and skills toward the ${role} role using terms already on your resume.`);
  }

  if (missingKeywords.length > 0) {
    const skillsLine = findSkillsLine(resumeText || "");
    const toAdd = missingKeywords
      .slice(0, 5)
      .filter((k) => !collapseWhitespace(resumeText || "").includes(k.toLowerCase()));

    if (skillsLine && toAdd.length > 0 && suggestions.length < 3) {
      suggestions.push({
        section: "Skills",
        priority: "High",
        type: "Improve",
        title: "Add missing role/JD keywords",
        before: skillsLine,
        after: `${skillsLine}${/[,|]/.test(skillsLine) ? ", " : ": "}${toAdd.join(", ")}`,
      });
    } else if (toAdd.length > 0) {
      improvementTips.push(
        `Add to Skills (if accurate): ${toAdd.join(", ")}`
      );
    }
  }

  if (jobDescription?.trim() && suggestions.length === 0 && improvementTips.length === 0) {
    improvementTips.push("Compare your experience bullets against the JD and strengthen wording on matching lines.");
  }

  return {
    suggestions: normalizeSuggestionsList(suggestions),
    missingKeywords: missingKeywords.slice(0, 10),
    roleAlignmentTips,
    summary: "Fallback suggestions based on your resume and job match.",
    strengths: [],
    weaknesses: missingKeywords.length
      ? [`Missing keywords for this role/JD: ${missingKeywords.slice(0, 5).join(", ")}`]
      : [],
    improvementTips,
  };
}

async function generateAiSuggestions(resumeText, jobDescription, role, scoringResult) {
  const roleStr = role || "Not specified";
  const jdStr = jobDescription?.trim() || "Not provided";

  const prompt = `You are an expert ATS resume improvement assistant.

STRICT RULES:
- Generate suggestions ONLY from the provided resume.
- Suggestions MUST match the selected role and JD.
- NEVER generate generic filler suggestions.
- NEVER generate unrelated engineering/project examples.
- NEVER invent fake achievements.
- NEVER mention technologies absent from the resume/JD.
- Suggestions must feel personalized and realistic.
- Every "before" must be an exact substring from the resume.
- type must be "Improve" only.
- Maximum 3 suggestions.
- "after" is REQUIRED and must be different from "before".
- Never return a suggestion with empty "after".

Return ONLY valid JSON.

JSON FORMAT:
{
  "suggestions": [
    {
      "id": 1,
      "section": "Experience",
      "type": "Improve",
      "priority": "High",
      "title": "Improve impact wording",
      "before": "<actual weak line from resume>",
      "after": "<better rewritten version>"
    }
  ],
  "missingKeywords": [],
  "roleAlignmentTips": [],
  "summary": ""
}

ROLE:
${roleStr}

JOB DESCRIPTION:
${jdStr}

RESUME:
${resumeText.slice(0, 12000)}`;

  const responseText = await getAIResponse(
    prompt,
    "You are an ATS resume assistant. Respond with ONLY valid JSON. No markdown."
  );

  const parsed = extractJSON(responseText);
  const validated = (parsed.suggestions || [])
    .filter((s) => validateAiSuggestion(s, resumeText))
    .slice(0, 3);

  return {
    suggestions: normalizeSuggestionsList(validated),
    missingKeywords: Array.isArray(parsed.missingKeywords)
      ? parsed.missingKeywords
      : scoringResult.missingKeywords || [],
    roleAlignmentTips: Array.isArray(parsed.roleAlignmentTips) ? parsed.roleAlignmentTips : [],
    summary: String(parsed.summary || "").trim(),
    strengths: [],
    weaknesses: [],
    improvementTips: Array.isArray(parsed.roleAlignmentTips) ? parsed.roleAlignmentTips : [],
  };
}

async function generateSuggestions(resumeText, jobDescription, keywords, scoringResult) {
  const role = keywords?.length ? String(keywords[0]) : "";

  try {
    const aiPayload = await generateAiSuggestions(
      resumeText,
      jobDescription,
      role,
      scoringResult
    );
    if (aiPayload.suggestions && aiPayload.suggestions.length > 0) {
      return { ...aiPayload, source: "ai" };
    }
  } catch (err) {
    console.log("AI suggestions failed, using fallback:", err.message);
  }

  return {
    ...getFallbackSuggestions(resumeText, scoringResult, jobDescription, role),
    source: "fallback",
  };
}

function getLocalFallbackSuggestions(scoringResult, resumeText = "", jobDescription = "", role = "") {
  return getFallbackSuggestions(resumeText, scoringResult, jobDescription, role);
}

module.exports = {
  generateSuggestions,
  getLocalFallbackSuggestions,
  normalizeSuggestionsList,
  validateAiSuggestion,
};
