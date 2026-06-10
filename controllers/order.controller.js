const supabase = require("../db/supabase");
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const createOrder = async (req, res) => {
  try {
    console.log("📦 Order creation request received");

    const { email, total, items, billingDetails } = req.body;

    // 1. Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "No authorization header" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    console.log("✅ User ID:", user.id);

    // 2. Call the database function to insert order
    const { data: orderId, error: insertError } = await supabaseAdmin.rpc("insert_order", {
      p_user_id: user.id,
      p_email: email,
      p_total_amount: total,
      p_items: items,
      p_billing_address: billingDetails.address,
      p_billing_city: billingDetails.city,
      p_billing_state: billingDetails.state,
      p_payment_reference: billingDetails.reference
    });

    if (insertError) {
      console.error("💥 Insert error:", insertError);
      return res.status(500).json({
        success: false,
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    }

    console.log("✅ Order saved with ID:", orderId);

    // 3. Clear the user's cart after successful order
    const { error: clearError } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (clearError) {
      console.warn("⚠️ Cart clear error (non‑fatal):", clearError);
    }

    res.json({ success: true, orderId: orderId });
  } catch (error) {
    console.error("🔥 Unexpected error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createOrder };