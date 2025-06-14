// // src/lib/firebase.ts
// import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
// import { getFirestore, type Firestore } from "firebase/firestore";
// import { getStorage, type FirebaseStorage } from "firebase/storage";

// // Your web app's Firebase configuration using environment variables
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional, for Analytics
// };

// // Initialize Firebase
// let app: FirebaseApp;
// let db: Firestore;
// let storage: FirebaseStorage;

// if (getApps().length === 0) {
//   if (!firebaseConfig.projectId) {
//     console.error(
//       "Firebase projectId is not defined. Check your environment variables."
//     );
//     // Potentially throw an error or handle this case as needed
//     // For now, we'll let initializeApp handle it, which might throw an error too
//   }
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApps()[0];
// }

// db = getFirestore(app);
// storage = getStorage(app);

// export { app, db, storage };
// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingVars);
}

let app: FirebaseApp;
let db: any;
let auth: any;
let storage: any;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized with project:', firebaseConfig.projectId);

  // Use standard Firestore initialization to avoid connection issues
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  console.log('Firebase services initialized successfully');

} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { auth, db, storage };