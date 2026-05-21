const express = require("express");
const passport = require("passport");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

// ✅ DEBUG (remove later)
console.log("getProfile:", getProfile);
console.log("protect:", protect);

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const profile = req.user;
      const User = require("../models/User.model");
      const jwt = require("jsonwebtoken");

      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        
        if (email) {
          user = await User.findOne({ email });
        }

        if (user) {
          user.googleId = profile.id;
          if (!user.profilePic && profile.photos && profile.photos[0]) {
            user.profilePic = profile.photos[0].value;
          }
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || "Google User",
            email: email,
            profilePic: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            isVerified: true,
          });
        }
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
    } catch (error) {
      console.error("Google Auth Callback Error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

module.exports = router;