const supabase = require("../db/supabase");

const getCart = async (req, res) => {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get cart items with product details
    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        shop_items:product_id (
          id,
          name,
          price,
          image_url,
          stock,
          status
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get cart error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Calculate total
    let total = 0;
    const items = cartItems.map((item) => {
      const itemTotal = item.quantity * item.shop_items.price;
      total += itemTotal;
      return {
        ...item,
        total: itemTotal,
      };
    });

    res.json({
      items,
      total,
      count: cartItems.length,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if product exists and is available
    const { data: product, error: productError } = await supabase
      .from("shop_items")
      .select("id, name, price, stock, status")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.status !== "active" || product.stock < 1) {
      return res.status(400).json({ error: "Product is not available" });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found"
      throw checkError;
    }

    let result;
    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: "Not enough stock available" });
      }

      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Add new item to cart
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            user_id: user.id,
            product_id: productId,
            quantity: quantity,
          },
        ])
        .select();

      if (error) throw error;
      result = data[0];
    }

    // Get updated cart count
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    res.json({
      message: "Item added to cart",
      cartItem: result,
      cartCount: count,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;

      res.json({ message: "Item removed from cart" });
    } else {
      // Check product stock
      const { data: product, error: productError } = await supabase
        .from("shop_items")
        .select("stock")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      if (quantity > product.stock) {
        return res.status(400).json({ error: "Not enough stock available" });
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
        message: "Cart updated",
        cartItem: data[0],
      });
    }
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) throw error;

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const clearCart = async (req, res) => {
  try {
    // Get the access token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Get user from the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
