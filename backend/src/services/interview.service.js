const { getAIResponse } = require("./ai.service");

const KNOWN_SKILLS = [
  "React", "Angular", "Vue", "Node.js", "Express", "Python", "Django", "Flask",
  "Java", "Spring Boot", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Docker",
  "Kubernetes", "AWS", "Azure", "Git", "CI/CD", "TypeScript", "JavaScript",
  "HTML", "CSS", "Redux", "GraphQL", "C++", "C#", "Tableau", "PowerBI",
  "Excel", "Jira", "Agile", "Scrum", "PHP", "Ruby", "Swift", "Kotlin"
];

function extractSkills(resumeText) {
  const text = (resumeText || "").toLowerCase();
  return KNOWN_SKILLS.filter(skill => text.includes(skill.toLowerCase()));
}

// Shuffling helper
function getRandomSubarray(arr, size) {
  let shuffled = arr.slice(0), i = arr.length, temp, index;
  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

// Dynamic Generators
function generateDynamicTechnicalQuestions(role, skills) {
  const list = [];
  const techMap = {
    swe: ["React", "Node.js", "Express", "SQL", "Git", "API", "Databases", "JavaScript", "Docker", "AWS"],
    da: ["SQL", "Python", "Tableau", "PowerBI", "Excel", "Data Cleaning", "Statistics", "A/B Testing", "ETL"],
    pm: ["Agile", "Scrum", "Jira", "Roadmaps", "A/B Testing", "Metrics", "MVP", "Product Strategy"],
    general: ["Project Management", "Collaboration", "Task Prioritization", "Communication", "Workflows"]
  };
  const roleSkills = skills.length > 0 ? skills : techMap[role];

  const templates = [
    "What are the best practices for building secure APIs or pipelines using {skill}?",
    "How do you profile and optimize performance issues in a {skill} environment?",
    "Explain how you handle state management, caching, or data storage when working with {skill}.",
    "Describe a challenging technical problem you solved using {skill} in a past project.",
    "How would you explain the architectural differences between {skill} and a competing framework?",
    "What is your approach to testing and ensuring code/data quality when using {skill}?",
    "In a project leveraging {skill}, how do you design components or structures for maximum reusability?",
    "What are the security vulnerabilities most common to {skill}, and how do you protect against them?"
  ];

  templates.forEach(tpl => {
    roleSkills.forEach(skill => {
      list.push({
        question: tpl.replace(/{skill}/g, skill),
        difficulty: getRandomSubarray(["easy", "medium", "hard"], 1)[0],
        topic: `${skill} Integration`,
        hint: `Mention your specific experience, challenges faced, and testing practices with ${skill}.`
      });
    });
  });

  return list;
}

function generateDynamicBehavioralQuestions(role, skills) {
  const list = [];
  const contexts = [
    "when a key teammate disagreed with your approach",
    "when requirements changed at the eleventh hour",
    "when you had to learn a new tool very quickly",
    "when you made a critical error in your work",
    "when you had to manage conflicting stakeholder expectations",
    "when a project deadline was cut in half"
  ];
  
  const templates = [
    "Describe a time {context}. How did you handle the situation and what did you learn?",
    "Tell me about a project where you faced a roadblock {context}. What steps did you take?",
    "How do you maintain team morale and focus {context}?",
    "Recall a situation {context}. How did you communicate the impact to your manager?"
  ];

  templates.forEach(tpl => {
    contexts.forEach(ctx => {
      list.push({
        question: tpl.replace(/{context}/g, ctx),
        difficulty: "medium",
        topic: "Behavioral Scenario",
        hint: "Use the STAR method: Situation, Task, Action, Result. Highlight communication and soft skills."
      });
    });
  });

  return list;
}

function generateDynamicSituationalQuestions(role, skills) {
  const list = [];
  const scenarios = {
    swe: [
      "a critical database migration fails in production",
      "your app experiences a sudden spike in traffic causing 500 errors",
      "a client demands a feature that violates standard security protocols",
      "the main API endpoint starts returning slow response times"
    ],
    da: [
      "a key analytics dashboard shows a massive, unexplained drop in user registration",
      "the pipeline script fails to import daily data from a third-party source",
      "an executive requests data that supports a biased conclusion",
      "you discover major duplicates in the historical revenue tables"
    ],
    pm: [
      "the engineering lead tells you a key launch feature is delayed by a sprint",
      "user retention drops by 15% after introducing a new feature",
      "two major sales clients demand opposing features on the roadmap",
      "a competitor launches a cheaper clone of your core product"
    ],
    general: [
      "you are assigned multiple urgent tasks with overlapping deadlines",
      "a key team member goes offline during a critical project milestone",
      "you realize a deliverable was submitted with incomplete checks",
      "a client complains about communication speed and updates"
    ]
  };

  const roleScenarios = scenarios[role] || scenarios.general;

  const templates = [
    "Imagine a situation where {scenario}. What is your immediate step-by-step action plan?",
    "How do you prioritize stakeholder communication if {scenario}?",
    "What preventive measures would you design to ensure that if {scenario}, the team is prepared?"
  ];

  templates.forEach(tpl => {
    roleScenarios.forEach(sc => {
      list.push({
        question: tpl.replace(/{scenario}/g, sc),
        difficulty: "hard",
        topic: "Situational Crisis",
        hint: "Outline prioritization, verification, communication, and long-term resolution/prevention steps."
      });
    });
  });

  return list;
}

function generateDynamicRoleSpecificQuestions(role, skills) {
  const list = [];
  const rolesLong = {
    swe: "Software Engineering",
    da: "Data Analysis",
    pm: "Product Management",
    general: "Professional Growth"
  };

  const techMap = {
    swe: ["React", "Node.js", "Express", "SQL", "Git", "API", "Databases", "JavaScript", "Docker", "AWS"],
    da: ["SQL", "Python", "Tableau", "PowerBI", "Excel", "Data Cleaning", "Statistics", "A/B Testing", "ETL"],
    pm: ["Agile", "Scrum", "Jira", "Roadmaps", "A/B Testing", "Metrics", "MVP", "Product Strategy"],
    general: ["Project Management", "Collaboration", "Task Prioritization", "Communication", "Workflows"]
  };
  const roleSkills = skills.length > 0 ? skills : techMap[role];

  const templates = [
    "How does your experience with {skill} differentiate you in a {roleLong} role?",
    "What is the most common misconception about {skill} among junior developers/analysts?",
    "In your previous projects, how did you balance speed of delivery with long-term maintenance of {skill} implementations?",
    "What is a recent feature or upgrade in {skill} that you are excited to leverage?"
  ];

  templates.forEach(tpl => {
    roleSkills.forEach(skill => {
      list.push({
        question: tpl.replace(/{skill}/g, skill).replace(/{roleLong}/g, rolesLong[role]),
        difficulty: "medium",
        topic: `${skill} Expertise`,
        hint: "Connect technical expertise directly to business value, developer velocity, or design choices."
      });
    });
  });

  return list;
}

/**
 * Strips markdown fences and extracts the first valid JSON object from
 * an AI response string. Throws if nothing parseable is found.
 */
function extractJSON(text) {
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No valid JSON object found in AI response');
}

const generateQuestions = async (resumeText, jobDescription, excludeQuestions = []) => {
  try {
    const prompt = `
      You are an expert interviewer for the target job role specified in the job description or resume.
      Based on the candidate's Resume and the target Job Description (if provided), generate a comprehensive set of at least 20 interview questions.
      
      Requirements:
      1. Generate a total of at least 20 questions.
      2. Group them into the following categories:
         - "technical": Hard skills, framework concepts, coding/analytical questions (at least 6 questions)
         - "behavioral": Past experiences, conflict resolution, teamwork (at least 5 questions)
         - "situational": Hypothetical scenarios, crisis handling, decision making (at least 5 questions)
         - "roleSpecific": Questions specifically tailored to the duties/technologies of the target role and the candidate's experience/gaps (at least 4 questions)
      3. Tailor every question specifically to the target role. For example, if the role is a Data Analyst, do not ask software engineering/web development questions (like React/Virtual DOM). If the role is Product Manager, focus on roadmap, metrics, and stakeholders.
      4. For each question, provide:
         - "question": The question text
         - "difficulty": "easy", "medium", or "hard"
         - "topic": The sub-topic (e.g., "SQL Joins", "React Hooks", "STAR Method")
         - "hint": A brief tip or bullet points of what a strong answer should include.
      
      Return a JSON object with this exact structure:
      {
        "totalQuestions": <number>,
        "categories": {
          "technical": [
            {
              "question": "<question>",
              "difficulty": "<easy | medium | hard>",
              "topic": "<topic>",
              "hint": "<hint>"
            }
          ],
          "behavioral": [...],
          "situational": [...],
          "roleSpecific": [...]
        },
        "tips": ["<tip1>", "<tip2>", "<tip3>"]
      }

      Target Role / Job Description:
      ${jobDescription || "Not provided, deduce role from resume or generate general professional questions"}

      Resume Text:
      ${resumeText}

      ${excludeQuestions && excludeQuestions.length > 0 ? `Do NOT generate any of the following questions (exclude them completely):\n- ${excludeQuestions.join("\n- ")}` : ""}
    `;

    try {
      const responseText = await getAIResponse(
        prompt,
        "You are an expert technical interviewer. You must respond with ONLY a valid JSON object. No markdown, no code fences, no explanation text before or after. No dashes, no bullet points. Start your response with { and end with }."
      );

      try {
        const parsed = extractJSON(responseText);
        return parsed;
      } catch (parseErr) {
        console.log("AI response was not valid JSON, using local question generator:", parseErr.message);
        return runFallbackQuestions(resumeText, jobDescription, excludeQuestions);
      }
    } catch (aiError) {
      console.log("AI unavailable, using local question generator:", aiError.message);
      return runFallbackQuestions(resumeText, jobDescription, excludeQuestions);
    }
  } catch (error) {
    console.error("Interview Service Error:", error);
    throw error;
  }
};

const getQuestionsByResumeId = async (resumeId) => {
  try {
    return {
      resumeId,
      questions: [],
      message: "No questions found for this resume yet"
    };
  } catch (error) {
    console.error("Get Questions Error:", error);
    throw error;
  }
};

/**
 * Fallback questions generator when AI keys are missing
 */
function runFallbackQuestions(resumeText, jobDescription = "", excludeQuestions = []) {
  const text = (resumeText || "").toLowerCase();
  const jd = (jobDescription || "").toLowerCase();

  // Deduce role based on target role or keywords in JD/resume
  let role = "general";
  
  if (jd.includes("swe") || jd.includes("software engineer") || text.includes("software engineer")) {
    role = "swe";
  } else if (jd.includes("da") || jd.includes("data analyst") || text.includes("data analyst") || jd.includes("tableau") || text.includes("tableau")) {
    role = "da";
  } else if (jd.includes("pm") || jd.includes("product manager") || text.includes("product manager") || jd.includes("agile") || text.includes("agile")) {
    role = "pm";
  } else {
    if (text.includes("react") || text.includes("node") || text.includes("developer") || text.includes("javascript")) {
      role = "swe";
    }
  }

  // Base Question Banks
  const staticQuestionBanks = {
    swe: {
      technical: [
        {
          question: "How does React's virtual DOM work, and how does it improve web application performance?",
          difficulty: "medium",
          topic: "React",
          hint: "Mention diffing, reconciliation, batching state updates, and minimizing heavy real-DOM layout reflows."
        },
        {
          question: "Explain the differences between asynchronous processes in JavaScript: Callbacks, Promises, and Async/Await.",
          difficulty: "easy",
          topic: "JavaScript",
          hint: "Talk about readability, error handling (try/catch vs .catch), and avoiding callback hell."
        },
        {
          question: "What is the difference between SQL database normalization and denormalization? When would you choose one over the other?",
          difficulty: "hard",
          topic: "Databases",
          hint: "Normalization reduces redundancy and guarantees consistency (OLTP). Denormalization improves read efficiency (OLAP)."
        },
        {
          question: "What is Git rebase vs git merge, and when should you use each in a collaborative environment?",
          difficulty: "medium",
          topic: "Git",
          hint: "Merge preserves complete history chronologically. Rebase rewrites history for a clean, linear project timeline."
        },
        {
          question: "Explain the concept of RESTful API constraints and state management.",
          difficulty: "medium",
          topic: "Web Services",
          hint: "Discuss client-server separation, statelessness, cacheability, uniform interface, layered system, and code-on-demand."
        }
      ],
      behavioral: [
        {
          question: "Tell me about a challenging bug you fixed and how you approached it.",
          difficulty: "medium",
          topic: "Problem Solving",
          hint: "Focus on reproduction steps, logging, root cause analysis, fix design, and regression testing."
        },
        {
          question: "Describe a time you faced a significant roadblock while working on a project. How did you resolve it?",
          difficulty: "medium",
          topic: "Conflict Resolution",
          hint: "Use the STAR method: Situation (what went wrong), Task (what was needed), Action (steps taken), Result."
        },
        {
          question: "Tell me about a time you had to disagree with a manager or coworker. How did you handle the discussion?",
          difficulty: "medium",
          topic: "Communication",
          hint: "Focus on empathy, active listening, separating opinions from data, and reaching an aligned compromise."
        }
      ],
      situational: [
        {
          question: "If you are working on a high-priority feature release and realize at the eleventh hour that it has a critical bug, what is your action plan?",
          difficulty: "hard",
          topic: "Crisis Management",
          hint: "Assess bug impact immediately, communicate status transparently with stakeholders, suggest rolling back or deferring release, fix, and release."
        },
        {
          question: "How would you handle a situation where a core team member is not delivering their tasks on time, impacting your work?",
          difficulty: "medium",
          topic: "Collaboration",
          hint: "Talk to them privately to check if they need help, clarify dependencies, and raise it constructively in stand-up if unresolved."
        }
      ],
      roleSpecific: [
        {
          question: "Given your experience, how would you quickly pick up a new technical framework required for this role?",
          difficulty: "easy",
          topic: "Adaptability",
          hint: "Mention building a small proof-of-concept, reviewing official documentation, shadowing colleagues, and reading existing codebases."
        },
        {
          question: "If you notice a mismatch between what the user actually wants and what was specified in the requirements document, how do you handle it?",
          difficulty: "medium",
          topic: "User-centricity",
          hint: "Focus on user feedback. Present findings to product/engineering leadership with data supporting user preference."
        }
      ]
    },
    da: {
      technical: [
        {
          question: "Explain the difference between a LEFT JOIN, an INNER JOIN, and a RIGHT JOIN in SQL, and when to use each.",
          difficulty: "easy",
          topic: "SQL Joins",
          hint: "INNER JOIN returns matching rows from both. LEFT JOIN returns all rows from left table, and matching from right."
        },
        {
          question: "How do you handle outliers or missing values in a dataset during data cleaning?",
          difficulty: "medium",
          topic: "Data Wrangling",
          hint: "Explain imputation (mean/median/mode), dropping records, standard deviation thresholds, and testing model sensitivity."
        },
        {
          question: "What is the difference between correlation and causation? Give a clear business example.",
          difficulty: "medium",
          topic: "Statistics",
          hint: "Correlation is a statistical relationship; causation means one event triggers the other."
        },
        {
          question: "What is a CTE (Common Table Expression) in SQL, and when is it preferred over a subquery?",
          difficulty: "medium",
          topic: "SQL",
          hint: "CTEs improve readability and allow recursive queries, unlike nested subqueries."
        }
      ],
      behavioral: [
        {
          question: "Describe a time you had to present complex data insights to a non-technical stakeholder.",
          difficulty: "medium",
          topic: "Data Storytelling",
          hint: "Focus on simplifying charts, avoiding jargon, connecting numbers directly to business goals, and active listening."
        },
        {
          question: "Share an experience where your analysis led to a significant business decision or improvement.",
          difficulty: "hard",
          topic: "Impact",
          hint: "Detail the specific problem, your data analysis methodology, the resulting recommendation, and the positive outcome/ROI."
        }
      ],
      situational: [
        {
          question: "If a business lead asks you to find data that supports a pre-determined conclusion they want to present, how do you respond?",
          difficulty: "hard",
          topic: "Professional Integrity",
          hint: "State commitment to objective facts. Present both supporting and contradicting data points neutrally."
        },
        {
          question: "A dashboard you built suddenly shows a 30% drop in key revenue metrics overnight. What is your troubleshooting checklist?",
          difficulty: "medium",
          topic: "Troubleshooting",
          hint: "Check data pipeline health/syncs, check for application logging changes, verify if the drop is localized or global."
        }
      ],
      roleSpecific: [
        {
          question: "How do you ensure data quality and integrity throughout your ETL pipelines?",
          difficulty: "medium",
          topic: "Data Quality",
          hint: "Define schemas, implement null and range checks, write automated testing scripts, and set up alerts."
        },
        {
          question: "Describe your experience with cohort analysis and how you would calculate user retention.",
          difficulty: "medium",
          topic: "Retention Metrics",
          hint: "Define cohort criteria and follow active users across subsequent weeks/months, tracking percentage drops."
        }
      ]
    },
    pm: {
      technical: [
        {
          question: "How do you prioritize features for a product roadmap when multiple stakeholders have conflicting demands?",
          difficulty: "medium",
          topic: "Roadmapping",
          hint: "Mention frameworks like RICE (Reach, Impact, Confidence, Effort), MoSCoW, or Kano models."
        },
        {
          question: "Explain the difference between agile methodology and waterfall. How do you adapt them for rapid delivery?",
          difficulty: "easy",
          topic: "Agile",
          hint: "Waterfall is sequential. Agile is iterative and user-feedback driven. PMs leverage sprint retro feedback."
        },
        {
          question: "If our key metric (e.g., active daily users) drops by 10% suddenly, how do you go about diagnosing the issue?",
          difficulty: "hard",
          topic: "Analytics & Growth",
          hint: "Check server status/deploy logs, break down by platform/country, evaluate funnel metrics, and consult user research."
        }
      ],
      behavioral: [
        {
          question: "Describe a time you had to say 'no' to a key stakeholder or executive. How did you handle it?",
          difficulty: "medium",
          topic: "Stakeholder Management",
          hint: "Use data to back your decision, explain the opportunity cost, and suggest alternative future alignment."
        },
        {
          question: "Tell me about a product you managed that failed. What did you learn from the experience?",
          difficulty: "hard",
          topic: "Product Failure",
          hint: "Be honest. Talk about the hypotheses that failed, what user feedback was ignored, and lessons learned."
        }
      ],
      situational: [
        {
          question: "If the engineering team tells you a critical feature on the roadmap will be delayed by two weeks, impacting a marketing launch, what do you do?",
          difficulty: "hard",
          topic: "Crisis Resolution",
          hint: "Evaluate scope reduction, align with marketing to adjust dates or pivot message, and keep stakeholders updated."
        }
      ],
      roleSpecific: [
        {
          question: "How do you gather qualitative and quantitative feedback from users to inform the product roadmap?",
          difficulty: "easy",
          topic: "User Research",
          hint: "Mention quantitative metrics and qualitative approaches (user surveys, user tests, focus groups)."
        }
      ]
    },
    general: {
      technical: [
        {
          question: "What is your methodology for organizing your daily tasks and managing project deadlines?",
          difficulty: "easy",
          topic: "Work Management",
          hint: "Discuss prioritization tools, scheduling focused time blocks, and setting realistic milestones."
        },
        {
          question: "How do you ensure clear and structured communication when working with remote team members?",
          difficulty: "easy",
          topic: "Communication",
          hint: "Focus on detailed written updates, asynchronous documentation, and timely status pings."
        }
      ],
      behavioral: [
        {
          question: "Tell me about a time you had to adapt to a major change in project direction or company structure.",
          difficulty: "medium",
          topic: "Adaptability",
          hint: "Describe how you managed initial stress, refocused your priorities, and helped team members adjust."
        }
      ],
      situational: [
        {
          question: "If you are assigned multiple tasks with overlapping deadlines and realize you cannot complete all of them, how do you prioritize?",
          difficulty: "medium",
          topic: "Prioritization",
          hint: "Evaluate task urgency and business impact, communicate conflicts early, and propose a rescheduled sequence."
        }
      ],
      roleSpecific: [
        {
          question: "How do you stay up-to-date with industry trends, best practices, and new tools?",
          difficulty: "easy",
          topic: "Continuous Learning",
          hint: "Mention newsletters, tech blogs, industry podcasts, attending webinars, or working on personal experiments."
        }
      ]
    }
  };

  const skills = extractSkills(resumeText);

  // Generate dynamic pools
  const dynamicTech = generateDynamicTechnicalQuestions(role, skills);
  const dynamicBeh = generateDynamicBehavioralQuestions(role, skills);
  const dynamicSit = generateDynamicSituationalQuestions(role, skills);
  const dynamicRole = generateDynamicRoleSpecificQuestions(role, skills);

  const staticBank = staticQuestionBanks[role] || staticQuestionBanks.general;

  // Combine static and dynamic
  const fullTechnical = [...staticBank.technical, ...dynamicTech];
  const fullBehavioral = [...staticBank.behavioral, ...dynamicBeh];
  const fullSituational = [...staticBank.situational, ...dynamicSit];
  const fullRoleSpecific = [...staticBank.roleSpecific, ...dynamicRole];

  // Match exclusions (normalized)
  const excludedSet = new Set((excludeQuestions || []).map(q => q.toLowerCase().trim().replace(/[?.!]$/, "")));
  const isExcluded = (qText) => {
    const clean = qText.toLowerCase().trim().replace(/[?.!]$/, "");
    return excludedSet.has(clean);
  };

  // Filter
  let filteredTech = fullTechnical.filter(q => !isExcluded(q.question));
  let filteredBehavioral = fullBehavioral.filter(q => !isExcluded(q.question));
  let filteredSituational = fullSituational.filter(q => !isExcluded(q.question));
  let filteredRoleSpecific = fullRoleSpecific.filter(q => !isExcluded(q.question));

  // Smart padding if filtered lists are too small
  if (filteredTech.length < 7) {
    const excludedTech = fullTechnical.filter(q => isExcluded(q.question));
    filteredTech = [...filteredTech, ...getRandomSubarray(excludedTech, 7 - filteredTech.length)];
  }
  if (filteredBehavioral.length < 5) {
    const excludedBeh = fullBehavioral.filter(q => isExcluded(q.question));
    filteredBehavioral = [...filteredBehavioral, ...getRandomSubarray(excludedBeh, 5 - filteredBehavioral.length)];
  }
  if (filteredSituational.length < 5) {
    const excludedSit = fullSituational.filter(q => isExcluded(q.question));
    filteredSituational = [...filteredSituational, ...getRandomSubarray(excludedSit, 5 - filteredSituational.length)];
  }
  if (filteredRoleSpecific.length < 5) {
    const excludedRole = fullRoleSpecific.filter(q => isExcluded(q.question));
    filteredRoleSpecific = [...filteredRoleSpecific, ...getRandomSubarray(excludedRole, 5 - filteredRoleSpecific.length)];
  }

  // Get random selections
  const finalTech = getRandomSubarray(filteredTech, 7);
  const finalBehavioral = getRandomSubarray(filteredBehavioral, 5);
  const finalSituational = getRandomSubarray(filteredSituational, 5);
  const finalRoleSpecific = getRandomSubarray(filteredRoleSpecific, 5);

  return {
    totalQuestions: finalTech.length + finalBehavioral.length + finalSituational.length + finalRoleSpecific.length,
    categories: {
      technical: finalTech,
      behavioral: finalBehavioral,
      situational: finalSituational,
      roleSpecific: finalRoleSpecific
    },
    tips: [
      "Prepare your responses using the STAR format (Situation, Task, Action, Result) for behavioral questions.",
      "Support technical answers with concrete projects or features you have built in the past.",
      "Don't hesitate to ask clarifying questions before diving deep into architectural answers."
    ]
  };
}

module.exports = { generateQuestions, getQuestionsByResumeId };