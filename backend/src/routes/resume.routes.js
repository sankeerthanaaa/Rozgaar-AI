const express = require("express");
const router = express.Router();
const multer = require("multer");

const { protect } = require("../middleware/auth.middleware");

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "resume-" + Date.now() + ".pdf");
  },
});

const upload = multer({ storage });

// ✅ ONLY THIS ROUTE (safe)
router.post("/upload", protect, upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  res.json({
    success: true,
    file: req.file.filename,
  });
});

module.exports = router;