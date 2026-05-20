const { getAIResponse } = require("./ai.service");

const generateQuestions = async (resumeText, jobDescription) => {
  try {
    const prompt = `
      Generate interview questions based on this resume and job description.
      Return a JSON object with this exact structure:
      {
        "totalQuestions": <number>,
        "categories": {
          "technical": [
            {
              "question": "<question>",
              "difficulty": "<easy | medium | hard>",
              "topic": "<topic name>",
              "hint": "<hint for answer>"
            }
          ],
          "behavioral": [
            {
              "question": "<question>",
              "difficulty": "<easy | medium | hard>",
              "topic": "<topic name>",
              "hint": "<hint for answer>"
            }
          ],
          "situational": [
            {
              "question": "<question>",
              "difficulty": "<easy | medium | hard>",
              "topic": "<topic name>",
              "hint": "<hint for answer>"
            }
          ],
          "roleSpecific": [
            {
              "question": "<question>",
              "difficulty": "<easy | medium | hard>",
              "topic": "<topic name>",
              "hint": "<hint for answer>"
            }
          ]
        },
        "tips": ["<tip1>", "<tip2>", "<tip3>"]
      }

      Resume Text:
      ${resumeText}

      Job Description:
      ${jobDescription || "Not provided, generate general questions based on resume"}
    `;

    try {
      const responseText = await getAIResponse(
        prompt,
        "You are an expert technical interviewer. Always respond in valid JSON format only, no extra text."
      );
      
      let parsed = responseText;
      if (typeof responseText === "string") {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(responseText);
        }
      }
      return parsed;
    } catch (aiError) {
      console.warn("AI service failed in generateQuestions. Using local fallback question generator:", aiError.message);
      return runFallbackQuestions(resumeText, jobDescription);
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
function runFallbackQuestions(resumeText, jobDescription = "") {
  const text = resumeText.toLowerCase();
  const jd = (jobDescription || "").toLowerCase();

  // Deduce role based on JD / Resume
  let role = "swe";
  if (jd.includes("data analyst") || text.includes("data analyst") || jd.includes("tableau") || text.includes("tableau")) {
    role = "da";
  } else if (jd.includes("product manager") || text.includes("product manager") || jd.includes("agile") || text.includes("agile")) {
    role = "pm";
  }

  // Define Technical bank
  const techBank = {
    swe: [
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
      }
    ],
    da: [
      {
        question: "Explain the difference between a LEFT JOIN and an INNER JOIN in SQL, and when to use each.",
        difficulty: "easy",
        topic: "SQL",
        hint: "INNER JOIN returns matching rows from both tables. LEFT JOIN returns all rows from left table, and matching from right."
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
        hint: "Correlation is a statistical relationship; causation means one event triggers the other. (e.g., Ice cream sales correlate with drowning, but don't cause it.)"
      }
    ],
    pm: [
      {
        question: "How do you prioritize features for a product roadmap when multiple stakeholders have conflicting demands?",
        difficulty: "medium",
        topic: "Roadmapping",
        hint: "Mention frameworks like RICE (Reach, Impact, Confidence, Effort), MoSCoW, or Kano models to align goals objectively."
      },
      {
        question: "Explain the difference between agile methodology and waterfall. How do you adapt them for rapid delivery?",
        difficulty: "easy",
        topic: "Agile",
        hint: "Waterfall is sequential. Agile is iterative and user-feedback driven. PMs leverage sprint retro feedback to pivot."
      },
      {
        question: "If our key metric (e.g., active daily users) drops by 10% suddenly, how do you go about diagnosing the issue?",
        difficulty: "hard",
        topic: "Analytics & Growth",
        hint: "Check server status/deploy logs, break down by platform/country, evaluate funnel metrics, and consult user research."
      }
    ]
  };

  const techQuestions = techBank[role] || techBank.swe;

  const behavioral = [
    {
      question: "Describe a time you faced a significant roadblock while working on a project. How did you resolve it?",
      difficulty: "medium",
      topic: "Problem Solving",
      hint: "Use the STAR method: Situation (what went wrong), Task (what was needed), Action (steps taken), Result (positive metric)."
    },
    {
      question: "Tell me about a time you had to disagree with a manager or coworker. How did you handle the discussion?",
      difficulty: "medium",
      topic: "Communication",
      hint: "Focus on empathy, active listening, separating opinions from data, and reaching a aligned compromise."
    }
  ];

  const situational = [
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
      hint: "Talk to them privately to check if they need help, clarify dependencies, and raise it constructively in stand-up or with lead if unresolved."
    }
  ];

  const roleSpecific = [
    {
      question: `Given your experience listed in your resume, how would you quickly pick up a new technical framework required for this target role?`,
      difficulty: "easy",
      topic: "Adaptability",
      hint: "Mention building a small proof-of-concept, reviewing official documentation, shadowing colleagues, and reading existing codebase repositories."
    },
    {
      question: "If you notice a mismatch between what the user actually wants and what was specified in the requirements document, how do you handle it?",
      difficulty: "medium",
      topic: "User-centricity",
      hint: "Focus on user feedback. Present the finding to product/engineering leadership with data supporting the user preference."
    }
  ];

  return {
    totalQuestions: techQuestions.length + behavioral.length + situational.length + roleSpecific.length,
    categories: {
      technical: techQuestions,
      behavioral,
      situational,
      roleSpecific
    },
    tips: [
      "Prepare your responses using the STAR format (Situation, Task, Action, Result) for behavioral questions.",
      "Support technical answers with concrete projects or features you have built in the past.",
      "Don't hesitate to ask clarifying questions before diving deep into architectural answers."
    ]
  };
}

module.exports = { generateQuestions, getQuestionsByResumeId };