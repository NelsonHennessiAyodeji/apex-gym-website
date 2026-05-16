// Profile page logic
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("supabase_token");
  if (!token) {
    // Not logged in, redirect to login
    window.location.href = "/login";
    return;
  }

  // DOM elements
  const profileForm = document.getElementById("profileForm");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const dobInput = document.getElementById("dob");
  const genderSelect = document.getElementById("gender");
  const addressInput = document.getElementById("address");
  const emergencyNameInput = document.getElementById("emergencyName");
  const emergencyPhoneInput = document.getElementById("emergencyPhone");
  const healthNotesInput = document.getElementById("healthNotes");
  const membershipPlanSpan = document.getElementById("membershipPlan");
  const fitnessLevelSpan = document.getElementById("fitnessLevel");
  const memberSinceSpan = document.getElementById("memberSince");
  const userNameSpan = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  let userId = null;
  let originalData = {};

  // Fetch user profile
  async function loadProfile() {
    try {
      const response = await fetch("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      const user = data.user;
      const profile = data.profile;

      userId = user.id;

      // Populate form fields
      firstNameInput.value = profile.first_name || "";
      lastNameInput.value = profile.last_name || "";
      emailInput.value = user.email || "";
      phoneInput.value = profile.phone || "";
      dobInput.value = profile.date_of_birth || "";
      genderSelect.value = profile.gender || "";
      addressInput.value = profile.address || "";
      emergencyNameInput.value = profile.emergency_contact_name || "";
      emergencyPhoneInput.value = profile.emergency_contact_phone || "";
      healthNotesInput.value = profile.health_notes || "";

      // Store original values for cancel
      originalData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        address: profile.address,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        health_notes: profile.health_notes,
      };

      // Sidebar stats
      membershipPlanSpan.textContent = (
        profile.membership_plan || "Classic"
      ).toUpperCase();
      fitnessLevelSpan.textContent = (
        profile.fitness_level || "Beginner"
      ).toUpperCase();
      const fullName = `${profile.first_name || ""} ${
        profile.last_name || ""
      }`.trim();
      userNameSpan.textContent = fullName || "Member";
      if (user.created_at) {
        const joinDate = new Date(user.created_at);
        memberSinceSpan.textContent = joinDate.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "long",
        });
      } else {
        memberSinceSpan.textContent = "Recently";
      }
    } catch (error) {
      console.error("Load profile error:", error);
      alert("Could not load profile. Please try again.");
    }
  }

  // Save profile changes
  async function saveProfile(e) {
    e.preventDefault();

    const updatedProfile = {
      first_name: firstNameInput.value,
      last_name: lastNameInput.value,
      phone: phoneInput.value,
      date_of_birth: dobInput.value,
      gender: genderSelect.value,
      address: addressInput.value,
      emergency_contact_name: emergencyNameInput.value,
      emergency_contact_phone: emergencyPhoneInput.value,
      health_notes: healthNotesInput.value,
    };

    try {
      const response = await fetch(`/auth/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile),
      });

      if (response.status === 401) {
        localStorage.removeItem("supabase_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Update failed");
      }

      // Update stored original data
      originalData = { ...updatedProfile };
      alert("Profile updated successfully!");

      // Refresh sidebar name
      const fullName =
        `${updatedProfile.first_name} ${updatedProfile.last_name}`.trim();
      userNameSpan.textContent = fullName || "Member";
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message);
    }
  }

  // Cancel changes: revert to original
  function cancelChanges() {
    firstNameInput.value = originalData.first_name || "";
    lastNameInput.value = originalData.last_name || "";
    phoneInput.value = originalData.phone || "";
    dobInput.value = originalData.date_of_birth || "";
    genderSelect.value = originalData.gender || "";
    addressInput.value = originalData.address || "";
    emergencyNameInput.value = originalData.emergency_contact_name || "";
    emergencyPhoneInput.value = originalData.emergency_contact_phone || "";
    healthNotesInput.value = originalData.health_notes || "";
  }

  // Logout
  async function logout() {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("supabase_token");
    window.location.href = "/";
  }

  // Event listeners
  profileForm.addEventListener("submit", saveProfile);
  cancelBtn.addEventListener("click", cancelChanges);
  logoutBtn.addEventListener("click", logout);

  // Load profile on page load
  loadProfile();
});
