const supabase = require("../db/supabase");
const { createClient } = require("@supabase/supabase-js");

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

    // 1. Create user in Supabase Auth (with auto‑confirm disabled)
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

    if (!authData.user || !authData.user.id) {
      return res
        .status(500)
        .json({ error: "User creation failed – please try again." });
    }

    // 2. Auto‑confirm the user (bypass email confirmation)
    const { error: confirmError } =
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true,
      });

    if (confirmError) {
      console.error("Auto‑confirm error:", confirmError);
      // Still continue – the user might be confirmed via email later, but we'll still insert profile.
    }

    // 3. Insert profile using service role
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
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res
        .status(400)
        .json({ error: "Could not complete registration. Please try again." });
    }

    // 4. Return success (user can now log in immediately)
    res.json({
      message: "Registration successful! You can now log in.",
      user: authData.user,
      requiresConfirmation: false, // No email confirmation needed
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
  // Not needed anymore, but keep for compatibility
  res.json({ message: "Email confirmation is disabled for this demo." });
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
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
