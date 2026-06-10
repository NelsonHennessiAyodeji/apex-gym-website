const express = require("express");
const router = express.Router();

router.get("/paystack-key", (req, res) => {
  const key = process.env.PAYSTACK_PUBLIC_KEY;
  if (!key) {
    return res.status(500).json({ success: false, error: "Paystack key not configured" });
  }
  res.json({ success: true, key: key });
});

module.exports = router;