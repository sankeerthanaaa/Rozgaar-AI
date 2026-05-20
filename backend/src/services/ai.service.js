const openai = require("../config/openai");
const geminiModel = require("../config/gemini");

const getAIResponse = async (prompt, systemInstruction = "You are an AI assistant.") => {
  // Try OpenAI first
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI Error, trying Gemini if available:", err.message);
    }
  }

  // Try Gemini second
  if (geminiModel && process.env.GEMINI_API_KEY) {
    try {
      const fullPrompt = `${systemInstruction}\n\nUser Request:\n${prompt}`;
      const result = await geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error("Gemini Error:", err.message);
    }
  }

  // Fallback / Throw error if no key or all failed
  throw new Error("No AI service available or all AI services failed.");
};

module.exports = { getAIResponse };