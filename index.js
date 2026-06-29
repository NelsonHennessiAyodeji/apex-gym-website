require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const supabase = require("./db/supabase");
const app = express();
const port = process.env.PORT || 3000;

// Admin routes with session verification
const { verifyAdminSession } = require("./controllers/admin.controller");

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve static files (CSS, JS, images) from 'public'
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", require("./routes/auth.route"));
app.use("/admin", require("./routes/admin.route"));
app.use("/cart", require("./routes/cart.route"));
app.use("/api", require("./routes/api.route"));
app.use("/orders", require("./routes/order.route"));
app.use("/contact", require("./routes/contact.route"));

// Componenets Routes
// Update the static file serving section
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Route to serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/membership", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "membership.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// Add this route after other HTML routes
app.get("/why", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "why.html"));
});

// Add this route after other HTML routes
app.get("/shop", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "shop.html"));
});

// Add this route for the About page
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Public blog listing page
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

// Public API for blog posts (no auth)
app.get('/api/blog-posts', async (req, res) => {
  const { getPublicBlogPosts } = require('./controllers/admin.controller');
  await getPublicBlogPosts(req, res);
});

// Public single blog post API
app.get('/api/blog-posts/:id', async (req, res) => {
  const { getPublicBlogPostById } = require('./controllers/admin.controller');
  await getPublicBlogPostById(req, res);
});

// Public single blog post HTML page
app.get('/blog-post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
});

// Add these routes after existing HTML routes
app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "terms.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

// Paystack public key endpoint (for frontend) to Verify Paystack payment
app.get("/api/verify-payment", async (req, res) => {
  const reference = req.query.reference;
  if (!reference) {
    return res.status(400).json({ success: false, error: "Missing reference" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY not set");
    return res.status(500).json({ success: false, error: "Payment system misconfigured" });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ success: false, error: data.message || "Verification failed" });
    }

    const paymentStatus = data.data.status; // "success", "failed", "pending"
    if (paymentStatus === "success") {
      res.json({ success: true, status: "paid", data: data.data });
    } else {
      res.json({ success: true, status: "failed", message: `Payment status: ${paymentStatus}` });
    }
  } catch (error) {
    console.error("Paystack verification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get authenticated user's orders
app.get("/api/my-orders", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "No token" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, orders: orders || [] });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Add route for header and footer includes
app.get("/header", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "header.html"));
});

app.get("/footer", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "footer.html"));
});

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

app.get("/admin/blog", verifyAdminSession, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-orders.html"));
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
