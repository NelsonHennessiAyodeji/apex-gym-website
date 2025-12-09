const supabase = require("../db/supabase");

// Helper function to get cart count quickly
const getCartCount = async (userId) => {
  const { count } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count || 0;
};

// Helper function to get total quantity of items in cart
const getCartTotalQuantity = async (userId) => {
  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", userId);

  if (error) return 0;

  return data.reduce((total, item) => total + item.quantity, 0);
};

// Optimized getCart function - returns minimal data
const getCart = async (req, res) => {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    // Optimized query - only get necessary fields
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        product_id,
        quantity,
        shop_items:product_id (
          name,
          price,
          image_url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get cart error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Calculate total quickly
    let total = 0;
    let totalQuantity = 0;
    const items = (cartItems || []).map((item) => {
      const itemPrice = item.shop_items?.price || 0;
      const itemTotal = item.quantity * itemPrice;
      total += itemTotal;
      totalQuantity += item.quantity;
      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        shop_items: item.shop_items,
        total: itemTotal,
      };
    });

    res.json({
      success: true,
      items: items,
      total: total,
      count: items.length,
      totalQuantity: totalQuantity,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Optimized addToCart function - FIXED VERSION
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    // Use a single transaction-like operation for better performance
    const { data: product, error: productError } = await supabase
      .from("shop_items")
      .select("id, name, price, stock, status, image_url")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    if (product.status !== "active" || product.stock < 1) {
      return res.status(400).json({
        success: false,
        error: "Product is not available",
      });
    }

    // Check if item already exists in cart - FIXED: use try-catch instead of .catch()
    let existingItem = null;
    try {
      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single();
      existingItem = data;
    } catch (error) {
      // Item not found is okay, we'll create a new one
      if (error.code !== "PGRST116") {
        // PGRST116 is the code for no rows returned
        console.error("Error checking existing item:", error);
        throw error;
      }
    }

    let result;
    let newQuantity;
    let isNewItem = false;

    if (existingItem) {
      newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: "Not enough stock available",
        });
      }

      // Update quantity of existing item
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .select()
        .single();

      if (error) throw error;
      result = data;
      isNewItem = false;
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            user_id: user.id,
            product_id: productId,
            quantity: quantity,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
      newQuantity = quantity;
      isNewItem = true;
    }

    // Return success with updated cart info
    res.json({
      success: true,
      message: isNewItem
        ? "Item added to cart"
        : "Item quantity updated in cart",
      cartItem: {
        ...result,
        product: {
          name: product.name,
          price: product.price,
          image_url: product.image_url,
        },
      },
      isNewItem: isNewItem,
      newQuantity: newQuantity,
      cartCount: await getCartCount(user.id),
      totalQuantity: await getCartTotalQuantity(user.id),
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Optimized removeFromCart function
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    // Delete the item
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) throw error;

    // Return immediate success
    res.json({
      success: true,
      message: "Item removed from cart",
      cartCount: await getCartCount(user.id),
      totalQuantity: await getCartTotalQuantity(user.id),
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;

      res.json({
        success: true,
        message: "Item removed from cart",
      });
    } else {
      // Check product stock
      const { data: product, error: productError } = await supabase
        .from("shop_items")
        .select("stock")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: "Not enough stock available",
        });
      }

      // Update quantity
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: "Cart updated",
        cartItem: data[0],
      });
    }
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const clearCart = async (req, res) => {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
