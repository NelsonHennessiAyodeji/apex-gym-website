const supabase = require("../db/supabase");
const { createClient } = require("@supabase/supabase-js");

// Create admin client with service role key for profile inserts (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dob,
      gender,
      fitnessLevel,
      address,
      emergencyContactName,
      emergencyContactPhone,
      membershipPlan,
      healthConditions,
      healthNotes,
    } = req.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${req.headers.origin}/login`,
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return res.status(400).json({ error: authError.message });
    }

    // Guard: ensure user object exists
    if (!authData.user || !authData.user.id) {
      console.error("No user returned from signup:", authData);
      return res
        .status(500)
        .json({ error: "User creation failed – please try again." });
    }

    // 2. Insert profile using SERVICE ROLE (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          date_of_birth: dob,
          gender: gender,
          fitness_level: fitnessLevel,
          address: address,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          membership_plan: membershipPlan,
          health_conditions: healthConditions,
          health_notes: healthNotes,
        },
      ]);

    if (profileError) {
      console.error("Profile insert error:", profileError);
      // Profile insert failed – but user already created. Delete the auth user to keep consistency.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res
        .status(400)
        .json({ error: "Could not complete registration. Please try again." });
    }

    res.json({
      message:
        "Registration successful! Please check your email to confirm your account.",
      user: authData.user,
      requiresConfirmation: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return res.status(400).json({
          error: "EMAIL_NOT_CONFIRMED",
          message: "Please confirm your email address before logging in.",
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Login successful",
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body;

    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${req.headers.origin}/login`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Confirmation email sent! Please check your inbox.",
      data: data,
    });
  } catch (error) {
    console.error("Resend confirmation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile missing, create it using service role
    if (profileError && profileError.code === "PGRST116") {
      console.log(`Profile missing for user ${user.id}. Creating one...`);

      const newProfile = {
        id: user.id,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: "",
        date_of_birth: null,
        gender: "",
        fitness_level: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        membership_plan: "classic",
        health_conditions: [],
        health_notes: "",
      };

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create missing profile:", insertError);
        return res.status(500).json({ error: "Profile creation failed" });
      }

      profile = inserted;
    } else if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    res.json({ user, profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;

    const token = req.headers.authorization?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this profile" });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.log("Update error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Profile updated successfully",
      profile: data,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  resendConfirmation,
};
