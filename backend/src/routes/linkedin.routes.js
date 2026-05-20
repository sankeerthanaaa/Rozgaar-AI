const express = require("express");
const router = express.Router();
const {
  linkedinCallback,
  importLinkedinProfile,
} = require("../controllers/linkedin.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/callback", linkedinCallback);
router.post("/import", protect, importLinkedinProfile);

module.exports = router;