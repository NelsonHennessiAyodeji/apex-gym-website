const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  logout,
} = require("../controllers/auth.controller");

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

// Logout user
router.post("/logout", logout);

// Get user profile
router.get("/profile", getProfile);

module.exports = router;
