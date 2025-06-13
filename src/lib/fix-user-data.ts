import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export interface CorrectUser {
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

export const fixUserData = async () => {
  console.log('🔧 Fixing user data structure...');
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }

    const uid = currentUser.uid;
    console.log('👤 Current user UID:', uid);

    // Check current user document in Firestore
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('📄 Current user data:', userData);

      // Check if user data has old structure (id instead of uid)
      if (userData.id && !userData.uid) {
        console.log('🔄 Converting old user structure to new structure...');
        
        // Create new user data with correct structure
        const newUserData: CorrectUser = {
          uid: uid,
          email: userData.email || currentUser.email || '',
          displayName: userData.name || userData.displayName || currentUser.displayName || '',
          role: userData.isAdmin ? 'admin' : 'user',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            firstName: userData.name?.split(' ')[0] || '',
            lastName: userData.name?.split(' ').slice(1).join(' ') || '',
            phone: userData.phone || '',
          }
        };

        // Update the document with correct structure
        await setDoc(userRef, newUserData);
        console.log('✅ User data updated with correct structure');

        // Clear old localStorage cache
        const oldCacheKey = `furnishverse-user-${uid}`;
        localStorage.removeItem(oldCacheKey);
        console.log('🗑️ Cleared old cache');

        return newUserData;
      } else if (userData.uid) {
        console.log('✅ User data already has correct structure');
        return userData as CorrectUser;
      } else {
        throw new Error('User data structure is invalid');
      }
    } else {
      console.log('📝 Creating new user document...');
      
      // Create new user document
      const newUserData: CorrectUser = {
        uid: uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(userRef, newUserData);
      console.log('✅ New user document created');
      return newUserData;
    }
  } catch (error) {
    console.error('❌ Error fixing user data:', error);
    throw error;
  }
};

export const forceLogoutAndClearData = async () => {
  console.log('🚪 Force logout and clearing all data...');
  
  try {
    // Clear all localStorage
    localStorage.clear();
    console.log('🗑️ Cleared localStorage');

    // Sign out from Firebase
    await signOut(auth);
    console.log('🚪 Signed out from Firebase');

    // Reload the page to reset everything
    window.location.reload();
  } catch (error) {
    console.error('❌ Error during logout:', error);
    // Force reload anyway
    window.location.reload();
  }
};

export const diagnoseUserIssue = async () => {
  console.log('🔍 Diagnosing user data issue...');
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        issue: 'No user logged in',
        solution: 'Please log in first',
        action: 'login'
      };
    }

    const uid = currentUser.uid;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        issue: 'User document does not exist in Firestore',
        solution: 'Create user document',
        action: 'create_document'
      };
    }

    const userData = userSnap.data();
    
    if (userData.id && !userData.uid) {
      return {
        issue: 'User data has old structure (id instead of uid)',
        solution: 'Convert to new structure',
        action: 'fix_structure'
      };
    }

    if (!userData.uid) {
      return {
        issue: 'User data missing uid field',
        solution: 'Add uid field',
        action: 'add_uid'
      };
    }

    return {
      issue: 'No issues found',
      solution: 'User data is correct',
      action: 'none'
    };

  } catch (error) {
    return {
      issue: `Error accessing user data: ${error}`,
      solution: 'Check Firestore permissions',
      action: 'check_permissions'
    };
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).fixUser = {
    fixUserData,
    forceLogoutAndClearData,
    diagnoseUserIssue
  };
}
