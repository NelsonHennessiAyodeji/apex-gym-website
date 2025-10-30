document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const membershipOptions = document.querySelectorAll(".membership-option");
  const membershipPlanInput = document.getElementById("membershipPlan");

  // Toggle password visibility
  togglePassword.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.innerHTML =
      type === "password"
        ? '<i class="fa fa-eye"></i>'
        : '<i class="fa fa-eye-slash"></i>';
  });

  // Toggle confirm password visibility
  toggleConfirmPassword.addEventListener("click", function () {
    const type =
      confirmPasswordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    confirmPasswordInput.setAttribute("type", type);
    this.innerHTML =
      type === "password"
        ? '<i class="fa fa-eye"></i>'
        : '<i class="fa fa-eye-slash"></i>';
  });

  // Membership selection
  membershipOptions.forEach((option) => {
    option.addEventListener("click", function () {
      membershipOptions.forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
      membershipPlanInput.value = this.getAttribute("data-plan");
    });
  });

  // Health conditions logic
  const noneCheckbox = document.getElementById("none");
  const otherCheckboxes = document.querySelectorAll(
    'input[name="healthConditions"]:not(#none)'
  );

  noneCheckbox.addEventListener("change", function () {
    if (this.checked) {
      otherCheckboxes.forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.disabled = true;
      });
    } else {
      otherCheckboxes.forEach((checkbox) => {
        checkbox.disabled = false;
      });
    }
  });

  otherCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        noneCheckbox.checked = false;
        noneCheckbox.disabled = true;
      } else {
        // If no other checkboxes are checked, enable none checkbox
        const anyChecked = Array.from(otherCheckboxes).some((cb) => cb.checked);
        if (!anyChecked) {
          noneCheckbox.disabled = false;
        }
      }
    });
  });

  // Form submission
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get form values
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const gender = document.getElementById("gender").value;
    const fitnessLevel = document.getElementById("fitnessLevel").value;
    const address = document.getElementById("address").value;
    const emergencyContactName = document.getElementById(
      "emergencyContactName"
    ).value;
    const emergencyContactPhone = document.getElementById(
      "emergencyContactPhone"
    ).value;
    const membershipPlan = membershipPlanInput.value;
    const healthNotes = document.getElementById("healthNotes").value;
    const terms = document.getElementById("terms").checked;

    // Get health conditions
    const healthConditionCheckboxes = document.querySelectorAll(
      'input[name="healthConditions"]:checked'
    );
    const healthConditions = Array.from(healthConditionCheckboxes).map(
      (cb) => cb.value
    );

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !dob ||
      !password ||
      !confirmPassword ||
      !gender ||
      !fitnessLevel
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (!terms) {
      alert("You must agree to the Terms and Conditions");
      return;
    }

    try {
      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Creating Account...";
      submitBtn.disabled = true;

      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          dob,
          password,
          gender,
          fitnessLevel,
          address,
          emergencyContactName,
          emergencyContactPhone,
          membershipPlan,
          healthConditions,
          healthNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert(
        "Registration successful! Welcome to Ape-X Gym. Redirecting to home page..."
      );
      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed: " + error.message);
    } finally {
      // Reset button state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Create Account";
      submitBtn.disabled = false;
    }
  });

  // Set minimum date for date of birth (18 years ago)
  const dobInput = document.getElementById("dob");
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  dobInput.max = minDate.toISOString().split("T")[0];
});
