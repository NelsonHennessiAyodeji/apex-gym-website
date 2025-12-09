const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  adminLogin,
  adminLogout,
  verifyAdminSession,
  getActiveSessions,
  getDashboardStats,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require("../controllers/admin.controller.js");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

// Public routes
router.post("/login", adminLogin);

// Debug route (remove in production)
router.get("/debug/sessions", getActiveSessions);

// Protected routes
router.post("/logout", verifyAdminSession, adminLogout);
router.get("/dashboard/stats", verifyAdminSession, getDashboardStats);

// Shop items routes
router.get("/shop-items", verifyAdminSession, getShopItems);
router.post(
  "/shop-items",
  verifyAdminSession,
  upload.single("image"),
  handleMulterError,
  createShopItem
);
router.put(
  "/shop-items/:id",
  verifyAdminSession,
  upload.single("image"),
  handleMulterError,
  updateShopItem
);
router.delete("/shop-items/:id", verifyAdminSession, deleteShopItem);

// Blog posts routes
router.get("/blog-posts", verifyAdminSession, getBlogPosts);
router.post("/blog-posts", verifyAdminSession, createBlogPost);
router.put("/blog-posts/:id", verifyAdminSession, updateBlogPost);
router.delete("/blog-posts/:id", verifyAdminSession, deleteBlogPost);

module.exports = router;
