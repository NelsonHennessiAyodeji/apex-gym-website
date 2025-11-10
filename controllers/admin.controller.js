const supabase = require("../db/supabase");
const path = require("path");
const fs = require("fs");

// Simple admin authentication (TODO: in production, use proper authentication)
const ADMIN_CREDENTIALS = {
  email: "admin@apexgym.com",
  password: "admin123",
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      res.json({
        success: true,
        message: "Admin login successful",
        user: {
          email: ADMIN_CREDENTIALS.email,
          name: "Administrator",
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Invalid admin credentials",
      });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get total products
    const { count: productsCount } = await supabase
      .from("shop_items")
      .select("*", { count: "exact", head: true });

    // Get total blog posts
    const { count: blogsCount } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true });

    // Get total users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Calculate total sales (this would come from orders table in production)
    const totalSales = 1245000;

    res.json({
      totalProducts: productsCount || 0,
      totalBlogs: blogsCount || 0,
      totalUsers: usersCount || 0,
      totalSales: totalSales,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Shop Items CRUD with Pagination
const getShopItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from("shop_items")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .order("created_at", { ascending: false })
      .range(startIndex, startIndex + limit - 1);

    if (error) throw error;

    const totalPages = Math.ceil(count / limit);

    res.json({
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get shop items error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createShopItem = async (req, res) => {
  try {
    const { name, description, price, stock, category, status } = req.body;

    let imageUrl = "";

    // Handle file upload
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // Fallback to URL if provided
      imageUrl = req.body.image;
    }

    const { data, error } = await supabase
      .from("shop_items")
      .insert([
        {
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          status,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Create shop item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateShopItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, status } = req.body;

    let imageUrl = req.body.existingImage || "";

    // Handle file upload
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const { data, error } = await supabase
      .from("shop_items")
      .update({
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        status,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Shop item not found" });
    }
    res.json(data[0]);
  } catch (error) {
    console.error("Update shop item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteShopItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("shop_items").delete().eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Delete shop item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Blog Posts CRUD
const getBlogPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Get blog posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createBlogPost = async (req, res) => {
  try {
    const { title, excerpt, content, category, status, image, tags } = req.body;

    const { data, error } = await supabase
      .from("blog_posts")
      .insert([
        {
          title,
          excerpt,
          content,
          category,
          status,
          featured_image: image,
          tags: Array.isArray(tags)
            ? tags
            : tags.split(",").map((tag) => tag.trim()),
          author: "Admin",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Create blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, category, status, image, tags } = req.body;

    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title,
        excerpt,
        content,
        category,
        status,
        featured_image: image,
        tags: Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim()),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    res.json(data[0]);
  } catch (error) {
    console.error("Update blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Delete blog post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  adminLogin,
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
