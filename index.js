require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Admin routes with session verification
const { verifyAdminSession } = require("./controllers/admin.controller");

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/admin/dashboard", verifyAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/admin/shop", verifyAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-shop.html"));
});

app.get("/admin/blog", verifyAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-blog.html"));
});

// Public API for shop items (no authentication required)
app.get("/api/shop-items", async (req, res) => {
  try {
    const supabase = require("./db/supabase");

    let query = supabase.from("shop_items").select("*").eq("status", "active");

    // Handle category filter
    if (req.query.category && req.query.category !== "all") {
      query = query.eq("category", req.query.category);
    }

    // Handle price range filter
    if (req.query.minPrice) {
      query = query.gte("price", parseFloat(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      query = query.lte("price", parseFloat(req.query.maxPrice));
    }

    // Handle search
    if (req.query.search) {
      query = query.or(
        `name.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`
      );
    }

    // Handle sorting
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("name", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching shop items:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }

    // Filter out inactive products for public access
    const activeProducts = data.filter((item) => item.status === "active");

    // Add pagination info
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = activeProducts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(activeProducts.length / limit),
        totalItems: activeProducts.length,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Get public shop items error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}...
    in http://localhost:${port}`);
});
