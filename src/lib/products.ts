
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
  status: 'new' | 'old' | 'draft' | 'archived' | 'ai-generated-temp';
  imageUrl?: string;
  imagePath?: string; // Path in Firebase Storage for deletion
  features?: string[];
  dimensions?: string;
  material?: string;
  stock: number;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  dataAiHint?: string;
};

// Helper function to upload data URI to Firebase Storage
export const uploadDataUriToStorage = async (dataUri: string, path: string): Promise<{ downloadURL: string, storagePath: string }> => {
  const storageRef = ref(storage, path);
  console.log(`Attempting to upload data URI to Firebase Storage at path: ${path}. Ensure CORS is configured on gs://${storageRef.bucket}.`);
  try {
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Successfully uploaded to ${path}. Download URL: ${downloadURL}`);
    return { downloadURL, storagePath: path };
  } catch (error: any) {
    console.error(`Error uploading data URI to Firebase Storage (path: ${path}). Error type: ${error.name}, message: ${error.message}, code: ${error.code}`, error);
    let friendlyMessage = `Image upload to Firebase Storage failed. Path: ${path}.`;
    if (error.code === 'storage/unauthorized' || (error.message && error.message.toLowerCase().includes('cors'))) {
        friendlyMessage += ' This is often a CORS configuration issue on your Firebase Storage bucket. Please verify your bucket\'s CORS settings.';
    } else {
        friendlyMessage += ` Details: ${error.message || 'Unknown error'}`;
    }
    throw new Error(friendlyMessage);
  }
};

// Function to add a product to Firestore
export const addProductToFirestore = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  console.log("addProductToFirestore called with raw data:", JSON.stringify(productData, null, 2));
  try {
    let finalImageUrl = productData.imageUrl;
    let finalImagePath = productData.imagePath;
    let productStatus = productData.status;

    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      console.log("Data URI detected for imageUrl. Attempting to upload to Firebase Storage.");
      
      const isAiGenerated = productData.status === 'ai-generated-temp';
      const imageTypeFolder = isAiGenerated ? 'ai-generated' : 'manual'; // Differentiate path for AI vs manual
      const imageFileName = `${productData.slug}-${Date.now()}.${productData.imageUrl.substring(productData.imageUrl.indexOf('/') + 1, productData.imageUrl.indexOf(';base64')) || 'png'}`;
      // More robust imagePath generation
      const imagePathInStorage = productData.imagePath || `products/images/${imageTypeFolder}/${imageFileName}`;
      
      console.log(`Generated imagePathInStorage for upload: ${imagePathInStorage}`);

      const { downloadURL, storagePath } = await uploadDataUriToStorage(productData.imageUrl, imagePathInStorage);
      finalImageUrl = downloadURL;
      finalImagePath = storagePath;
      console.log(`Image uploaded. Final URL: ${finalImageUrl}, Path: ${finalImagePath}`);
      if (isAiGenerated) {
        productStatus = 'draft'; // Change status from temp to draft after successful AI image upload
      }
    } else if (productData.imageUrl && productData.imageUrl.startsWith('https://placehold.co')) {
        console.log("Placeholder image URL provided:", productData.imageUrl);
        finalImagePath = productData.imagePath || `placeholders/${productData.status}/${productData.slug}.png`; // Ensure path for placeholders
    } else if (!productData.imageUrl) {
      console.log("No imageUrl provided. Using default placeholder.");
      finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(productData.name.substring(0,15))}`;
      finalImagePath = `placeholders/default/${productData.slug}.png`;
    }


    const productToSave = {
      ...productData,
      imageUrl: finalImageUrl,
      imagePath: finalImagePath,
      status: productStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log("Attempting to save product to Firestore with payload:", JSON.stringify(productToSave, null, 2));
    const docRef = await addDoc(collection(db, 'products'), productToSave);
    console.log('Product added to Firestore with ID: ', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error in addProductToFirestore (could be during upload or Firestore save): ', error.message, error);
    throw error;
  }
};


// Function to get products from Firestore
export const getProductsFromFirestore = async (
  filters: { 
    category?: string; 
    status?: 'new' | 'old' | 'draft' | 'archived' | 'all'; 
    limit?: number;
    includeDraftArchived?: boolean;
  } = {}
): Promise<Product[]> => {
  console.log("Fetching products from Firestore with filters:", filters);
  try {
    const productsCollection = collection(db, 'products');
    const queryConstraints: QueryConstraint[] = [];

    if (filters.category && filters.category !== 'all') { // Ensure 'all' doesn't filter by category 'all'
      queryConstraints.push(where('category', '==', filters.category));
    }

    if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where('status', '==', filters.status));
    } else if (!filters.includeDraftArchived && (!filters.status || filters.status === 'all')) {
      queryConstraints.push(where('status', 'in', ['new', 'old']));
    }

    queryConstraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      queryConstraints.push(firestoreLimit(filters.limit));
    }
    
    const q = query(productsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as Product;
    });
    console.log(`Fetched ${products.length} products.`);
    return products;
  } catch (error: any) {
    console.error('Error fetching products from Firestore: ', error.message, error);
    throw error; // Re-throw for client-side handling
  }
};

// Function to get a single product by slug from Firestore
export const getProductBySlugFromFirestore = async (slug: string): Promise<Product | undefined> => {
  console.log(`Fetching product by slug: ${slug}`);
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('slug', '==', slug), firestoreLimit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No product found with slug: ${slug}`);
      return undefined;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    const product = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Product;
    console.log("Product found:", product);
    return product;
  } catch (error: any) {
    console.error(`Error fetching product by slug "${slug}": `, error.message, error);
    throw error;
  }
};

// Function to delete a product from Firestore and its image from Storage
export const deleteProductFromFirestore = async (productId: string, imagePath?: string): Promise<boolean> => {
  console.log(`Attempting to delete product ID: ${productId}, imagePath: ${imagePath}`);
  try {
    await deleteDoc(doc(db, 'products', productId));
    console.log(`Product ${productId} deleted from Firestore.`);

    if (imagePath && !imagePath.startsWith('placeholders/')) { 
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      console.log(`Image ${imagePath} deleted from Firebase Storage.`);
    } else {
      console.log(`No image path provided or image is a placeholder, skipping storage deletion for product ${productId}.`);
    }
    return true;
  } catch (error: any) {
    console.error(`Error deleting product ${productId}: `, error.message, error);
    throw error;
  }
};


// Function to get unique categories from products in Firestore
export const getCategoriesFromFirestore = async (): Promise<string[]> => {
    console.log("Fetching categories from Firestore.");
    try {
        const products = await getProductsFromFirestore({ status: 'all', includeDraftArchived: false }); 
        const categories = new Set(products.map(p => p.category));
        const categoryArray = Array.from(categories);
        console.log("Categories fetched:", categoryArray);
        return categoryArray;
    } catch (error: any) {
        console.error('Error fetching categories from Firestore: ', error.message, error);
        throw error;
    }
};


// --- Legacy Placeholder Functions ---
// These call their Firestore counterparts and log a warning.
export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  console.warn(`LEGACY CALL: getProductBySlug for "${slug}". Using getProductBySlugFromFirestore.`);
  return getProductBySlugFromFirestore(slug);
};

export const getProducts = async (filters?: { category?: string; status?: 'new' | 'old' | 'draft' | 'archived' | 'all'; limit?: number, includeDraftArchived?: boolean }): Promise<Product[]> => {
  console.warn("LEGACY CALL: getProducts. Using getProductsFromFirestore.", filters);
  return getProductsFromFirestore(filters);
};

export const getCategories = async (): Promise<string[]> => {
  console.warn("LEGACY CALL: getCategories. Using getCategoriesFromFirestore.");
  return getCategoriesFromFirestore();
};
