const crypto = require("crypto");

const CORE_KEYWORDS = [
  "react", "angular", "vue", "node.js", "express", "next.js", "javascript", "typescript",
  "python", "django", "flask", "java", "spring", "c#", ".net", "go", "rust", "ruby", "rails",
  "sql", "mysql", "postgresql", "mongodb", "nosql", "redis", "docker", "kubernetes",
  "aws", "azure", "gcp", "git", "ci/cd", "html", "css", "rest api", "graphql",
  "microservices", "tailwind", "bootstrap", "redux", "webpack", "jira", "agile", "scrum",
  "c++", "c", "php", "laravel", "sass", "less", "babel", "testing", "jest",
  "cypress", "selenium", "machine learning", "deep learning", "nlp", "tableau", "powerbi",
  "excel", "data analysis", "cloud", "serverless", "figma", "sketch", "adobe xd", "ui/ux",
  "product management", "scrum master",
];

const ROLE_BASELINES = {
  "software engineer": ["react", "node.js", "javascript", "sql", "git", "rest api"],
  "frontend developer": ["react", "javascript", "typescript", "html", "css", "tailwind", "git"],
  "backend developer": ["node.js", "express", "sql", "mongodb", "rest api", "docker", "git"],
  "data analyst": ["sql", "python", "excel", "tableau", "powerbi", "data analysis"],
  "data scientist": ["python", "machine learning", "deep learning", "sql", "nlp"],
  "product manager": ["product management", "agile", "scrum", "jira", "roadmaps"],
  "ux designer": ["ui/ux", "figma", "sketch", "adobe xd", "wireframing"],
  "devops engineer": ["docker", "kubernetes", "aws", "ci/cd", "linux", "terraform", "git"],
  "full stack developer": ["react", "node.js", "javascript", "sql", "mongodb", "rest api", "git"],
};

const ALIAS_GROUPS = [
  ["nodejs", "node.js"],
  ["js", "javascript"],
  ["ts", "typescript"],
  ["k8s", "kubernetes"],
];

const CANONICAL_ALIAS_REPLACEMENTS = [
  [/\bnodejs\b/gi, "node.js"],
  [/\bk8s\b/gi, "kubernetes"],
  [/\bjs\b/gi, "javascript"],
  [/\bts\b/gi, "typescript"],
];

/**
 * Lowercase, collapse whitespace/line breaks, trim, and apply skill aliases.
 */
function normalizeText(txt) {
  if (!txt) return "";
  let normalized = txt
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of CANONICAL_ALIAS_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

/**
 * Freeze extracted resume text once at upload — preserves paragraph breaks for section detection.
 */
function freezeResumeText(txt) {
  if (!txt) return "";
  return txt
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeKeywords(keywords) {
  if (!keywords) return [];
  const list = Array.isArray(keywords) ? keywords : [keywords];
  return list
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean)
    .sort();
}

function computeAnalysisHash(resumeText, jobDescription = "", keywords = []) {
  const normalizedResume = normalizeText(resumeText);
  const normalizedJd = normalizeText(jobDescription);
  const normalizedKeywords = normalizeKeywords(keywords).join("|");
  const payload = `${normalizedResume}|||${normalizedJd}|||${normalizedKeywords}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function escapeRegex(term) {
  return term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function isSkillInResume(targetSkill, resumeTextNormalized, rawResumeText) {
  const skill = targetSkill.toLowerCase().trim();
  if (!skill) return false;

  const checkTerm = (term) => {
    const escaped = escapeRegex(term);
    let regexStr = `\\b${escaped}\\b`;
    if (term.includes("#") || term.includes("+") || term.startsWith(".")) {
      regexStr = escaped;
    }
    const regex = new RegExp(regexStr, "i");
    return regex.test(rawResumeText) || resumeTextNormalized.includes(term);
  };

  if (checkTerm(skill)) return true;

  for (const group of ALIAS_GROUPS) {
    if (group.includes(skill)) {
      for (const alias of group) {
        if (alias !== skill && checkTerm(alias)) {
          return true;
        }
      }
    }
  }

  return false;
}

function resolveTargetSkills(jobDescription = "", keywords = []) {
  let targetSkills = [];

  if (jobDescription && jobDescription.trim().length > 0) {
    const normalizedJd = normalizeText(jobDescription);
    targetSkills = CORE_KEYWORDS.filter((skill) =>
      isSkillInResume(skill, normalizedJd, jobDescription)
    );
  }

  if (keywords && keywords.length > 0) {
    keywords.forEach((kw) => {
      const cleanKw = String(kw).toLowerCase().trim();
      if (ROLE_BASELINES[cleanKw]) {
        targetSkills = [...new Set([...targetSkills, ...ROLE_BASELINES[cleanKw]])];
      } else {
        const customExtracted = CORE_KEYWORDS.filter((skill) =>
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

  if (targetSkills.length === 0) {
    targetSkills = ["react", "node.js", "javascript", "sql", "git", "rest api"];
  }

  return targetSkills;
}

function computeSectionScore(normalizedResume) {
  let sectionScore = 0;
  const sections = [
    { patterns: [/experience/i, /work history/i, /employment/i, /professional experience/i] },
    { patterns: [/education/i, /academic/i, /university/i, /college/i, /studies/i] },
    { patterns: [/skills/i, /technologies/i, /tools/i, /key skills/i] },
    { patterns: [/projects/i, /portfolio/i, /personal projects/i] },
    { patterns: [/summary/i, /profile/i, /objective/i, /about me/i] },
  ];

  sections.forEach((sec) => {
    if (sec.patterns.some((pattern) => pattern.test(normalizedResume))) {
      sectionScore += 20;
    }
  });

  return sectionScore;
}

function computeFormattingScore(rawResumeText) {
  let formattingScore = 0;
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawResumeText)) {
    formattingScore += 25;
  }
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\d{10}\b|\+\d{1,3}/.test(rawResumeText)) {
    formattingScore += 25;
  }
  if (/github\.com|linkedin\.com|http|www\./.test(rawResumeText)) {
    formattingScore += 25;
  }

  const wordCount = rawResumeText.split(/\s+/).filter((w) => w.trim().length > 0).length;
  if (wordCount >= 150 && wordCount <= 1200) {
    formattingScore += 25;
  }

  return { formattingScore, wordCount };
}

function capitalizeSkill(str) {
  return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Pure deterministic ATS scoring — no AI, no randomness.
 */
function runDeterministicATSScoring(resumeText, jobDescription = "", keywords = []) {
  const normalizedResume = normalizeText(resumeText);
  const rawResumeText = resumeText || "";

  const targetSkills = resolveTargetSkills(jobDescription, keywords);

  const presentKeywords = targetSkills.filter((skill) =>
    isSkillInResume(skill, normalizedResume, rawResumeText)
  );
  const missingKeywords = targetSkills.filter(
    (skill) => !isSkillInResume(skill, normalizedResume, rawResumeText)
  );

  const keywordScore =
    targetSkills.length > 0
      ? Math.round((presentKeywords.length / targetSkills.length) * 100)
      : 80;

  const sectionScore = computeSectionScore(normalizedResume);
  const { formattingScore, wordCount } = computeFormattingScore(rawResumeText);

  const atsScore = Math.round(
    keywordScore * 0.55 + sectionScore * 0.25 + formattingScore * 0.2
  );

  return {
    atsScore,
    keywordScore,
    sectionScore,
    formattingScore,
    presentKeywords: presentKeywords.map(capitalizeSkill),
    missingKeywords: missingKeywords.map(capitalizeSkill),
    wordCount,
    targetSkillsCount: targetSkills.length,
  };
}

function buildDeterministicResult(scores, jobDescription, keywords) {
  const jobRole =
    keywords && keywords.length > 0 ? String(keywords[0]) : "Software Engineer";

  return {
    atsScore: scores.atsScore,
    jobRole,
    breakdown: [
      { label: "Keyword match", value: scores.keywordScore },
      { label: "Section completeness", value: scores.sectionScore },
      { label: "Formatting score", value: scores.formattingScore },
    ],
    keywords: {
      present: scores.presentKeywords,
      missing: scores.missingKeywords,
    },
    jdMatch: {
      score: scores.keywordScore,
      present: scores.presentKeywords,
      missing: scores.missingKeywords,
    },
    scores,
  };
}

module.exports = {
  CORE_KEYWORDS,
  ROLE_BASELINES,
  ALIAS_GROUPS,
  normalizeText,
  freezeResumeText,
  normalizeKeywords,
  computeAnalysisHash,
  isSkillInResume,
  resolveTargetSkills,
  runDeterministicATSScoring,
  buildDeterministicResult,
};
