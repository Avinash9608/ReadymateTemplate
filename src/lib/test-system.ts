// Complete system test functions
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { addToCart, getUserCart } from "./cart";
import { createOrder } from "./orders";

export const createTestUsers = async () => {
  console.log("🧪 Creating test users...");

  try {
    // Check if users already exist by trying to sign in first
    try {
      await signInWithEmailAndPassword(auth, "testuser@demo.com", "test123");
      console.log("ℹ️ Test user already exists");

      await signInWithEmailAndPassword(auth, "testadmin@demo.com", "admin123");
      console.log("ℹ️ Test admin already exists");

      return { userUid: "existing", adminUid: "existing" };
    } catch (signInError) {
      // Users don't exist, create them
      console.log("Creating new test users...");
    }

    // Create regular user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "testuser@demo.com",
      "test123"
    );
    const userUid = userCredential.user.uid;

    await setDoc(doc(db, "users", userUid), {
      uid: userUid,
      email: "testuser@demo.com",
      displayName: "Test User",
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        firstName: "Test",
        lastName: "User",
        phone: "+1234567890",
        address: {
          street: "123 Test Street",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "United States",
        },
      },
    });

    console.log("✅ Test user created: testuser@demo.com / test123");

    // Create admin user
    const adminCredential = await createUserWithEmailAndPassword(
      auth,
      "testadmin@demo.com",
      "admin123"
    );
    const adminUid = adminCredential.user.uid;

    await setDoc(doc(db, "users", adminUid), {
      uid: adminUid,
      email: "testadmin@demo.com",
      displayName: "Test Admin",
      role: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        firstName: "Test",
        lastName: "Admin",
        phone: "+1234567890",
        address: {
          street: "456 Admin Avenue",
          city: "Admin City",
          state: "Admin State",
          zipCode: "54321",
          country: "United States",
        },
      },
    });

    console.log("✅ Test admin created: testadmin@demo.com / admin123");

    return { userUid, adminUid };
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      console.log("ℹ️ Test users already exist");
      return null;
    } else {
      console.error("❌ Error creating test users:", error);
      throw error;
    }
  }
};

export const testCartFunctionality = async () => {
  console.log("🛒 Testing cart functionality...");

  try {
    // Sign in as test user
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "testuser@demo.com",
      "test123"
    );
    const userId = userCredential.user.uid;

    console.log("✅ Signed in as test user:", userId);

    // Test product data
    const testProduct = {
      id: "test-product-1",
      slug: "test-product",
      name: "Test Product",
      price: 99.99,
      imageUrl: "https://placehold.co/400x400.png?text=Test+Product",
      description: "A test product for cart functionality",
      category: "Test",
      status: "new" as const,
      stock: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test adding to cart
    console.log("🛒 Adding product to cart...");
    const cart = await addToCart(userId, testProduct, 2);
    console.log("✅ Product added to cart:", cart);

    // Test getting cart
    console.log("📦 Getting user cart...");
    const userCart = await getUserCart(userId);
    console.log("✅ User cart retrieved:", userCart);

    if (userCart && userCart.items.length > 0) {
      console.log("✅ Cart functionality working correctly!");
      return userCart;
    } else {
      throw new Error("Cart is empty after adding item");
    }
  } catch (error) {
    console.error("❌ Cart test failed:", error);
    throw error;
  }
};

export const testOrderFunctionality = async () => {
  console.log("📦 Testing order functionality...");

  try {
    // Get user cart first
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "testuser@demo.com",
      "test123"
    );
    const userId = userCredential.user.uid;
    const userEmail = userCredential.user.email || "testuser@demo.com";

    const cart = await getUserCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("No items in cart to create order");
    }

    // Test shipping address
    const shippingAddress = {
      firstName: "Test",
      lastName: "User",
      email: userEmail,
      phone: "+1234567890",
      street: "123 Test Street",
      city: "Test City",
      state: "Test State",
      zipCode: "12345",
      country: "United States",
    };

    // Create order
    console.log("📝 Creating order...");
    const order = await createOrder(
      userId,
      userEmail,
      cart.items,
      shippingAddress,
      "card"
    );

    console.log("✅ Order created successfully:", order.orderNumber);
    return order;
  } catch (error) {
    console.error("❌ Order test failed:", error);
    throw error;
  }
};

export const runCompleteSystemTest = async () => {
  console.log("🚀 Starting complete system test...");

  try {
    // Step 1: Create test users
    console.log("📝 Step 1: Setting up test users...");
    await createTestUsers();

    // Wait a moment for Firebase to sync
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Test cart functionality
    const cart = await testCartFunctionality();

    // Step 3: Test order functionality
    const order = await testOrderFunctionality();

    console.log("🎉 Complete system test passed!");
    console.log("📊 Test Results:");
    console.log("- Users created: ✅");
    console.log("- Cart functionality: ✅");
    console.log("- Order creation: ✅");
    console.log(`- Order number: ${order.orderNumber}`);
    console.log(`- Cart items: ${cart.totalItems}`);
    console.log(`- Order total: $${order.totalAmount.toFixed(2)}`);

    return {
      success: true,
      cart,
      order,
      message: "All tests passed successfully!",
    };
  } catch (error) {
    console.error("❌ System test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "System test failed",
    };
  }
};

// Instructions for manual testing
export const getTestInstructions = () => {
  return `
🧪 COMPLETE SYSTEM TEST INSTRUCTIONS:

1. 📝 AUTOMATIC SETUP:
   - Run: runCompleteSystemTest() in browser console
   - This creates test users and tests all functionality

2. 🔐 MANUAL LOGIN TEST:
   - Go to: http://localhost:9002/auth/login
   - Test User: testuser@demo.com / test123
   - Test Admin: testadmin@demo.com / admin123

3. 🛒 SHOPPING FLOW TEST:
   - Login as test user
   - Go to: http://localhost:9002/products
   - Click on any product
   - Click "Add to Cart"
   - Go to: http://localhost:9002/cart
   - Verify cart shows items
   - Go to: http://localhost:9002/checkout
   - Fill shipping details and place order

4. 🛠️ ADMIN FLOW TEST:
   - Login as test admin
   - Go to: http://localhost:9002/profile/orders
   - Verify you see all orders
   - Update order status
   - Update payment status
   - Verify changes are saved

5. 📧 EMAIL TEST:
   - Check console for email logs
   - Order confirmation emails should be logged
   - Status update emails should be logged

6. 🔄 REAL-TIME TEST:
   - Open two browser windows
   - Window 1: User viewing their orders
   - Window 2: Admin managing orders
   - Admin changes order status
   - Verify user sees updates immediately

✅ SUCCESS CRITERIA:
- Users can register/login
- Cart persists across sessions
- Orders are created successfully
- Admin can manage all orders
- Real-time updates work
- Email notifications are sent
- Data is stored in Firebase

🎯 Your system is working if all these tests pass!
  `;
};

// Export test credentials for easy access
export const TEST_CREDENTIALS = {
  user: {
    email: "testuser@demo.com",
    password: "test123",
    role: "user",
  },
  admin: {
    email: "testadmin@demo.com",
    password: "admin123",
    role: "admin",
  },
};

// Make functions available globally for browser console testing
if (typeof window !== "undefined") {
  (window as any).testSystem = {
    createTestUsers,
    testCartFunctionality,
    testOrderFunctionality,
    runCompleteSystemTest,
    getTestInstructions,
    TEST_CREDENTIALS,
  };
}
