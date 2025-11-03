document.addEventListener("DOMContentLoaded", function () {
  // Create and inject modal HTML
  const modalHTML = `
    <div id="messageModal" class="modal" style="display: none;">
      <div class="modal-content">
        <h2 id="modalTitle">Message</h2>
        <p id="modalMessage">This is a message</p>
        <div class="modal-actions">
          <button id="modalConfirmBtn" class="modal-btn primary">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("messageModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  // Modal functionality
  modalConfirmBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // Function to show modal messages
  window.showModal = function (title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = "block";
  };

  // Check if user is authenticated and load profile data
  checkAuthAndLoadProfile();

  // Navigation functionality
  setupNavigation();

  // Edit/Save functionality
  setupEditFunctionality();

  // Purchase History functionality
  setupPurchaseHistory();

  // Membership action buttons
  setupMembershipActions();

  // Logout functionality
  setupLogoutFunctionality();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll(".profile-nav a");
  const tabs = document.querySelectorAll(".profile-tab");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all links and tabs
      navLinks.forEach((l) => l.classList.remove("active"));
      tabs.forEach((tab) => {
        tab.classList.remove("active");
        tab.style.display = "none";
      });

      // Add active class to clicked link
      this.classList.add("active");

      // Show the corresponding tab
      const tabId = this.getAttribute("data-tab");
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add("active");
        targetTab.style.display = "block";
      }
    });
  });
}

function setupEditFunctionality() {
  const editProfileBtn = document.querySelector(".edit-profile-btn");
  const saveBtn = document.querySelector(".save-btn");
  let isEditing = false;
  let originalValues = {};

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", function (e) {
      e.preventDefault();
      toggleEditMode(!isEditing);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      await saveProfileChanges();
    });
  }

  function toggleEditMode(enable) {
    isEditing = enable;
    const editableFields = [
      "firstName",
      "lastName",
      "phone",
      "dob",
      "gender",
      "fitnessLevel",
      "address",
      "emergencyContact",
    ];

    // Toggle edit mode on profile container
    document
      .querySelector(".profile-container")
      .classList.toggle("edit-mode", enable);

    editableFields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        if (enable) {
          // Store original values when starting edit
          originalValues[field] = element.value;
          element.readOnly = false;
          if (element.tagName === "SELECT") {
            element.disabled = false;
          }
        } else {
          // Restore original values when canceling
          if (originalValues[field] !== undefined) {
            element.value = originalValues[field];
          }
          element.readOnly = true;
          if (element.tagName === "SELECT") {
            element.disabled = true;
          }
        }
      }
    });

    if (saveBtn) {
      saveBtn.style.display = enable ? "block" : "none";
    }

    if (editProfileBtn) {
      editProfileBtn.textContent = enable ? "Cancel Editing" : "Edit Profile";
    }
  }

  async function saveProfileChanges() {
    try {
      const token = localStorage.getItem("supabase_token");
      if (!token) {
        showModal("Session Expired", "Please login again to save changes");
        window.location.href = "login.html";
        return;
      }

      // Get updated values
      const updates = {
        first_name: document.getElementById("firstName").value,
        last_name: document.getElementById("lastName").value,
        phone: document.getElementById("phone").value,
        date_of_birth: document.getElementById("dob").value,
        gender: document.getElementById("gender").value,
        fitness_level: document.getElementById("fitnessLevel").value,
        address: document.getElementById("address").value,
      };

      // Parse emergency contact (split name and phone)
      const emergencyContact =
        document.getElementById("emergencyContact").value;
      if (emergencyContact.includes(" - ")) {
        const [name, phone] = emergencyContact.split(" - ");
        updates.emergency_contact_name = name;
        updates.emergency_contact_phone = phone;
      }

      // Show loading
      const saveBtn = document.querySelector(".save-btn");
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Saving...";
      saveBtn.disabled = true;

      // Get user ID first
      const profileResponse = await fetch("/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to get user profile");
      }

      const profileData = await profileResponse.json();
      const userId = profileData.user.id;

      // Update profile in database
      const updateResponse = await fetch(`/auth/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      showModal("Success", "Profile updated successfully!");
      toggleEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showModal("Error", "Failed to update profile: " + error.message);
    } finally {
      const saveBtn = document.querySelector(".save-btn");
      if (saveBtn) {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
      }
    }
  }
}

function setupPurchaseHistory() {
  // Add click handlers for view order buttons
  const viewOrderBtns = document.querySelectorAll(".view-order-btn");
  viewOrderBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const row = this.closest("tr");
      const orderId = row.cells[0].textContent;
      const orderDate = row.cells[1].textContent;
      const items = row.cells[2].textContent;
      const total = row.cells[3].textContent;
      const status = row.cells[4].textContent;

      showModal(
        `Order Details - ${orderId}`,
        `Date: ${orderDate}\nItems: ${items}\nTotal: ${total}\nStatus: ${status}\n\nDetailed order information will be available soon!`
      );
    });
  });
}

function setupMembershipActions() {
  const renewBtn = document.querySelector(".renew-btn");
  const upgradeBtn = document.querySelector(".upgrade-btn");

  if (renewBtn) {
    renewBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(
        "Renew Membership",
        "Membership renewal will be available soon! Please visit our front desk or call us to renew your membership."
      );
    });
  }

  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(
        "Upgrade Plan",
        "Plan upgrade functionality is coming soon! Please contact our staff for membership upgrades."
      );
    });
  }
}

function setupLogoutFunctionality() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function (e) {
      e.preventDefault();

      try {
        const response = await fetch("/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        localStorage.removeItem("supabase_token");
        showModal("Success", "Logout successful!");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("supabase_token");
        window.location.href = "login.html";
      }
    });
  }
}

async function checkAuthAndLoadProfile() {
  try {
    const token = localStorage.getItem("supabase_token");

    if (!token) {
      showModal("Authentication Required", "Please login to view your profile");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return;
    }

    const response = await fetch("/auth/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        localStorage.removeItem("supabase_token");
        showModal(
          "Session Expired",
          "Your session has expired. Please login again."
        );
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
        return;
      }
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    populateProfileData(data);
  } catch (error) {
    console.error("Error loading profile:", error);
    localStorage.removeItem("supabase_token");
    showModal(
      "Error",
      "Error loading profile data. Please try logging in again."
    );
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  }
}

function populateProfileData(data) {
  const user = data.user;
  const profile = data.profile;

  // Populate profile header
  document.querySelector(
    ".profile-info h1"
  ).textContent = `${profile.first_name} ${profile.last_name}`;
  document.querySelector(".profile-info p").textContent = user.email;

  // Format and display member since date
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  document.querySelector(
    ".member-since"
  ).textContent = `Member since ${memberSince}`;

  // Populate account details form
  document.getElementById("firstName").value = profile.first_name || "";
  document.getElementById("lastName").value = profile.last_name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = profile.phone || "";
  document.getElementById("dob").value = profile.date_of_birth || "";
  document.getElementById("gender").value = profile.gender || "";
  document.getElementById("fitnessLevel").value = profile.fitness_level || "";
  document.getElementById("address").value = profile.address || "";

  // Emergency contact (combine name and phone)
  const emergencyContact = profile.emergency_contact_name
    ? `${profile.emergency_contact_name} - ${
        profile.emergency_contact_phone || ""
      }`
    : "";
  document.getElementById("emergencyContact").value = emergencyContact;

  // Populate membership details
  if (profile.membership_plan) {
    const planName =
      profile.membership_plan.charAt(0).toUpperCase() +
      profile.membership_plan.slice(1);
    document.querySelector(
      ".membership-name"
    ).textContent = `${planName} Membership`;

    // Update stats with actual membership plan
    const statCards = document.querySelectorAll(".stat-card");
    if (statCards.length >= 3) {
      statCards[2].querySelector(".stat-value").textContent = planName;
    }
  }

  // Populate health information
  const healthConditions = profile.health_conditions || [];
  const conditionsList = document.querySelector(".conditions-list");
  if (conditionsList) {
    if (healthConditions.length > 0 && !healthConditions.includes("none")) {
      conditionsList.innerHTML = healthConditions
        .map((condition) => `<li>${formatHealthCondition(condition)}</li>`)
        .join("");
    } else {
      conditionsList.innerHTML = "<li>None reported</li>";
    }
  }

  const healthNotesElement = document.querySelector(".health-value");
  if (healthNotesElement) {
    healthNotesElement.textContent =
      profile.health_notes || "No additional health notes provided.";
  }

  // Update stats with placeholder data (since Supabase doesn't have these)
  updateStatsWithPlaceholderData();
}

function formatHealthCondition(condition) {
  const conditionMap = {
    heart: "Heart Condition",
    bloodPressure: "High Blood Pressure",
    diabetes: "Diabetes",
    asthma: "Asthma",
    joint: "Joint Problems",
    none: "None",
  };
  return conditionMap[condition] || condition;
}

function updateStatsWithPlaceholderData() {
  // These are placeholder values since Supabase doesn't store this data
  const stats = {
    weight: "82 kg",
    bmi: "24.5",
    status: "Active",
  };

  const statCards = document.querySelectorAll(".stat-card");
  if (statCards.length >= 4) {
    statCards[0].querySelector(".stat-value").textContent = stats.weight;
    statCards[1].querySelector(".stat-value").textContent = stats.bmi;
    statCards[3].querySelector(".stat-value").textContent = stats.status;
  }
}
