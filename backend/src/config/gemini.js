const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const geminiApiKey = process.env.GEMINI_API_KEY;

const geminiModel = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({
      model: "gemini-1.5-pro",
    })
  : null;

module.exports = geminiModel;