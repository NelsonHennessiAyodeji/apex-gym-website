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
      // If profile creation fails, delete the auth user (optional)
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log(profileError);

      return res.status(400).json({ error: profileError.message });
    }

    res.json({
      message: "Registration successful",
      user: authData.user,
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
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

module.exports = { register, login, logout, getProfile };
