document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Create and inject modal HTML for email confirmation
  const modalHTML = `
    <div id="emailConfirmationModal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8);">
      <div class="modal-content" style="background: #1a1a1a; margin: 15% auto; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; border: 2px solid #e53637; text-align: center;">
        <h2 style="color: #e53637; margin-bottom: 20px;">📧 Email Not Confirmed</h2>
        <p style="color: #fff; margin-bottom: 20px; font-size: 16px;">
          Please confirm your email address before logging in.
        </p>
        <p style="color: #b7b7b7; margin-bottom: 25px;">
          We've sent a confirmation email to <strong id="unconfirmedEmail" style="color: #e53637;"></strong>
        </p>
        <div style="margin-bottom: 25px;">
          <p style="color: #b7b7b7; font-size: 14px; margin-bottom: 10px;">
            Need a new confirmation email?
          </p>
          <button id="resendConfirmationBtn" style="background: #e53637; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
            Resend Confirmation Email
          </button>
        </div>
        <button id="closeLoginModalBtn" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("emailConfirmationModal");
  const unconfirmedEmailElement = document.getElementById("unconfirmedEmail");
  const resendConfirmationBtn = document.getElementById(
    "resendConfirmationBtn"
  );
  const closeLoginModalBtn = document.getElementById("closeLoginModalBtn");

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

  // Resend confirmation email
  resendConfirmationBtn.addEventListener("click", async function () {
    const email = document.getElementById("email").value;

    try {
      resendConfirmationBtn.textContent = "Sending...";
      resendConfirmationBtn.disabled = true;

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
      resendConfirmationBtn.textContent = "Resend Confirmation Email";
      resendConfirmationBtn.disabled = false;
    }
  });

  // Close modal
  closeLoginModalBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // Form submission
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Logging in...";
      submitBtn.disabled = true;

      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if error is due to email not confirmed
        if (data.error === "EMAIL_NOT_CONFIRMED") {
          // Show the email confirmation modal instead of alert
          unconfirmedEmailElement.textContent = email;
          modal.style.display = "block";
          return;
        }
        throw new Error(data.message || data.error || "Login failed");
      }

      // Store the session token for future requests
      if (data.session) {
        localStorage.setItem("supabase_token", data.session.access_token);
      }

      console.log("Login successful, redirecting to profile...");
      window.location.href = "profile.html";
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    } finally {
      // Reset button state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Login to Account";
      submitBtn.disabled = false;
    }
  });
});
