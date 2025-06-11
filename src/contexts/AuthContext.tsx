
// "use client";

// import type { ReactNode } from 'react';
// import { createContext, useContext, useState, useEffect } from 'react';

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   isAdmin?: boolean; 
// }

// interface AuthState {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, pass: string) => Promise<User | null>; // Changed return type
//   logout: () => void;
//   register: (email: string, pass: string, name?:string) => Promise<boolean>;
// }

// const AuthContext = createContext<AuthState | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Try to load user from localStorage on initial mount
//     const storedUser = localStorage.getItem('furnishverse-user');
//     if (storedUser) {
//       try {
//         setUser(JSON.parse(storedUser));
//       } catch (e) {
//         localStorage.removeItem('furnishverse-user');
//       }
//     }
//     setIsLoading(false);
//   }, []);

//   const login = async (email: string, pass: string): Promise<User | null> => {
//     setIsLoading(true);
//     // Mock login: For this demo, login always "succeeds" by returning a user object.
//     // A real implementation would validate 'pass' and might return null on failure.
//     // The isAdmin flag is set based on the email content.
//     const mockUser: User = { 
//       id: '1', 
//       email, 
//       name: email.includes('admin') ? 'Admin User' : 'Mock User', 
//       isAdmin: email.includes('admin') 
//     };
//     setUser(mockUser); // Set user in context
//     localStorage.setItem('furnishverse-user', JSON.stringify(mockUser));
//     setIsLoading(false);
//     return mockUser; // Return the user object
//   };

//   const register = async (email: string, _pass: string, name?: string): Promise<boolean> => {
//     setIsLoading(true);
//     // Mock register
//     const mockUser: User = { id: Date.now().toString(), email, name: name || 'New User', isAdmin: email.includes('admin') };
//     setUser(mockUser); // This auto-logs in the user upon registration in the mock
//     localStorage.setItem('furnishverse-user', JSON.stringify(mockUser));
//     setIsLoading(false);
//     return true;
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('furnishverse-user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };



// "use client";

// import { createContext, useContext, useState, useEffect } from 'react';
// import type { ReactNode } from 'react';
// import { auth, db, storage } from '@/lib/firebase';
// import { 
//   createUserWithEmailAndPassword, 
//   signInWithEmailAndPassword,
//   signOut,
//   User as FirebaseUser
// } from 'firebase/auth';
// import { doc, setDoc, getDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   isAdmin?: boolean;
//   profileImage?: string;
// }

// interface AuthState {
//   user: User | null;
//   isLoading: boolean;
//   error: string | null;
//   login: (email: string, password: string) => Promise<User | null>;
//   logout: () => Promise<void>;
//   register: (
//     email: string,
//     password: string,
//     name?: string,
//     file?: File
//   ) => Promise<{ success: boolean; error?: string }>;
// }

// const AuthContext = createContext<AuthState | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
//       if (firebaseUser) {
//         const uid = firebaseUser.uid;
//         try {
//           const docSnap = await getDoc(doc(db, 'users', uid));
//           if (docSnap.exists()) {
//             const userData = docSnap.data() as User;
//             setUser(userData);
//             localStorage.setItem('furnishverse-user', JSON.stringify(userData));
//           }
//         } catch (err) {
//           console.error('Failed to fetch user data:', err);
//           setError('Failed to load user data');
//         }
//       } else {
//         setUser(null);
//         localStorage.removeItem('furnishverse-user');
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const register = async (
//     email: string,
//     password: string,
//     name?: string,
//     file?: File
//   ): Promise<{ success: boolean; error?: string }> => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const cred = await createUserWithEmailAndPassword(auth, email, password);
//       const uid = cred.user.uid;

//       let imageUrl = '';
//       if (file) {
//         try {
//           const fileRef = ref(storage, `users/${uid}/profile.jpg`);
//           await uploadBytes(fileRef, file);
//           imageUrl = await getDownloadURL(fileRef);
//         } catch (storageError) {
//           console.error('Profile image upload failed:', storageError);
//           // Continue without image if upload fails
//         }
//       }

//       const userData: User = {
//         id: uid,
//         email,
//         name: name || 'New User',
//         isAdmin: email.includes('admin'),
//         profileImage: imageUrl
//       };

//       await setDoc(doc(db, 'users', uid), userData);

//       setUser(userData);
//       localStorage.setItem('furnishverse-user', JSON.stringify(userData));
//       setIsLoading(false);
//       return { success: true };
//     } catch (err: any) {
//       setIsLoading(false);
      
//       let errorMessage = 'Registration failed. Please try again.';
//       switch (err.code) {
//         case 'auth/operation-not-allowed':
//           errorMessage = 'Email/password authentication is not enabled.';
//           break;
//         case 'auth/email-already-in-use':
//           errorMessage = 'Email is already in use.';
//           break;
//         case 'auth/invalid-email':
//           errorMessage = 'Invalid email address.';
//           break;
//         case 'auth/weak-password':
//           errorMessage = 'Password should be at least 6 characters.';
//           break;
//       }

//       setError(errorMessage);
//       console.error('Register error:', err);
//       return { success: false, error: errorMessage };
//     }
//   };

//   const login = async (email: string, password: string): Promise<User | null> => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const cred = await signInWithEmailAndPassword(auth, email, password);
//       const uid = cred.user.uid;
//       const docSnap = await getDoc(doc(db, 'users', uid));
      
//       if (!docSnap.exists()) {
//         throw new Error('User data not found');
//       }

//       const userData = docSnap.data() as User;
//       setUser(userData);
//       localStorage.setItem('furnishverse-user', JSON.stringify(userData));
//       setIsLoading(false);
//       return userData;
//     } catch (err: any) {
//       setIsLoading(false);
      
//       let errorMessage = 'Login failed. Please try again.';
//       switch (err.code) {
//         case 'auth/user-not-found':
//         case 'auth/wrong-password':
//           errorMessage = 'Invalid email or password.';
//           break;
//         case 'auth/too-many-requests':
//           errorMessage = 'Too many attempts. Try again later.';
//           break;
//         case 'auth/user-disabled':
//           errorMessage = 'Account disabled.';
//           break;
//       }

//       setError(errorMessage);
//       console.error('Login error:', err);
//       return null;
//     }
//   };

//   const logout = async () => {
//     setIsLoading(true);
//     try {
//       await signOut(auth);
//       setUser(null);
//       localStorage.removeItem('furnishverse-user');
//     } catch (err) {
//       console.error('Logout error:', err);
//       setError('Failed to logout');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, isLoading, error, login, logout, register }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider');
//   return ctx;
// };




// "use client";

// import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import type { ReactNode } from 'react';
// import { auth, db, storage } from '@/lib/firebase';
// import { 
//   createUserWithEmailAndPassword, 
//   signInWithEmailAndPassword,
//   signOut,
//   User as FirebaseUser,
//   updateProfile,
//   onAuthStateChanged
// } from 'firebase/auth';
// import { doc, setDoc, getDoc, enableIndexedDbPersistence, FirestoreError } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL, StorageError  } from 'firebase/storage';

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   isAdmin?: boolean;
//   profileImage?: string;
//   createdAt?: string;
// }

// interface AuthState {
//   user: User | null;
//   isLoading: boolean;
//   error: string | null;
//   isOnline: boolean;
//   login: (email: string, password: string) => Promise<User | null>;
//   logout: () => Promise<void>;
//   register: (
//     email: string,
//     password: string,
//     name?: string,
//     file?: File
//   ) => Promise<{ success: boolean; error?: string }>;
// }

// const AuthContext = createContext<AuthState | undefined>(undefined);

// // Type guard for Firebase Auth errors
// function isAuthError(error: unknown): error is { code: string; message?: string } {
//   return typeof error === 'object' && error !== null && 'code' in error;
// }

// // Type guard for Firestore errors
// function isFirestoreError(error: unknown): error is FirestoreError {
//   return error instanceof Error && 'code' in error;
// }

// // Type guard for Storage errors
// function isStorageError(error: unknown): error is StorageError {
//   return error instanceof Error && 'code' in error;
// }

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
//   const [isPersisting, setIsPersisting] = useState(true);
//   // Enable Firestore offline persistence
//   useEffect(() => {
//     const initializePersistence = async () => {
//       try {
//         await enableIndexedDbPersistence(db, { forceOwnership: true });
//         console.log('Firestore offline persistence enabled');
//       } catch (err) {
//         if (isFirestoreError(err)) {
//           if (err.code === 'failed-precondition') {
//             console.log('Persistence already enabled in another tab');
//           } else if (err.code === 'unimplemented') {
//             console.log('Current browser doesn\'t support persistence');
//           }
//         }
//       }finally{
//         setIsPersisting(false);
//       }
//     };

//     const handleOnline = () => setIsOnline(true);
//     const handleOffline = () => setIsOnline(false);

//     initializePersistence();
    
//     window.addEventListener('online', handleOnline);
//     window.addEventListener('offline', handleOffline);

//     return () => {
//       window.removeEventListener('online', handleOnline);
//       window.removeEventListener('offline', handleOffline);
//     };
//   }, []);

//   // Get user data with proper error handling
//   const getUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
//     const uid = firebaseUser.uid;
//     const cachedUser = localStorage.getItem(`furnishverse-user-${uid}`);

//     // Return cached data if offline
//     if (!isOnline && cachedUser) {
//       return JSON.parse(cachedUser);
//     }

//     try {
//       const docSnap = await getDoc(doc(db, 'users', uid));
      
//       if (docSnap.exists()) {
//         const userData = docSnap.data() as User;
//         localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(userData));
//         return userData;
//       }

//       // Create new user document if it doesn't exist
//       const newUserData: User = {
//         id: uid,
//         email: firebaseUser.email || '',
//         name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
//         isAdmin: false,
//         createdAt: new Date().toISOString()
//       };
      
//       await setDoc(doc(db, 'users', uid), newUserData);
//       localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(newUserData));
//       return newUserData;
//     } catch (error) {
//       if (isFirestoreError(error) && (error.code === 'unavailable' || error.code === 'failed-precondition')) {
//         if (cachedUser) {
//           return JSON.parse(cachedUser);
//         }
//         return {
//           id: uid,
//           email: firebaseUser.email || '',
//           name: firebaseUser.displayName || 'User',
//           isAdmin: false,
//           createdAt: new Date().toISOString()
//         };
//       }
//       throw error;
//     }
//   }, [isOnline]);

//   // Auth state listener
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         try {
//           const userData = await getUserData(firebaseUser);
//           setUser(userData);
//           setError(null);
//         } catch (error) {
//           if (isFirestoreError(error) && (error.code === 'unavailable' || error.code === 'failed-precondition')) {
//             // Silent handling for offline errors
//           } else {
//             console.error('Auth state change error:', error);
//             setError('Failed to load user data');
//           }
//         }
//       } else {
//         setUser(null);
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, [getUserData]);

//   const register = async (
//     email: string,
//     password: string,
//     name?: string,
//     file?: File
//   ): Promise<{ success: boolean; error?: string }> => {
//     if (!isOnline) {
//       return { success: false, error: 'Registration requires internet connection' };
//     }

//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const cred = await createUserWithEmailAndPassword(auth, email, password);
//       const uid = cred.user.uid;

//       if (name) {
//         await updateProfile(cred.user, { displayName: name });
//       }

//       let imageUrl = '';
//       if (file) {
//         try {
//           const fileRef = ref(storage, `users/${uid}/profile.jpg`);
//           await uploadBytes(fileRef, file);
//           imageUrl = await getDownloadURL(fileRef);
//         } catch (error) {
//           if (isStorageError(error)) {
//             console.error('Profile image upload failed:', error);
//           }
//         }
//       }

//       const userData: User = {
//         id: uid,
//         email,
//         name: name || email.split('@')[0] || 'New User',
//         isAdmin: email.includes('admin'),
//         profileImage: imageUrl,
//         createdAt: new Date().toISOString()
//       };

//       await setDoc(doc(db, 'users', uid), userData);
//       localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(userData));
//       setUser(userData);
      
//       return { success: true };
//     } catch (error) {
//       let errorMessage = 'Registration failed. Please try again.';
//       if (isAuthError(error)) {
//         switch (error.code) {
//           case 'auth/email-already-in-use':
//             errorMessage = 'Email is already in use.';
//             break;
//           case 'auth/invalid-email':
//             errorMessage = 'Invalid email address.';
//             break;
//           case 'auth/weak-password':
//             errorMessage = 'Password should be at least 6 characters.';
//             break;
//         }
//       }
//       setError(errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const login = async (email: string, password: string): Promise<User | null> => {
//     setIsLoading(true);
//     setError(null);
    
//     try {
//       const cred = await signInWithEmailAndPassword(auth, email, password);
//       const userData = await getUserData(cred.user);
//       setUser(userData);
//       return userData;
//     } catch (error) {
//       let errorMessage = 'Login failed. Please try again.';
//       if (isAuthError(error)) {
//         switch (error.code) {
//           case 'auth/user-not-found':
//           case 'auth/wrong-password':
//           case 'auth/invalid-credential':
//             errorMessage = 'Invalid email or password.';
//             break;
//           case 'auth/too-many-requests':
//             errorMessage = 'Too many attempts. Try again later.';
//             break;
//           case 'auth/user-disabled':
//             errorMessage = 'Account disabled. Contact support.';
//             break;
//         }
//       } else if (!isOnline) {
//         errorMessage = 'Cannot login offline without cached credentials.';
//       }
//       setError(errorMessage);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = async () => {
//     setIsLoading(true);
//     try {
//       await signOut(auth);
//       setUser(null);
//     } catch (error) {
//       console.error('Logout error:', error);
//       setError('Failed to logout');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//   <AuthContext.Provider value={{ 
//     user, 
//     isLoading: isLoading || isPersisting, // Combine loading states
//     error, 
//     isOnline,
//     login,
//     logout,
//     register 
//   }}>
//     {children}
//   </AuthContext.Provider>
// );
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be inside AuthProvider');
//   return ctx;
// };


"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  updateProfile,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, enableIndexedDbPersistence, FirestoreError } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  profileImage?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
    file?: File
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function isAuthError(error: unknown): error is AuthError {
  return error instanceof Error && 'code' in error;
}

function isFirestoreError(error: unknown): error is FirestoreError {
  return error instanceof Error && 'code' in error;
}

function isStorageError(error: unknown): error is StorageError {
  return error instanceof Error && 'code' in error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const initializePersistence = async () => {
      try {
        await enableIndexedDbPersistence(db, { forceOwnership: true });
      } catch (err) {
        if (isFirestoreError(err)) {
          console.log('Persistence initialization:', err.code);
        }
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    initializePersistence();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    const uid = firebaseUser.uid;
    const cachedUser = localStorage.getItem(`furnishverse-user-${uid}`);

    if (!isOnline && cachedUser) {
      return JSON.parse(cachedUser);
    }

    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(userData));
        return userData;
      }

      const newUserData: User = {
        id: uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', uid), newUserData);
      localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(newUserData));
      return newUserData;
    } catch (error) {
      if (isFirestoreError(error) && (error.code === 'unavailable' || error.code === 'failed-precondition')) {
        if (cachedUser) return JSON.parse(cachedUser);
        return {
          id: uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          isAdmin: false
        };
      }
      throw error;
    }
  }, [isOnline]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser);
          setUser(userData);
          setError(null);
        } catch (error) {
          if (!isFirestoreError(error) || 
             (error.code !== 'unavailable' && error.code !== 'failed-precondition')) {
            console.error('Auth state error:', error);
            setError('Failed to load user data');
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [getUserData]);

  // const register = async (
  //   email: string,
  //   password: string,
  //   name?: string,
  //   file?: File
  // ): Promise<{ success: boolean; error?: string }> => {
  //   if (!isOnline) {
  //     return { success: false, error: 'Registration requires internet connection' };
  //   }

  //   setIsLoading(true);
  //   setError(null);
    
  //   try {
  //     const cred = await createUserWithEmailAndPassword(auth, email, password);
  //     const uid = cred.user.uid;

  //     if (name) {
  //       await updateProfile(cred.user, { displayName: name });
  //     }

  //     let imageUrl = '';
  //     if (file) {
  //       try {
  //         const fileRef = ref(storage, `users/${uid}/profile.jpg`);
  //         await uploadBytes(fileRef, file);
  //         imageUrl = await getDownloadURL(fileRef);
  //       } catch (error) {
  //         console.error('Profile image upload failed:', error);
  //       }
  //     }

  //     const userData: User = {
  //       id: uid,
  //       email,
  //       name: name || email.split('@')[0] || 'New User',
  //       isAdmin: email.includes('admin'),
  //       profileImage: imageUrl,
  //       createdAt: new Date().toISOString()
  //     };

  //     await setDoc(doc(db, 'users', uid), userData);
  //     localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(userData));
      
  //     return { success: true };
  //   } catch (error) {
  //     let errorMessage = 'Registration failed. Please try again.';
  //     if (isAuthError(error)) {
  //       switch (error.code) {
  //         case 'auth/email-already-in-use':
  //           errorMessage = 'Email is already in use.';
  //           break;
  //         case 'auth/invalid-email':
  //           errorMessage = 'Invalid email address.';
  //           break;
  //         case 'auth/weak-password':
  //           errorMessage = 'Password should be at least 6 characters.';
  //           break;
  //       }
  //     }
  //     return { success: false, error: errorMessage };
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };



// Add to your AuthContext.tsx
const [firestoreError, setFirestoreError] = useState<FirestoreError | null>(null);

// Modify your register function
const register = async (
  email: string,
  password: string,
  name?: string,
  file?: File
): Promise<{ success: boolean; error?: string; user?: User }> => {
  if (!isOnline) {
    return { success: false, error: 'Registration requires internet connection' };
  }

  setIsLoading(true);
  setError(null);
  setFirestoreError(null);
  
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    let imageUrl = '';
    if (file) {
      try {
        const fileRef = ref(storage, `users/${uid}/profile.jpg`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      } catch (error) {
        console.error('Profile image upload failed:', error);
      }
    }

    const userData: User = {
      id: uid,
      email,
      name: name || email.split('@')[0] || 'New User',
      isAdmin: false,
      profileImage: imageUrl,
      createdAt: new Date().toISOString()
    };

    // Add retry logic for Firestore writes
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: FirestoreError | null = null;

    while (attempts < maxAttempts) {
      try {
        await setDoc(doc(db, 'users', uid), userData);
        lastError = null;
        break;
      } catch (error) {
        if (isFirestoreError(error)) {
          lastError = error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }

    if (lastError) {
      setFirestoreError(lastError);
      throw lastError;
    }

    localStorage.setItem(`furnishverse-user-${uid}`, JSON.stringify(userData));
    setUser(userData);
    
    return { success: true, user: userData };
    
  } catch (error) {
    let errorMessage = 'Registration failed. Please try again.';
    
    if (isAuthError(error)) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
      }
    } else if (isFirestoreError(error)) {
      errorMessage = 'Database connection issue. Please check your internet.';
      setFirestoreError(error);
    }
    
    return { success: false, error: errorMessage };
  } finally {
    setIsLoading(false);
  }
};

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(cred.user);
      setUser(userData);
      return userData;
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (isAuthError(error)) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many attempts. Try again later.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Account disabled. Contact support.';
            break;
        }
      }
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, isOnline, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};