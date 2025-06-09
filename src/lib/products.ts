
// src/lib/products.ts
import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  status: 'new' | 'old' | 'draft' | 'archived' | 'ai-generated-temp'; // Added ai-generated-temp
  imageUrl?: string;
  imagePath?: string; // Path in Firebase Storage for deletion
  features?: string[];
  dimensions?: string;
  material?: string;
  stock: number;
  createdAt: string | Timestamp; // Store as ISO string or Firestore Timestamp
  updatedAt: string | Timestamp; // Store as ISO string or Firestore Timestamp
  dataAiHint?: string;
};

// Helper function to upload data URI to Firebase Storage
export const uploadDataUriToStorage = async (dataUri: string, path: string): Promise<{ downloadURL: string, storagePath: string }> => {
  // IMPORTANT: For client-side uploads like this to work,
  // your Firebase Storage bucket MUST have CORS configured
  // to allow requests from your web app's origin.
  // Example Origins: your Cloud Workstation URL, http://localhost:9002, your production domain.
  // Methods: GET, POST, PUT, OPTIONS
  // Headers: Content-Type, Authorization, X-Goog-Resumable (and others as needed)
  const storageRef = ref(storage, path);
  console.log(`Attempting to upload data URI to Firebase Storage at path: ${path}. Ensure CORS is configured on gs://${storageRef.bucket}.`);
  try {
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Successfully uploaded to ${path}. Download URL: ${downloadURL}`);
    return { downloadURL, storagePath: path };
  } catch (error: any) {
    console.error(`Error uploading data URI to Firebase Storage (path: ${path}). Error type: ${error.name}, message: ${error.message}, code: ${error.code}`, error);
    // For CORS errors, error.code might be 'storage/unauthorized' or 'storage/object-not-found' (if preflight failed badly)
    // or just a generic network error.
    let friendlyMessage = `Image upload to Firebase Storage failed. Path: ${path}.`;
    if (error.code === 'storage/unauthorized' || (error.message && error.message.toLowerCase().includes('cors'))) {
        friendlyMessage += ' This is often a CORS configuration issue on your Firebase Storage bucket. Please verify your bucket\'s CORS settings.';
    } else {
        friendlyMessage += ` Details: ${error.message || 'Unknown error'}`;
    }
    throw new Error(friendlyMessage); // Re-throw a more informative error
  }
};

// Function to add a product to Firestore
export const addProductToFirestore = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  console.log("addProductToFirestore called with raw data:", productData);
  try {
    let finalImageUrl = productData.imageUrl;
    let finalImagePath = productData.imagePath;
    let productStatus = productData.status;

    // If imageUrl is a data URI, upload it to Firebase Storage
    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      console.log("Data URI detected for imageUrl. Attempting to upload to Firebase Storage.");
      
      const isAiGenerated = productData.status === 'ai-generated-temp';
      const imageTypeFolder = isAiGenerated ? 'ai-generated' : 'manual';
      const imageFileName = `${productData.slug}-${Date.now()}.png`; // Use .png for AI images by default
      const imagePathInStorage = productData.imagePath || `products/images/${imageTypeFolder}/${imageFileName}`;
      
      console.log(`Generated imagePathInStorage for upload: ${imagePathInStorage}`);

      const { downloadURL, storagePath } = await uploadDataUriToStorage(productData.imageUrl, imagePathInStorage);
      finalImageUrl = downloadURL;
      finalImagePath = storagePath;
      console.log(`Image uploaded. Final URL: ${finalImageUrl}, Path: ${finalImagePath}`);
      // If it was an AI temp status, set it to draft after successful upload
      if (isAiGenerated) {
        productStatus = 'draft';
      }
    } else if (productData.imageUrl && productData.imageUrl.startsWith('https://placehold.co')) {
        console.log("Placeholder image URL provided:", productData.imageUrl);
        finalImagePath = productData.imagePath || `placeholders/${productData.status}/${productData.slug}.png`;
    } else if (!productData.imageUrl) {
      console.log("No imageUrl provided. Using default placeholder.");
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(productData.name.substring(0,15))}`;
      finalImagePath = `placeholders/default/${productData.slug}.png`;
    }


    const productToSave = {
      ...productData,
      imageUrl: finalImageUrl,
      imagePath: finalImagePath,
      status: productStatus, // Use the potentially updated status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log("Attempting to save product to Firestore:", productToSave);
    const docRef = await addDoc(collection(db, 'products'), productToSave);
    console.log('Product added to Firestore with ID: ', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error in addProductToFirestore (could be during upload or Firestore save): ', error.message, error);
    throw error; // Re-throw the error to be handled by the calling page
  }
};


// Function to get products from Firestore
export const getProductsFromFirestore = async (
  filters: { 
    category?: string; 
    status?: 'new' | 'old' | 'draft' | 'archived' | 'all'; 
    limit?: number;
    includeDraftArchived?: boolean; // New flag for admin view
  } = {}
): Promise<Product[]> => {
  try {
    const productsCollection = collection(db, 'products');
    const queryConstraints: QueryConstraint[] = [];

    if (filters.category) {
      queryConstraints.push(where('category', '==', filters.category));
    }

    if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where('status', '==', filters.status));
    } else if (!filters.includeDraftArchived && (!filters.status || filters.status === 'all')) {
      // Default public view: only 'new' or 'old' products
      queryConstraints.push(where('status', 'in', ['new', 'old']));
    }
    // For 'all' with includeDraftArchived=true, no status filter is added, fetching all.


    queryConstraints.push(orderBy('createdAt', 'desc')); // Default sort by newest

    if (filters.limit) {
      queryConstraints.push(firestoreLimit(filters.limit));
    }
    
    const q = query(productsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for client-side consistency
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Product;
    });
    return products;
  } catch (error) {
    console.error('Error fetching products from Firestore: ', error);
    return [];
  }
};

// Function to get a single product by slug from Firestore
export const getProductBySlugFromFirestore = async (slug: string): Promise<Product | undefined> => {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('slug', '==', slug), firestoreLimit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No product found with slug: ${slug}`);
      return undefined;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Product;
  } catch (error) {
    console.error(`Error fetching product by slug "${slug}": `, error);
    return undefined;
  }
};

// Function to delete a product from Firestore and its image from Storage
export const deleteProductFromFirestore = async (productId: string, imagePath?: string): Promise<boolean> => {
  try {
    // Delete Firestore document
    await deleteDoc(doc(db, 'products', productId));
    console.log(`Product ${productId} deleted from Firestore.`);

    // Delete image from Firebase Storage if imagePath is provided and not a placeholder
    if (imagePath && !imagePath.startsWith('placeholders/')) { 
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      console.log(`Image ${imagePath} deleted from Firebase Storage.`);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting product ${productId}: `, error);
    return false;
  }
};


// Function to get unique categories from products in Firestore
export const getCategoriesFromFirestore = async (): Promise<string[]> => {
    try {
        // Fetch only products that are 'new' or 'old' (publicly visible) to derive categories for frontend display
        const products = await getProductsFromFirestore({ status: 'all', includeDraftArchived: false }); 
        const categories = new Set(products.map(p => p.category));
        return Array.from(categories);
    } catch (error) {
        console.error('Error fetching categories from Firestore: ', error);
        return ["Living Room", "Bedroom", "Office", "Dining", "Outdoor"]; // Fallback
    }
};


// --- Old Placeholder Functions (Kept for reference, can be removed if not needed) ---
// These should be considered deprecated if the Firestore versions are fully implemented and used.
export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  console.warn(`Legacy getProductBySlug: Fetching product by slug "${slug}" - should use getProductBySlugFromFirestore. This function will now call the Firestore version.`);
  return getProductBySlugFromFirestore(slug);
};

export const getProducts = async (filters?: { category?: string; status?: 'new' | 'old' | 'draft' | 'archived' | 'all'; limit?: number, includeDraftArchived?: boolean }): Promise<Product[]> => {
  console.warn("Legacy getProducts: Fetching products - should use getProductsFromFirestore. This function will now call the Firestore version.", filters);
  return getProductsFromFirestore(filters);
};

export const getCategories = async (): Promise<string[]> => {
  console.warn("Legacy getCategories: Fetching categories - should use getCategoriesFromFirestore. This function will now call the Firestore version.");
  return getCategoriesFromFirestore();
};
