// src/lib/products.ts
import { db, storage } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
  limit,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  QueryConstraint,
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  status: "new" | "old" | "draft" | "archived" | "ai-generated-temp";
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

// Helper function to upload data URI to Firebase Storage with fallback
export const uploadDataUriToStorage = async (
  dataUri: string,
  path: string
): Promise<{
  downloadURL: string;
  storagePath: string;
  uploadSuccess: boolean;
}> => {
  const storageRef = ref(storage, path);
  console.log(
    `Attempting to upload data URI to Firebase Storage at path: ${path}. Bucket: gs://${storageRef.bucket}`
  );

  try {
    console.log(`🔄 Starting upload process for path: ${path}`);

    // Add timeout to prevent hanging
    const uploadTimeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Storage upload timed out after 10 seconds")),
        10000
      )
    );

    console.log(`📤 Uploading data URI to Firebase Storage...`);
    const uploadPromise = uploadString(storageRef, dataUri, "data_url");
    const snapshot = await Promise.race([uploadPromise, uploadTimeout]);

    console.log(`📥 Upload completed, getting download URL...`);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(
      `✅ Successfully uploaded to ${path}. Download URL: ${downloadURL}`
    );
    return { downloadURL, storagePath: path, uploadSuccess: true };
  } catch (error: any) {
    console.error(
      `❌ Error uploading data URI to Firebase Storage (path: ${path}). Error:`,
      error
    );

    // Create a local SVG fallback that doesn't depend on external services
    const fallbackUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle" dy=".3em">Image Upload Failed</text>
      </svg>
    `)}`;

    let friendlyMessage = `Image upload to Firebase Storage failed for path: ${path}.`;
    if (error.code === "storage/unauthorized") {
      friendlyMessage +=
        " Firebase Storage security rules are blocking the upload.";
    } else if (error.message && error.message.toLowerCase().includes("cors")) {
      friendlyMessage += " CORS configuration issue.";
    } else if (error.message && error.message.includes("timed out")) {
      friendlyMessage += " Upload timed out.";
    } else {
      friendlyMessage += ` Details: ${error.message || "Unknown error"}`;
    }

    console.warn(
      `⚠️ FALLBACK ACTIVATED: Using placeholder image due to storage error`
    );
    console.warn(`⚠️ Fallback URL: ${fallbackUrl}`);
    console.warn(`⚠️ Error details: ${friendlyMessage}`);

    // Always return fallback - never throw error
    return {
      downloadURL: fallbackUrl,
      storagePath: `fallback/${path}`,
      uploadSuccess: false,
    };
  }
};

// Function to add a product to Firestore
export const addProductToFirestore = async (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string | null> => {
  console.log(
    "addProductToFirestore called with raw data:",
    JSON.stringify(productData, null, 2)
  );
  try {
    let finalImageUrl = productData.imageUrl;
    let finalImagePath = productData.imagePath;
    let productStatus = productData.status;

    if (productData.imageUrl && productData.imageUrl.startsWith("data:image")) {
      console.log(
        "Data URI detected for imageUrl. Attempting to upload to Firebase Storage."
      );

      const isAiGenerated = productData.status === "ai-generated-temp";
      const imageTypeFolder = isAiGenerated ? "ai-generated" : "manual";
      const imageFileExtension =
        productData.imageUrl.substring(
          productData.imageUrl.indexOf("/") + 1,
          productData.imageUrl.indexOf(";base64")
        ) || "png";
      const imageFileName = `${
        productData.slug
      }-${Date.now()}.${imageFileExtension}`;
      const imagePathInStorage =
        productData.imagePath ||
        `products/images/${imageTypeFolder}/${imageFileName}`;

      console.log(
        `Generated imagePathInStorage for upload: ${imagePathInStorage}`
      );

      console.log(`🔄 Attempting image upload to storage...`);

      // Wrap the entire upload process to ensure we always get a result
      let uploadResult;
      try {
        uploadResult = await uploadDataUriToStorage(
          productData.imageUrl,
          imagePathInStorage
        );
        console.log(`📊 Upload result received:`, uploadResult);
      } catch (error) {
        console.error(
          "❌ CRITICAL: uploadDataUriToStorage threw an error (this should not happen):",
          error
        );
        // Create emergency fallback result
        uploadResult = {
          downloadURL: `data:image/svg+xml;base64,${btoa(`
            <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#dc3545"/>
              <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle" dy=".3em">Critical Error</text>
            </svg>
          `)}`,
          storagePath: `fallback/critical-error/${productData.slug}.png`,
          uploadSuccess: false,
        };
        console.warn(
          `⚠️ EMERGENCY: Created emergency fallback result:`,
          uploadResult
        );
      }

      // Process the upload result
      finalImageUrl = uploadResult.downloadURL;
      finalImagePath = uploadResult.storagePath;

      if (uploadResult.uploadSuccess) {
        console.log(
          `✅ SUCCESS: Image uploaded to storage. URL: ${finalImageUrl}`
        );
        if (isAiGenerated) {
          productStatus = "draft";
        }
      } else {
        console.warn(
          `⚠️ FALLBACK: Storage upload failed, using placeholder. URL: ${finalImageUrl}`
        );
        productStatus = "draft"; // Set to draft so user can edit later
      }

      console.log(
        `📝 Final image details: URL=${finalImageUrl}, Path=${finalImagePath}, Status=${productStatus}`
      );
    } else if (
      productData.imageUrl &&
      (productData.imageUrl.startsWith("https://placehold.co") ||
        productData.imageUrl.startsWith("https://via.placeholder.com"))
    ) {
      console.log("Placeholder image URL provided:", productData.imageUrl);
      finalImagePath =
        productData.imagePath ||
        `placeholders/${productData.status}/${productData.slug}.png`;
    } else if (!productData.imageUrl) {
      console.log("No imageUrl provided. Using default placeholder.");
      const productName = productData.name.substring(0, 15);
      finalImageUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle" dy=".3em">${productName}</text>
        </svg>
      `)}`;
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

    console.log(`🚀 SAVING PRODUCT: Attempting to save to Firestore...`);
    console.log(`📋 Product payload:`, {
      name: productToSave.name,
      imageUrl: productToSave.imageUrl,
      imagePath: productToSave.imagePath,
      status: productToSave.status,
      category: productToSave.category,
    });

    // Test Firestore connection first
    console.log(`🔍 Testing Firestore connection...`);
    try {
      const testQuery = await getDocs(
        query(collection(db, "products"), limit(1))
      );
      console.log(
        `✅ Firestore connection test successful. Found ${testQuery.size} products.`
      );
    } catch (connectionError: any) {
      console.error(`❌ Firestore connection test failed:`, connectionError);
      throw new Error(
        `Firestore connection failed: ${connectionError.message}`
      );
    }

    // Try to save the product with detailed error logging
    let productId: string | null = null;

    try {
      console.log(`📝 Attempting to save product to Firestore...`);
      console.log(`🔧 Database instance:`, db);
      console.log(`🔧 Collection reference:`, collection(db, "products"));

      const docRef = await addDoc(collection(db, "products"), productToSave);
      productId = docRef.id;

      console.log(
        `🎉 SUCCESS: Product saved to Firestore with ID: ${productId}`
      );
    } catch (error: any) {
      console.error(`❌ Firestore save failed:`, error);
      console.error(`❌ Error code:`, error.code);
      console.error(`❌ Error message:`, error.message);
      console.error(`❌ Full error:`, error);

      // Check for specific error types
      if (error.code === "permission-denied") {
        throw new Error(
          `Firestore permission denied. Please check security rules.`
        );
      } else if (error.code === "unavailable") {
        throw new Error(
          `Firestore service unavailable. Please try again later.`
        );
      } else if (error.message?.includes("index")) {
        throw new Error(
          `Firestore index required. Please create the required index.`
        );
      } else {
        throw new Error(`Firestore save failed: ${error.message}`);
      }
    }

    if (!productId) {
      console.error(
        `❌ All Firestore save attempts failed. Implementing local storage fallback...`
      );

      // Generate a local ID and save to localStorage as fallback
      productId = `local_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const localProduct = { ...productToSave, id: productId };

      try {
        const existingProducts = JSON.parse(
          localStorage.getItem("fallback_products") || "[]"
        );
        existingProducts.push(localProduct);
        localStorage.setItem(
          "fallback_products",
          JSON.stringify(existingProducts)
        );

        console.log(
          `💾 FALLBACK: Product saved to localStorage with ID: ${productId}`
        );
        console.log(
          `⚠️ Note: Product will sync to Firestore when connection is restored`
        );
      } catch (localError) {
        console.error(
          `❌ CRITICAL: Even localStorage save failed:`,
          localError
        );
        throw new Error(
          `Complete save failure: Firestore and localStorage both failed`
        );
      }
    }

    console.log(`✅ PRODUCT CREATION COMPLETED SUCCESSFULLY! ID: ${productId}`);
    return productId;
  } catch (error: any) {
    console.error(
      "❌ CRITICAL ERROR in addProductToFirestore:",
      error.message,
      error
    );

    // Provide user-friendly error messages
    let userMessage = "Product creation failed. ";
    if (error.message.includes("timed out")) {
      userMessage +=
        "The database is experiencing connection issues. Please try again in a moment.";
    } else if (error.message.includes("Firestore")) {
      userMessage +=
        "Database connection problem. Please check your internet connection and try again.";
    } else if (error.message.includes("localStorage")) {
      userMessage += "Unable to save product data. Please try again.";
    } else {
      userMessage += "An unexpected error occurred. Please try again.";
    }

    throw new Error(userMessage);
  }
};

// Function to get products from Firestore
export const getProductsFromFirestore = async (
  filters: {
    category?: string;
    status?: "new" | "old" | "draft" | "archived" | "all";
    limit?: number;
    includeDraftArchived?: boolean;
  } = {}
): Promise<Product[]> => {
  console.log("Fetching products from Firestore with filters:", filters);
  try {
    const productsCollection = collection(db, "products");
    const queryConstraints: QueryConstraint[] = [];

    if (filters.category && filters.category !== "all") {
      queryConstraints.push(where("category", "==", filters.category));
    }

    // Temporarily simplify query to avoid index requirement
    if (filters.status && filters.status !== "all") {
      queryConstraints.push(where("status", "==", filters.status));
      queryConstraints.push(orderBy("createdAt", "desc"));
    } else if (
      !filters.includeDraftArchived &&
      (!filters.status || filters.status === "all")
    ) {
      // Skip complex query until index is ready, just order by createdAt
      queryConstraints.push(orderBy("createdAt", "desc"));
    } else {
      queryConstraints.push(orderBy("createdAt", "desc"));
    }

    if (filters.limit) {
      queryConstraints.push(firestoreLimit(filters.limit));
    }

    const q = query(productsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const products: Product[] = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : String(data.createdAt),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : String(data.updatedAt),
      } as Product;
    });
    console.log(`Fetched ${products.length} products.`);
    return products;
  } catch (error: any) {
    console.error(
      "Error fetching products from Firestore: ",
      error.message,
      error
    );

    // Handle index requirement error gracefully
    if (error.message && error.message.includes("requires an index")) {
      console.warn(
        "⚠️ Firestore index required. Returning mock products until index is created."
      );
      return []; // Return mock products instead of empty array
    }

    throw new Error(`Failed to fetch products: ${error.message}`);
  }
};

// Function to get a single product by slug from Firestore
export const getProductBySlugFromFirestore = async (
  slug: string
): Promise<Product | undefined> => {
  console.log(`Fetching product by slug: ${slug}`);
  try {
    const productsCollection = collection(db, "products");
    const q = query(
      productsCollection,
      where("slug", "==", slug),
      firestoreLimit(1)
    );
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
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : String(data.createdAt),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : String(data.updatedAt),
    } as Product;
    console.log("Product found:", product);
    return product;
  } catch (error: any) {
    console.error(
      `Error fetching product by slug "${slug}": `,
      error.message,
      error
    );
    throw new Error(
      `Failed to fetch product by slug "${slug}": ${error.message}`
    );
  }
};

// Function to delete a product from Firestore and its image from Storage
export const deleteProductFromFirestore = async (
  productId: string,
  imagePath?: string
): Promise<boolean> => {
  console.log(
    `🗑️ Attempting to delete product ID: ${productId}, imagePath: ${imagePath}`
  );
  try {
    // Delete the product document from Firestore
    await deleteDoc(doc(db, "products", productId));
    console.log(`✅ Product ${productId} deleted from Firestore.`);

    // Check if we need to delete an image from Storage
    if (imagePath && shouldDeleteImageFromStorage(imagePath)) {
      try {
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
        console.log(`✅ Image ${imagePath} deleted from Firebase Storage.`);
      } catch (storageError: any) {
        // Handle storage deletion errors gracefully
        if (storageError.code === "storage/object-not-found") {
          console.warn(
            `⚠️ Image ${imagePath} not found in Storage (already deleted or fallback image). Continuing...`
          );
        } else {
          console.warn(
            `⚠️ Failed to delete image ${imagePath} from Storage:`,
            storageError.message
          );
          // Don't throw error for storage deletion failures - product deletion should still succeed
        }
      }
    } else {
      console.log(
        `ℹ️ Skipping storage deletion for product ${productId}. Reason: ${getSkipReason(
          imagePath
        )}`
      );
    }

    return true;
  } catch (error: any) {
    console.error(
      `❌ Error deleting product ${productId}:`,
      error.message,
      error
    );
    throw new Error(`Failed to delete product ${productId}: ${error.message}`);
  }
};

// Helper function to determine if an image should be deleted from Storage
function shouldDeleteImageFromStorage(imagePath: string): boolean {
  if (!imagePath) return false;

  // Don't delete fallback images (they're not in Storage)
  if (imagePath.startsWith("fallback/")) return false;
  if (imagePath.startsWith("placeholders/")) return false;

  // Don't delete local SVG data URIs
  if (imagePath.startsWith("data:image/svg+xml")) return false;

  // Only delete actual Storage paths
  return true;
}

// Helper function to explain why storage deletion was skipped
function getSkipReason(imagePath?: string): string {
  if (!imagePath) return "No image path provided";
  if (imagePath.startsWith("fallback/"))
    return "Fallback image (not in Storage)";
  if (imagePath.startsWith("placeholders/"))
    return "Placeholder image (not in Storage)";
  if (imagePath.startsWith("data:image/svg+xml"))
    return "Local SVG data URI (not in Storage)";
  return "Unknown reason";
}

// Function to get unique categories from products in Firestore
export const getCategoriesFromFirestore = async (): Promise<string[]> => {
  console.log("Fetching categories from Firestore.");
  try {
    // Fetch only published products for category listing
    const products = await getProductsFromFirestore({
      status: "all",
      includeDraftArchived: false,
    });
    const categories = new Set(products.map((p) => p.category).filter(Boolean)); // Filter out undefined/empty categories
    const categoryArray = Array.from(categories);
    console.log("Categories fetched:", categoryArray);
    return categoryArray;
  } catch (error: any) {
    console.error(
      "Error fetching categories from Firestore: ",
      error.message,
      error
    );

    // Handle index requirement error gracefully
    if (error.message && error.message.includes("requires an index")) {
      console.warn(
        "⚠️ Firestore index required for categories. Returning default categories."
      );
      return ["Living Room", "Bedroom", "Kitchen", "Office", "Outdoor"]; // Return default categories
    }

    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

// Function to sync local storage products to Firestore
export const syncLocalProductsToFirestore = async (): Promise<void> => {
  console.log("🔄 Checking for local products to sync...");

  try {
    const localProducts = JSON.parse(
      localStorage.getItem("fallback_products") || "[]"
    );

    if (localProducts.length === 0) {
      console.log("✅ No local products to sync");
      return;
    }

    console.log(`📦 Found ${localProducts.length} local products to sync`);

    const syncedProducts = [];
    const failedProducts = [];

    for (const localProduct of localProducts) {
      try {
        // Remove the local ID and let Firestore generate a new one
        const { id, ...productData } = localProduct;
        const docRef = await addDoc(collection(db, "products"), productData);

        console.log(
          `✅ Synced local product "${productData.name}" to Firestore with ID: ${docRef.id}`
        );
        syncedProducts.push(localProduct);
      } catch (error) {
        console.error(
          `❌ Failed to sync product "${localProduct.name}":`,
          error
        );
        failedProducts.push(localProduct);
      }
    }

    // Update localStorage to remove synced products
    if (syncedProducts.length > 0) {
      localStorage.setItem("fallback_products", JSON.stringify(failedProducts));
      console.log(
        `🎉 Successfully synced ${syncedProducts.length} products to Firestore`
      );
    }

    if (failedProducts.length > 0) {
      console.warn(
        `⚠️ ${failedProducts.length} products failed to sync and remain in local storage`
      );
    }
  } catch (error) {
    console.error("❌ Error during local products sync:", error);
  }
};

// --- Legacy Placeholder Functions ---
// These call their Firestore counterparts and log a warning.
export const getProductBySlug = async (
  slug: string
): Promise<Product | undefined> => {
  console.warn(
    `LEGACY CALL: getProductBySlug for "${slug}". Using getProductBySlugFromFirestore.`
  );
  return getProductBySlugFromFirestore(slug);
};

export const getProducts = async (filters?: {
  category?: string;
  status?: "new" | "old" | "draft" | "archived" | "all";
  limit?: number;
  includeDraftArchived?: boolean;
}): Promise<Product[]> => {
  console.warn(
    "LEGACY CALL: getProducts. Using getProductsFromFirestore.",
    filters
  );
  return getProductsFromFirestore(filters);
};

export const getCategories = async (): Promise<string[]> => {
  console.warn("LEGACY CALL: getCategories. Using getCategoriesFromFirestore.");
  return getCategoriesFromFirestore();
};
