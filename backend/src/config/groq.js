const Groq = require("groq-sdk");
require("dotenv").config();

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

module.exports = groq;
