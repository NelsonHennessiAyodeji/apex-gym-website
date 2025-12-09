const supabase = require("../db/supabase");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

// Create admin client with service role key for storage operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple admin authentication - FOR DEVELOPMENT ONLY
// In production, use proper authentication with hashed passwords
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "admin@apexgym.com",
  password: process.env.ADMIN_PASSWORD || "admin123",
};

// Simple session management
let activeSessions = {};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Admin login attempt:", { email });

    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString("hex");

      // Store session
      activeSessions[sessionToken] = {
        email,
        loginTime: Date.now(),
        ip:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress,
      };

      console.log("Admin login successful, session created");

      res.json({
        success: true,
        message: "Admin login successful",
        user: {
          email: email,
          name: "Administrator",
        },
        sessionToken: sessionToken,
      });
    } else {
      console.log("Admin login failed: Invalid credentials");
      res.status(401).json({
        success: false,
        error: "Invalid admin credentials",
      });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Simple session verification
const verifyAdminSession = (req, res, next) => {
  try {
    const sessionToken = req.headers["x-admin-session"];

    if (!sessionToken) {
      console.log("No session token provided");
      return res.status(401).json({
        success: false,
        error: "No admin session token provided",
      });
    }

    const session = activeSessions[sessionToken];

    if (!session) {
      console.log("Session not found for token");
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
      });
    }

    // Check if session is older than 12 hours
    const sessionAge = Date.now() - session.loginTime;
    const maxAge = 12 * 60 * 60 * 1000; // 12 hours

    if (sessionAge > maxAge) {
      delete activeSessions[sessionToken];
      return res.status(401).json({
        success: false,
        error: "Session expired",
      });
    }

    console.log("Session verified for:", session.email);
    req.adminEmail = session.email;
    next();
  } catch (error) {
    console.error("Session verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Admin logout
const adminLogout = (req, res) => {
  try {
    const sessionToken = req.headers["x-admin-session"];

    if (sessionToken) {
      delete activeSessions[sessionToken];
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Function to upload image to Supabase Storage
const uploadImageToSupabase = async (file) => {
  try {
    if (!file || !file.buffer) {
      console.error("No file or file buffer provided");
      return null;
    }

    console.log("Uploading image:", {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    // Generate unique filename
    const fileExt = file.originalname.split(".").pop() || "jpg";
    const fileName = `product-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);

      // Check if bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      console.log(
        "Available buckets:",
        buckets?.map((b) => b.name)
      );

      if (
        error.message.includes("bucket") ||
        error.message.includes("not found")
      ) {
        console.error(
          "Storage bucket 'product-images' might not exist. Please create it in Supabase Dashboard."
        );
        console.error(
          "Go to Storage -> Create bucket -> Name: product-images, Public: ON"
        );
      }

      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("product-images").getPublicUrl(filePath);

    console.log("Image uploaded successfully. URL:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
};

// Function to delete image from Supabase Storage
const deleteImageFromSupabase = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== "string") {
      return;
    }

    // Check if it's a Supabase storage URL
    if (!imageUrl.includes("storage/v1/object/public/product-images/")) {
      console.log("Not a Supabase storage URL, skipping deletion:", imageUrl);
      return;
    }

    // Extract file path from URL
    const urlParts = imageUrl.split("/");
    const productImagesIndex = urlParts.indexOf("product-images");

    if (productImagesIndex === -1) {
      return;
    }

    const filePath = urlParts.slice(productImagesIndex + 1).join("/");

    if (filePath) {
      const { error } = await supabaseAdmin.storage
        .from("product-images")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting image from storage:", error);
      } else {
        console.log("Image deleted from storage:", filePath);
      }
    }
  } catch (error) {
    console.error("Image deletion error:", error);
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get total products
    const { count: productsCount } = await supabaseAdmin
      .from("shop_items")
      .select("*", { count: "exact", head: true });

    // Get total blog posts
    const { count: blogsCount } = await supabaseAdmin
      .from("blog_posts")
      .select("*", { count: "exact", head: true });

    // Get total users
    const { count: usersCount } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get total sales from orders table
    let totalSales = 0;
    try {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("total_amount, status");

      if (orders && orders.length > 0) {
        totalSales = orders
          .filter(
            (order) => order.status === "completed" || order.status === "paid"
          )
          .reduce(
            (sum, order) => sum + (parseFloat(order.total_amount) || 0),
            0
          );
      }
    } catch (ordersError) {
      console.error("Error fetching orders:", ordersError);
      // If orders table doesn't exist, use a default value
      totalSales = 0;
    }

    res.json({
      success: true,
      data: {
        totalProducts: productsCount || 0,
        totalBlogs: blogsCount || 0,
        totalUsers: usersCount || 0,
        totalSales: totalSales,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get shop items
const getShopItems = async (req, res) => {
  try {
    console.log("Fetching shop items with query:", req.query);

    let query = supabaseAdmin.from("shop_items").select("*");

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
      console.error("Database error fetching shop items:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} shop items`);

    // Add pagination info
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedData = data ? data.slice(startIndex, endIndex) : [];

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((data?.length || 0) / limit),
        totalItems: data?.length || 0,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Get shop items error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Create shop item
const createShopItem = async (req, res) => {
  try {
    console.log("Creating shop item with body:", req.body);
    console.log(
      "File:",
      req.file ? `Present (${req.file.originalname})` : "Not present"
    );

    const { name, description, price, stock, category, status, image } =
      req.body;

    let imageUrl = image || "";

    // Handle file upload to Supabase Storage
    if (req.file) {
      imageUrl = await uploadImageToSupabase(req.file);
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          error: "Failed to upload image to storage",
        });
      }
    }

    // Validate required fields
    if (!name || !price || !stock) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, price, and stock are required",
      });
    }

    const shopItemData = {
      name: name.trim(),
      description: (description || "").trim(),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category: (category || "supplements").trim(),
      status: (status || "active").trim(),
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Inserting shop item:", shopItemData);

    const { data, error } = await supabaseAdmin
      .from("shop_items")
      .insert([shopItemData])
      .select();

    if (error) {
      console.error("Database error creating shop item:", error);
      throw error;
    }

    console.log("Shop item created successfully:", data[0]);

    res.status(201).json({
      success: true,
      data: data[0],
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Create shop item error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Update shop item
const updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating shop item ${id} with body:`, req.body);
    console.log(
      "File:",
      req.file ? `Present (${req.file.originalname})` : "Not present"
    );

    // Get existing item
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from("shop_items")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError || !existingItem) {
      console.error("Error fetching existing item:", fetchError);
      return res.status(404).json({
        success: false,
        error: "Shop item not found",
      });
    }

    let imageUrl = req.body.existingImage || existingItem.image_url || "";

    // Handle file upload
    if (req.file) {
      // Delete old image if it exists and is from our storage
      if (existingItem.image_url) {
        await deleteImageFromSupabase(existingItem.image_url);
      }
      // Upload new image
      imageUrl = await uploadImageToSupabase(req.file);
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          error: "Failed to upload new image",
        });
      }
    } else if (req.body.image && req.body.image !== existingItem.image_url) {
      // If new URL is provided and different from existing
      imageUrl = req.body.image;
    }

    const updateData = {
      name: req.body.name ? req.body.name.trim() : existingItem.name,
      description: req.body.description
        ? req.body.description.trim()
        : existingItem.description,
      price: req.body.price ? parseFloat(req.body.price) : existingItem.price,
      stock: req.body.stock ? parseInt(req.body.stock) : existingItem.stock,
      category: req.body.category
        ? req.body.category.trim()
        : existingItem.category,
      status: req.body.status ? req.body.status.trim() : existingItem.status,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    console.log("Updating with data:", updateData);

    const { data, error } = await supabaseAdmin
      .from("shop_items")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database error updating shop item:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Shop item not found after update",
      });
    }

    console.log("Shop item updated successfully:", data[0]);

    res.json({
      success: true,
      data: data[0],
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Update shop item error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Delete shop item
const deleteShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting shop item ${id}`);

    // Get item to delete image
    const { data: existingItem } = await supabaseAdmin
      .from("shop_items")
      .select("image_url")
      .eq("id", id)
      .single();

    // Delete image from storage if it exists
    if (existingItem?.image_url) {
      await deleteImageFromSupabase(existingItem.image_url);
    }

    const { error } = await supabaseAdmin
      .from("shop_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error deleting shop item:", error);
      throw error;
    }

    console.log("Shop item deleted successfully");

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete shop item error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Blog Posts CRUD
const getBlogPosts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Get blog posts error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

const createBlogPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, status, image, tags } = req.body;

    const blogData = {
      title: title.trim(),
      excerpt: (excerpt || "").trim(),
      content: content.trim(),
      category: (category || "general").trim(),
      status: (status || "draft").trim(),
      featured_image: image || "",
      tags: Array.isArray(tags)
        ? tags
        : tags
        ? tags.split(",").map((tag) => tag.trim())
        : [],
      author: "Admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .insert([blogData])
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("Create blog post error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, category, status, image, tags } = req.body;

    const updateData = {
      title: title ? title.trim() : undefined,
      excerpt: excerpt ? excerpt.trim() : undefined,
      content: content ? content.trim() : undefined,
      category: category ? category.trim() : undefined,
      status: status ? status.trim() : undefined,
      featured_image: image || undefined,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim())
        : undefined,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("Update blog post error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog post error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Debug endpoint to check sessions
const getActiveSessions = (req, res) => {
  try {
    const sessions = Object.keys(activeSessions).map((token) => ({
      token: token.substring(0, 10) + "...",
      email: activeSessions[token].email,
      age:
        Math.floor((Date.now() - activeSessions[token].loginTime) / 1000) + "s",
    }));

    res.json({
      success: true,
      activeSessions: sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  verifyAdminSession,
  getActiveSessions,
  getDashboardStats,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};
