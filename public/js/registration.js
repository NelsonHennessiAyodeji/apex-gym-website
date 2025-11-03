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

  // Create and inject modal HTML
  const modalHTML = `
    <div id="emailConfirmationModal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8);">
      <div class="modal-content" style="background: #1a1a1a; margin: 15% auto; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; border: 2px solid #e53637; text-align: center;">
        <h2 style="color: #e53637; margin-bottom: 20px;">🎉 Registration Successful!</h2>
        <p style="color: #fff; margin-bottom: 20px; font-size: 16px;">
          We've sent a confirmation email to <strong id="userEmail" style="color: #e53637;"></strong>
        </p>
        <p style="color: #b7b7b7; margin-bottom: 25px;">
          Please check your inbox and click the confirmation link to activate your account.
        </p>
        <div style="margin-bottom: 25px;">
          <p style="color: #b7b7b7; font-size: 14px; margin-bottom: 10px;">
            Didn't receive the email?
          </p>
          <button id="resendEmailBtn" style="background: #e53637; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
            Resend Confirmation Email
          </button>
        </div>
        <button id="closeModalBtn" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("emailConfirmationModal");
  const userEmailElement = document.getElementById("userEmail");
  const resendEmailBtn = document.getElementById("resendEmailBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

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

  // Resend confirmation email
  resendEmailBtn.addEventListener("click", async function () {
    const email = document.getElementById("email").value;

    try {
      resendEmailBtn.textContent = "Sending...";
      resendEmailBtn.disabled = true;

      const response = await fetch("/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend email");
      }

      alert("Confirmation email sent! Please check your inbox.");
    } catch (error) {
      console.error("Resend error:", error);
      alert("Failed to resend email: " + error.message);
    } finally {
      resendEmailBtn.textContent = "Resend Confirmation Email";
      resendEmailBtn.disabled = false;
    }
  });

  // Close modal
  closeModalBtn.addEventListener("click", function () {
    modal.style.display = "none";
    window.location.href = "login.html";
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
          password,
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Show success modal instead of alert
      userEmailElement.textContent = email;
      modal.style.display = "block";
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
