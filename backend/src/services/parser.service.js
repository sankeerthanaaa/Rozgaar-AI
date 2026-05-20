const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");

const parseResume = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let text = "";
    let pages = 1;
    let info = {};

    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      pages = data.numpages;
      info = data.info;
    } else if (ext === ".docx" || ext === ".doc") {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === ".txt") {
      text = fs.readFileSync(filePath, "utf-8");
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    // Preserve newlines, compress multiple spaces, remove extreme line breaks
    const cleanText = text
      .replace(/[^\S\r\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      text: cleanText,
      pages,
      info,
    };
  } catch (error) {
    console.error("Parser Service Error:", error);
    throw error;
  }
};

const parseResumeFromBuffer = async (buffer, originalName = "") => {
  try {
    const ext = path.extname(originalName).toLowerCase();
    let text = "";
    let pages = 1;
    let info = {};

    if (ext === ".pdf" || !ext) {
      const data = await pdfParse(buffer);
      text = data.text;
      pages = data.numpages;
      info = data.info;
    } else if (ext === ".docx" || ext === ".doc") {
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = result.value;
    } else if (ext === ".txt") {
      text = buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const cleanText = text
      .replace(/[^\S\r\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      text: cleanText,
      pages,
      info,
    };
  } catch (error) {
    console.error("Parser Buffer Service Error:", error);
    throw error;
  }
};

module.exports = { parseResume, parseResumeFromBuffer };