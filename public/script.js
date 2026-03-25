// Load components dynamically
async function loadComponents() {
  try {
    const headerResponse = await fetch("/components/header.html");
    const footerResponse = await fetch("/components/footer.html");

    const headerHTML = await headerResponse.text();
    const footerHTML = await footerResponse.text();

    document.getElementById("header").innerHTML = headerHTML;
    document.getElementById("footer").innerHTML = footerHTML;

    // Initialize components after loading
    initializeHeader();
    initializeAnimations();
  } catch (error) {
    console.error("Error loading components:", error);
  }
}

// Initialize header functionality
function initializeHeader() {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("active");
      mobileMenuToggle.classList.toggle("active");

      // Animate hamburger to X
      const spans = mobileMenuToggle.querySelectorAll("span");
      if (mobileNav.classList.contains("active")) {
        spans[0].style.transform = "rotate(45deg) translate(6px, 6px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
      } else {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      }
    });
  }

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      mobileNav &&
      mobileNav.classList.contains("active") &&
      !mobileNav.contains(event.target) &&
      !mobileMenuToggle.contains(event.target)
    ) {
      mobileNav.classList.remove("active");
      mobileMenuToggle.classList.remove("active");

      const spans = mobileMenuToggle.querySelectorAll("span");
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "none";
    }
  });

  // Close mobile menu on ESC key
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      mobileNav &&
      mobileNav.classList.contains("active")
    ) {
      mobileNav.classList.remove("active");
      mobileMenuToggle.classList.remove("active");

      const spans = mobileMenuToggle.querySelectorAll("span");
      spans[0].style.transform = "none";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "none";
    }
  });
}

// Initialize scroll animations
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  document.querySelectorAll(".fade-in:not(.animated)").forEach((el) => {
    observer.observe(el);
    el.classList.add("animated");
  });
}

// Handle membership card hover effects
function initializeMembershipCards() {
  const cards = document.querySelectorAll(".membership-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-10px)";
      card.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.3)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "none";
    });
  });
}

// Initialize location filtering (placeholder for future functionality)
function initializeLocations() {
  // This will be expanded when we implement location search
  console.log("Locations system ready for implementation");
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (href === "#" || href.startsWith("#!")) return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadComponents();
  initializeSmoothScrolling();

  // Initialize features that don't depend on components
  initializeMembershipCards();
  initializeLocations();

  // Add loading animation for buttons
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", function (e) {
      if (this.href && this.href !== "#") {
        this.classList.add("loading");
        this.innerHTML = '<span class="loading-dots">...</span>';

        // Simulate loading for demo purposes
        setTimeout(() => {
          this.classList.remove("loading");
          this.innerHTML =
            this.getAttribute("data-original-text") || this.innerHTML;
        }, 1000);
      }
    });
  });
});

// Handle window resize for responsive adjustments
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Reinitialize animations on resize
    initializeAnimations();
  }, 250);
});

// Add loading styles to CSS
const style = document.createElement("style");
style.textContent = `
    .loading {
        position: relative;
        pointer-events: none;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .loading-dots {
        display: inline-block;
        animation: dots 1.5s infinite;
    }
    
    @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
    }
`;
document.head.appendChild(style);
