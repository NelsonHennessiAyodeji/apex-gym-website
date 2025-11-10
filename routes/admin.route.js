const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  adminLogin,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getDashboardStats,
} = require("../controllers/admin.controller.js");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Admin login
router.post("/login", adminLogin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Shop items routes with file upload
router.get("/shop-items", getShopItems);
router.post("/shop-items", upload.single("image"), createShopItem);
router.put("/shop-items/:id", upload.single("image"), updateShopItem);
router.delete("/shop-items/:id", deleteShopItem);

// Blog posts routes
router.get("/blog-posts", getBlogPosts);
router.post("/blog-posts", createBlogPost);
router.put("/blog-posts/:id", updateBlogPost);
router.delete("/blog-posts/:id", deleteBlogPost);

module.exports = router;
