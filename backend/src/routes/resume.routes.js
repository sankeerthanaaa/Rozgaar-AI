const express = require("express");
const router = express.Router();
const { upload } = require("../services/fileUpload.service");
const { protect } = require("../middleware/auth.middleware");
const {
  uploadResume,
  analyzeResume,
  getResumes,
  getResumeById,
  deleteResume,
  downloadModifiedResume,
} = require("../controllers/resume.controller");

// Upload resume & run ATS analysis (PDF parsed once)
router.post("/upload", protect, upload.single("resume"), uploadResume);

router.post("/:id/analyze", protect, analyzeResume);

// Get all resumes for authenticated user
router.get("/", protect, getResumes);

// Download modified resume with applied suggestions
router.post("/download-modified", protect, downloadModifiedResume);

// Get single resume detail
router.get("/:id", protect, getResumeById);

// Delete resume
router.delete("/:id", protect, deleteResume);

module.exports = router;