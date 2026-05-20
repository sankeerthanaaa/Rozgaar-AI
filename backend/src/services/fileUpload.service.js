const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter - PDF, DOCX, DOC, TXT
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain"
  ];
  if (allowedMimeTypes.includes(file.mimetype) || 
      /\.(pdf|doc|docx|txt)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"), false);
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Delete file from uploads folder
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error("Delete File Error:", error);
    throw error;
  }
};

// Get file buffer from path
const getFileBuffer = (filePath) => {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error("Get File Buffer Error:", error);
    throw error;
  }
};

module.exports = { upload, deleteFile, getFileBuffer };