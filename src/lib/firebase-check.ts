import { auth, db } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export const checkFirebaseConnection = async () => {
  console.log('🔥 Checking Firebase connection...');
  
  try {
    // Check if Firebase is initialized
    if (!auth || !db) {
      throw new Error('Firebase not properly initialized');
    }
    
    console.log('✅ Firebase initialized');
    
    // Check authentication
    const currentUser = auth.currentUser;
    console.log('👤 Current user:', currentUser?.email || 'Not authenticated');
    
    return {
      success: true,
      message: 'Firebase connection successful',
      user: currentUser?.email || null
    };
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      user: null
    };
  }
};

export const checkFirestorePermissions = async () => {
  console.log('🔒 Checking Firestore permissions...');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Try to write to user's document
    const testDoc = doc(db, 'test', user.uid);
    await setDoc(testDoc, {
      test: true,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Write permission successful');
    
    // Try to read the document
    const docSnap = await getDoc(testDoc);
    if (!docSnap.exists()) {
      throw new Error('Document not found after write');
    }
    
    console.log('✅ Read permission successful');
    
    // Clean up test document
    await deleteDoc(testDoc);
    console.log('✅ Delete permission successful');
    
    return {
      success: true,
      message: 'All Firestore permissions working',
      permissions: ['read', 'write', 'delete']
    };
    
  } catch (error: any) {
    console.error('❌ Firestore permission check failed:', error);
    
    let errorType = 'unknown';
    if (error.code === 'permission-denied') {
      errorType = 'permission-denied';
    } else if (error.code === 'unauthenticated') {
      errorType = 'unauthenticated';
    }
    
    return {
      success: false,
      message: error.message || 'Permission check failed',
      errorType,
      permissions: []
    };
  }
};

export const getFirebaseConfig = () => {
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
};

export const diagnoseFirebaseIssues = async () => {
  console.log('🔍 Diagnosing Firebase issues...');
  
  const results = {
    config: getFirebaseConfig(),
    connection: await checkFirebaseConnection(),
    permissions: null as any
  };
  
  // Only check permissions if connected and authenticated
  if (results.connection.success && auth.currentUser) {
    results.permissions = await checkFirestorePermissions();
  }
  
  console.log('📊 Diagnosis results:', results);
  return results;
};

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).firebaseCheck = {
    checkFirebaseConnection,
    checkFirestorePermissions,
    getFirebaseConfig,
    diagnoseFirebaseIssues
  };
}
