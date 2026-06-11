const supabase = require("../db/supabase");
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function verifyPaystackTransaction(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("❌ PAYSTACK_SECRET_KEY not set");
    return { success: false, message: "Payment gateway not configured" };
  }
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!data.status) {
      return { success: false, message: data.message };
    }
    if (data.data.status === "success") {
      return { success: true, data: data.data };
    } else {
      return { success: false, message: `Payment status: ${data.data.status}` };
    }
  } catch (error) {
    console.error("Paystack verification error:", error);
    return { success: false, message: error.message };
  }
}

const createOrder = async (req, res) => {
  try {
    console.log("📦 Order creation request received");

    const { email, total, items, billingDetails } = req.body;
    const paymentReference = billingDetails.reference;

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

    console.log("🔍 Verifying Paystack transaction:", paymentReference);
    const verification = await verifyPaystackTransaction(paymentReference);
    if (!verification.success) {
      console.error("❌ Payment verification failed:", verification.message);
      return res.status(400).json({
        success: false,
        error: "Payment verification failed. Please contact support.",
        details: verification.message,
      });
    }
    console.log("✅ Payment verified successfully. Amount:", verification.data.amount / 100);

    const orderData = {
      user_id: user.id,
      email: email,
      total_amount: total,
      items: items,
      billing_address: billingDetails.address,
      billing_city: billingDetails.city,
      billing_state: billingDetails.state,
      payment_reference: paymentReference,
      status: 'paid',
      created_at: new Date().toISOString()
    };

    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select("id")
      .single();

    if (insertError) {
      console.error("💥 Insert error:", insertError);
      return res.status(500).json({
        success: false,
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    }

    const orderId = insertedOrder.id;
    console.log("✅ Order saved with ID:", orderId, "Status: paid");

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