const groq = require("../config/groq");

const getAIResponse = async (prompt, systemInstruction = "You are an AI assistant.") => {
  if (groq && process.env.GROQ_API_KEY) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      top_p: 0,
      response_format: { type: "json_object" },
    });
    return completion.choices[0].message.content;
  }

  throw new Error("No AI service available or all AI services failed.");
};

const getActiveAIService = () => {
  if (process.env.GROQ_API_KEY) return "Groq (llama-3.1-8b-instant)";
  return null;
};

module.exports = { getAIResponse, getActiveAIService };
