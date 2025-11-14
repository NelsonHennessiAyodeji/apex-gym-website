require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from 'public'
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", require("./routes/auth.route"));
app.use("/admin", require("./routes/admin.route"));
app.use("/cart", require("./routes/cart.route"));

// Route to serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "registration.html"));
});

// Add this temporary debug route to test if your admin routes are working
app.get("/debug-admin-routes", (req, res) => {
  res.json({
    message: "Admin routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Admin routes
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/admin/shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-shop.html"));
});

app.get("/admin/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-blog.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}...
    in http://localhost:${port}`);
});
