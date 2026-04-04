// Membership page specific interactions
document.addEventListener("DOMContentLoaded", function () {
  // Toggle comparison table
  const toggleBtn = document.getElementById("toggleComparison");
  const comparisonTable = document.getElementById("comparisonTable");

  if (toggleBtn && comparisonTable) {
    toggleBtn.addEventListener("click", function () {
      if (
        comparisonTable.style.display === "none" ||
        !comparisonTable.style.display
      ) {
        comparisonTable.style.display = "block";
        toggleBtn.textContent = "Hide Comparison Table";
      } else {
        comparisonTable.style.display = "none";
        toggleBtn.textContent = "Show Comparison Table";
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || href.startsWith("#!")) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Join buttons - add plan param to registration URL
  const joinBtns = document.querySelectorAll(".join-btn");
  joinBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const plan = this.closest(".membership-card")?.dataset.plan;
      if (plan) {
        let url = "/register";
        if (plan === "standard") url += "?plan=standard";
        else if (plan === "premium") url += "?plan=premium";
        else if (plan === "couples") url += "?plan=couples";
        else if (plan === "premium-couples") url += "?plan=premium-couples";
        else if (plan === "family") url += "?plan=family";
        else if (plan === "premium-family") url += "?plan=premium-family";
        window.location.href = url;
        e.preventDefault();
      }
    });
  });
});
