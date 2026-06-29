const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../controllers/contact.controller");

// POST /contact – send contact form email
router.post("/", sendContactEmail);

module.exports = router;