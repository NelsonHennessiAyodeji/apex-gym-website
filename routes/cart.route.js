const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cart.controller");

// Get user's cart
router.get("/", getCart);

// Add item to cart
router.post("/add", addToCart);

// Update cart item quantity
router.put("/update/:productId", updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

module.exports = router;
