const openai = require("../config/openai");

const getAIResponse = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume analyzer. Always respond in valid JSON format only, no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

module.exports = { getAIResponse };