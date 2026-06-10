const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/order.controller");

// Create a new order with authentication required
router.post("/create", createOrder);

module.exports = router;