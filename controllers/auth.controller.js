const supabase = require("../db/supabase");

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${req.headers.origin}/login`, // Redirect to login after confirmation
      },
    });

    if (authError) {
      console.log(authError);
      return res.status(400).json({ error: authError.message });
    }

    // Create profile in profiles table
    const { error: profileError } = await supabase.from("profiles").insert([
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
      console.log(profileError);
      return res.status(400).json({ error: profileError.message });
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
      // Check if error is due to email not confirmed
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

// Add resend confirmation endpoint
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
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
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

// Add updateProfile function
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updates = req.body;

    // Verify the user is updating their own profile
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

    // Update profile in database
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
