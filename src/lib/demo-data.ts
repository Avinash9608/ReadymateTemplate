import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const createDemoUsers = async () => {
  try {
    // Create demo regular user
    const userCredential = await createUserWithEmailAndPassword(auth, 'user@demo.com', 'demo123');
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: 'user@demo.com',
      displayName: 'Demo User',
      role: 'user',
      profile: {
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1234567890',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'Demo State',
          zipCode: '12345',
          country: 'United States'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Demo user created: user@demo.com / demo123');

    // Create demo admin user
    const adminCredential = await createUserWithEmailAndPassword(auth, 'admin@demo.com', 'admin123');
    await setDoc(doc(db, 'users', adminCredential.user.uid), {
      uid: adminCredential.user.uid,
      email: 'admin@demo.com',
      displayName: 'Demo Admin',
      role: 'admin',
      profile: {
        firstName: 'Demo',
        lastName: 'Admin',
        phone: '+1234567890',
        address: {
          street: '456 Admin Avenue',
          city: 'Admin City',
          state: 'Admin State',
          zipCode: '54321',
          country: 'United States'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Demo admin created: admin@demo.com / admin123');

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Demo users already exist');
    } else {
      console.error('Error creating demo users:', error);
    }
  }
};

// Function to test the complete flow
export const testCompleteFlow = async () => {
  console.log('🧪 Testing complete e-commerce flow...');
  
  try {
    // 1. Sign in as demo user
    const userCredential = await signInWithEmailAndPassword(auth, 'user@demo.com', 'demo123');
    console.log('✅ Signed in as demo user');

    // 2. Add items to cart (this would be done through the UI)
    console.log('ℹ️ Add items to cart through the product pages');

    // 3. Place order (this would be done through checkout)
    console.log('ℹ️ Place order through the checkout page');

    // 4. Admin can manage orders
    console.log('ℹ️ Admin can manage orders at /profile/orders');

    console.log('🎉 Test flow complete! Use the UI to test the full functionality.');

  } catch (error) {
    console.error('Error in test flow:', error);
  }
};

// Demo credentials for easy access
export const DEMO_CREDENTIALS = {
  user: {
    email: 'user@demo.com',
    password: 'demo123',
    role: 'user'
  },
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin'
  }
};

export const logDemoInstructions = () => {
  console.log(`
🎯 DEMO INSTRUCTIONS:

1. 📝 REGISTER/LOGIN:
   - Go to: http://localhost:9002/auth/login
   - Use demo credentials or create new account:
     • User: user@demo.com / demo123
     • Admin: admin@demo.com / admin123

2. 🛒 SHOPPING FLOW (as User):
   - Browse products: http://localhost:9002/products
   - Add items to cart from product pages
   - View cart: http://localhost:9002/cart
   - Checkout: http://localhost:9002/checkout
   - View orders: http://localhost:9002/profile/orders

3. 🛠️ ADMIN MANAGEMENT:
   - Login as admin: admin@demo.com / admin123
   - Manage all orders: http://localhost:9002/profile/orders
   - Update order status and payment status
   - View customer details and order history

4. 📧 EMAIL NOTIFICATIONS:
   - Order confirmations sent automatically
   - Status update emails when admin changes order status
   - Check console for email logs

5. 🔄 REAL-TIME FEATURES:
   - User-specific cart persistence
   - Real-time order status updates
   - Admin changes reflect immediately for users
   - Email notifications for all status changes

🎉 Your complete e-commerce system is ready!
  `);
};
