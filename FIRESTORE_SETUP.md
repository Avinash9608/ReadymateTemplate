# 🔧 Firebase Firestore Setup Guide

## ❌ Current Issue: "Missing or insufficient permissions"

This error occurs because Firestore security rules are blocking database operations. Follow these steps to fix it:

## 🔥 **STEP 1: Update Firestore Security Rules**

### **Option A: Simple Rules (Recommended for Testing)**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `furnish-view`
3. Navigate to **Firestore Database** → **Rules**
4. Replace existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**

### **Option B: Production Rules (More Secure)**

For production use, use these more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all user documents
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users can read/write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all carts
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users can read/write their own orders, admins can read/write all orders
    match /orders/{orderId} {
      // Users can read their own orders
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid ||
         (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'));
      
      // Users can create their own orders
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      
      // Only admins can update orders
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products collection (read-only for all authenticated users)
    match /products/{productId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🔥 **STEP 2: Enable Authentication**

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

## 🔥 **STEP 3: Test the System**

After updating the rules:

1. Go to: http://localhost:9002/test
2. Click **"Run Complete System Test"**
3. The test should now pass ✅

## 🔥 **STEP 4: Manual Testing**

### **Create Test Users:**
1. Go to: http://localhost:9002/auth/login
2. Click "Create Account"
3. Create these users:
   - **User**: `testuser@demo.com` / `test123`
   - **Admin**: `testadmin@demo.com` / `admin123`

### **Test Shopping Flow:**
1. Login as user
2. Go to products page
3. Add items to cart
4. Checkout and place order
5. View orders

### **Test Admin Flow:**
1. Login as admin
2. Go to orders page
3. Manage all orders
4. Update order status

## ✅ **Success Indicators:**

- ✅ Users can register/login
- ✅ Cart items persist
- ✅ Orders are created
- ✅ Admin can see all orders
- ✅ Status updates work
- ✅ No permission errors

## 🚨 **Troubleshooting:**

### **Still getting permission errors?**
1. Check that Authentication is enabled
2. Verify rules are published
3. Clear browser cache
4. Check browser console for detailed errors

### **Users can't see their data?**
1. Verify user is authenticated
2. Check user document exists in Firestore
3. Verify user.uid matches document ID

### **Admin can't see all orders?**
1. Check admin user has `role: 'admin'` in Firestore
2. Verify admin rules are correct
3. Check admin is properly authenticated

## 📞 **Need Help?**

If you're still having issues:
1. Check browser console for detailed error messages
2. Verify Firebase project configuration
3. Ensure all environment variables are set correctly
4. Try the simple rules first, then upgrade to production rules

## 🎯 **Quick Fix:**

**For immediate testing, use the simple rules (Option A) which allow all authenticated users to read/write all documents. This will get your system working quickly for testing purposes.**
