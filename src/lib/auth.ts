import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Create user profile in Firestore
export const createUserProfile = async (
  firebaseUser: FirebaseUser,
  additionalData: Partial<User> = {}
): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || '',
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...additionalData
    };

    await setDoc(userRef, userData);
    console.log('✅ User profile created:', userData);
    return userData;
  } else {
    const existingUser = userSnap.data() as User;
    console.log('✅ User profile exists:', existingUser);
    return existingUser;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string, 
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User profile updated');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<User> => {
  try {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }

    const user = await createUserProfile(firebaseUser, { displayName });
    console.log('✅ User signed up successfully');
    return user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    throw new Error(error.message);
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    const user = await getUserProfile(firebaseUser.uid);
    
    if (!user) {
      // Create profile if it doesn't exist
      return await createUserProfile(firebaseUser);
    }
    
    console.log('✅ User signed in successfully');
    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message);
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message);
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getUserProfile(firebaseUser.uid);
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Check if user is admin
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

// Make user admin (only for development/setup)
export const makeUserAdmin = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, { role: 'admin' });
    console.log('✅ User made admin');
  } catch (error) {
    console.error('Error making user admin:', error);
    throw error;
  }
};
