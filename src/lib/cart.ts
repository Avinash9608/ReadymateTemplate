import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Product } from "./products";

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  addedAt: string | Timestamp;
  createdAt?: string | Date; // 👈 Add this line
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

// Get user's cart
export const getUserCart = async (userId: string): Promise<Cart | null> => {
  try {
    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.error("❌ Invalid userId provided to getUserCart:", userId);
      throw new Error("Invalid user ID provided");
    }

    console.log("🔍 Getting cart for user:", userId);
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const cartData = cartSnap.data() as Cart;

      // Ensure items array exists
      const items = cartData.items || [];

      return {
        ...cartData,
        items: items.map((item) => ({
          ...item,
          addedAt:
            item.addedAt instanceof Timestamp
              ? item.addedAt.toDate().toISOString()
              : item.addedAt,
        })),
        createdAt:
          cartData.createdAt instanceof Timestamp
            ? cartData.createdAt.toDate().toISOString()
            : cartData.createdAt,
        updatedAt:
          cartData.updatedAt instanceof Timestamp
            ? cartData.updatedAt.toDate().toISOString()
            : cartData.updatedAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting user cart:", error);
    return null;
  }
};

// Create empty cart for user
export const createUserCart = async (userId: string): Promise<Cart> => {
  try {
    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.error("❌ Invalid userId provided to createUserCart:", userId);
      throw new Error("Invalid user ID provided");
    }

    console.log("🆕 Creating cart for user:", userId);
    const now = new Date().toISOString();
    const cart = {
      id: userId,
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const cartRef = doc(db, "carts", userId);
    await setDoc(cartRef, cart);

    console.log("✅ Cart created for user:", userId);

    // Return cart with string timestamps for consistency
    return {
      id: userId,
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error creating cart:", error);
    throw error;
  }
};

// Calculate cart totals
const calculateCartTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0
  );
  return { totalItems, totalAmount };
};

// Add item to cart
export const addToCart = async (
  userId: string,
  product: Product,
  quantity: number = 1
): Promise<Cart> => {
  try {
    // Validate inputs
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.error("❌ Invalid userId provided to addToCart:", userId);
      throw new Error("Invalid user ID provided");
    }

    if (!product || !product.id || !product.name) {
      console.error("❌ Invalid product provided to addToCart:", product);
      throw new Error("Invalid product provided");
    }

    console.log("🛒 Adding to cart:", {
      userId,
      productId: product.id,
      productName: product.name,
      quantity,
    });

    let cart = await getUserCart(userId);
    console.log("📦 Current cart:", cart);

    if (!cart) {
      console.log("🆕 Creating new cart for user:", userId);
      cart = await createUserCart(userId);
    }

    // Ensure cart.items is an array
    if (!cart.items || !Array.isArray(cart.items)) {
      console.log("⚠️ Cart items is not an array, initializing as empty array");
      cart.items = [];
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === product.id
    );
    console.log("🔍 Existing item index:", existingItemIndex);

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += quantity;
      console.log(
        "📈 Updated existing item quantity:",
        cart.items[existingItemIndex].quantity
      );
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        productSlug: product.slug || "",
        productName: product.name,
        productPrice: product.price,
        productImage: product.imageUrl || "",
        quantity,
        addedAt: new Date().toISOString(),
      };
      cart.items.push(newItem);
      console.log("➕ Added new item to cart:", newItem);
    }

    // Recalculate totals
    const { totalItems, totalAmount } = calculateCartTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    cart.updatedAt = new Date().toISOString();

    console.log("💰 Cart totals:", { totalItems, totalAmount });

    // Update cart in Firestore
    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: cart.items,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Item added to cart successfully:", product.name);
    return cart;
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    throw error;
  }
};

// Update item quantity in cart
export const updateCartItemQuantity = async (
  userId: string,
  itemId: string,
  quantity: number
): Promise<Cart> => {
  try {
    const cart = await getUserCart(userId);
    if (!cart) throw new Error("Cart not found");

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return await removeFromCart(userId, itemId);
    }

    // Update item quantity
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity = quantity;

      // Recalculate totals
      const { totalItems, totalAmount } = calculateCartTotals(cart.items);
      cart.totalItems = totalItems;
      cart.totalAmount = totalAmount;
      cart.updatedAt = new Date().toISOString();

      // Update cart in Firestore
      const cartRef = doc(db, "carts", userId);
      await updateDoc(cartRef, {
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Cart item quantity updated");
    }

    return cart;
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (
  userId: string,
  itemId: string
): Promise<Cart> => {
  try {
    const cart = await getUserCart(userId);
    if (!cart) throw new Error("Cart not found");

    // Remove item from cart
    cart.items = cart.items.filter((item) => item.id !== itemId);

    // Recalculate totals
    const { totalItems, totalAmount } = calculateCartTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    cart.updatedAt = new Date().toISOString();

    // Update cart in Firestore
    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: cart.items,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Item removed from cart");
    return cart;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

// Clear entire cart
export const clearCart = async (userId: string): Promise<void> => {
  try {
    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: [],
      totalItems: 0,
      totalAmount: 0,
      updatedAt: serverTimestamp(),
    });

    console.log("✅ Cart cleared");
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

// Get cart item count for a user
export const getCartItemCount = async (userId: string): Promise<number> => {
  try {
    const cart = await getUserCart(userId);
    return cart?.totalItems || 0;
  } catch (error) {
    console.error("Error getting cart item count:", error);
    return 0;
  }
};
