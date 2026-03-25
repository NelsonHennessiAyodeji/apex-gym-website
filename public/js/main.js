// Main JavaScript for Ape-X Gym Homepage
document.addEventListener("DOMContentLoaded", function () {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // Membership card hover effects
  const membershipCards = document.querySelectorAll(".membership-card");
  membershipCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px)";
      this.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.2)";
    });

    card.addEventListener("mouseleave", function () {
      if (!this.classList.contains("featured")) {
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "var(--shadow)";
      } else {
        this.style.transform = "scale(1.05)";
      }
    });
  });

  // Location card hover effects
  const locationCards = document.querySelectorAll(".location-card");
  locationCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      const img = this.querySelector(".location-image img");
      if (img) {
        img.style.transform = "scale(1.05)";
      }
    });

    card.addEventListener("mouseleave", function () {
      const img = this.querySelector(".location-image img");
      if (img) {
        img.style.transform = "scale(1)";
      }
    });
  });

  // Language selector functionality
  const langSelectors = document.querySelectorAll(
    ".lang-select, .mobile-lang-select"
  );
  langSelectors.forEach((selector) => {
    selector.addEventListener("change", function () {
      const selectedLang = this.value;
      // Here you would typically make an API call to change language
      console.log("Language changed to:", selectedLang);

      // For demo purposes, show a toast notification
      showNotification(`Language changed to ${selectedLang}`);
    });
  });

  // Button hover effects
  const buttons = document.querySelectorAll(
    ".btn-primary, .btn-secondary, .btn-join"
  );
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Newsletter form submission
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;

      if (validateEmail(email)) {
        // Simulate API call
        setTimeout(() => {
          showNotification(
            "Thank you for subscribing to our newsletter!",
            "success"
          );
          this.reset();
        }, 1000);
      } else {
        showNotification("Please enter a valid email address.", "error");
      }
    });
  }

  // Helper function to validate email
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Notification system
  function showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => {
      notification.remove();
    });

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === "error" ? "#ff3b30" : "#000000"};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
  document.head.appendChild(style);

  // Lazy loading images
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Initialize tooltips for membership features
  initializeTooltips();
});

function initializeTooltips() {
  const features = document.querySelectorAll(".membership-features li");
  features.forEach((feature) => {
    feature.addEventListener("mouseenter", function () {
      const tooltip = this.getAttribute("data-tooltip");
      if (tooltip) {
        showTooltip(this, tooltip);
      }
    });

    feature.addEventListener("mouseleave", function () {
      hideTooltip();
    });
  });
}

function showTooltip(element, text) {
  // Remove existing tooltip
  const existingTooltip = document.querySelector(".custom-tooltip");
  if (existingTooltip) {
    existingTooltip.remove();
  }

  // Create new tooltip
  const tooltip = document.createElement("div");
  tooltip.className = "custom-tooltip";
  tooltip.textContent = text;

  // Position tooltip
  const rect = element.getBoundingClientRect();
  tooltip.style.cssText = `
        position: fixed;
        top: ${rect.top - 40}px;
        left: ${rect.left}px;
        background-color: #000000;
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
    `;

  document.body.appendChild(tooltip);
}

function hideTooltip() {
  const tooltip = document.querySelector(".custom-tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}
