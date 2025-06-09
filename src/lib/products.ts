
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
  status: 'new' | 'old' | 'draft' | 'archived';
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
  const storageRef = ref(storage, path);
  const snapshot = await uploadString(storageRef, dataUri, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return { downloadURL, storagePath: path };
};

// Function to add a product to Firestore
export const addProductToFirestore = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    let finalImageUrl = productData.imageUrl;
    let finalImagePath = productData.imagePath;

    // If imageUrl is a data URI, upload it to Firebase Storage
    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      const imagePathInStorage = productData.imagePath || `products/images/${productData.slug}-${Date.now()}`;
      const { downloadURL, storagePath } = await uploadDataUriToStorage(productData.imageUrl, imagePathInStorage);
      finalImageUrl = downloadURL;
      finalImagePath = storagePath;
    } else if (!productData.imageUrl) {
      // Default placeholder if no image is provided and not AI generated
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(productData.name.substring(0,15))}`;
      finalImagePath = `placeholders/default/${productData.slug}.png`;
    }


    const productToSave = {
      ...productData,
      imageUrl: finalImageUrl,
      imagePath: finalImagePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'products'), productToSave);
    console.log('Product added to Firestore with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product to Firestore: ', error);
    return null;
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

    // Delete image from Firebase Storage if imagePath is provided
    if (imagePath && !imagePath.startsWith('placeholders/')) { // Don't delete placeholder paths
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
        const products = await getProductsFromFirestore({ status: 'all', includeDraftArchived: true }); // Fetch all to derive all categories
        const categories = new Set(products.map(p => p.category));
        return Array.from(categories);
    } catch (error) {
        console.error('Error fetching categories from Firestore: ', error);
        return ["Living Room", "Bedroom", "Office", "Dining", "Outdoor"]; // Fallback
    }
};


// --- Old Placeholder Functions (Kept for reference, can be removed if not needed) ---
export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  console.warn(`Legacy getProductBySlug: Fetching product by slug "${slug}" - should use getProductBySlugFromFirestore.`);
  return undefined;
};

export const getProducts = async (filters?: { category?: string; status?: string; limit?: number }): Promise<Product[]> => {
  console.warn("Legacy getProducts: Fetching products - should use getProductsFromFirestore.", filters);
  return [];
};

export const getCategories = async (): Promise<string[]> => {
  console.warn("Legacy getCategories: Fetching categories - should use getCategoriesFromFirestore.");
  return ["Living Room", "Bedroom", "Office", "Dining", "Outdoor"];
};
