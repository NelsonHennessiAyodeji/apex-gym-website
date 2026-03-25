// Mobile Menu Functionality
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const closeMenu = document.getElementById("closeMenu");
  const mobileDropdowns = document.querySelectorAll(".mobile-dropdown");

  // Toggle Mobile Menu
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", function () {
      mobileNav.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  // Close Mobile Menu
  if (closeMenu) {
    closeMenu.addEventListener("click", function () {
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (
      mobileNav.classList.contains("active") &&
      !mobileNav.contains(event.target) &&
      !mobileMenuToggle.contains(event.target)
    ) {
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Mobile Dropdown Functionality
  mobileDropdowns.forEach((dropdown) => {
    const link = dropdown.querySelector(".mobile-nav-link");
    const submenu = dropdown.querySelector(".mobile-submenu");
    const chevron = link.querySelector("i");

    link.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Close other dropdowns
      mobileDropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove("active");
          otherDropdown
            .querySelector(".mobile-submenu")
            .classList.remove("active");
          otherDropdown.querySelector("i").style.transform = "rotate(0deg)";
        }
      });

      // Toggle current dropdown
      dropdown.classList.toggle("active");
      submenu.classList.toggle("active");

      if (dropdown.classList.contains("active")) {
        chevron.style.transform = "rotate(180deg)";
      } else {
        chevron.style.transform = "rotate(0deg)";
      }
    });
  });

  // Close menu on Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileNav.classList.contains("active")) {
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Update active nav link based on scroll position
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");

  function updateActiveNavLink() {
    let scrollPos = window.scrollY + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      const sectionId = section.getAttribute("id");

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  // Call on scroll
  window.addEventListener("scroll", updateActiveNavLink);
});
