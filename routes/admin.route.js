// src/routes/admin.route.js
const express = require("express");
const router = express.Router();
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

// Admin login
router.post("/login", adminLogin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Shop items routes
router.get("/shop-items", getShopItems);
router.post("/shop-items", createShopItem);
router.put("/shop-items/:id", updateShopItem);
router.delete("/shop-items/:id", deleteShopItem);

// Blog posts routes
router.get("/blog-posts", getBlogPosts);
router.post("/blog-posts", createBlogPost);
router.put("/blog-posts/:id", updateBlogPost);
router.delete("/blog-posts/:id", deleteBlogPost);

module.exports = router;
