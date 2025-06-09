
export type Product = {
  id: string; // Will be Firestore document ID
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string; // Could be a reference to a categories collection later
  status: 'new' | 'old' | 'draft' | 'archived';
  imageUrl?: string; // URL from Firebase Storage
  imagePath?: string; // Path in Firebase Storage for deletion
  features?: string[];
  dimensions?: string;
  material?: string;
  stock: number;
  createdAt: string; // ISO string or Timestamp
  updatedAt: string; // ISO string or Timestamp
  dataAiHint?: string;
};

// Mock products are removed. Data will come from a database.

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  // Placeholder: In a real app, fetch from Firestore by slug
  console.warn(`getProductBySlug: Fetching product by slug "${slug}" - database not implemented yet.`);
  // Example: if (slug === 'quantum-sofa') return MOCK_PRODUCTS[0];
  return undefined;
};

export const getProducts = async (filters?: { category?: string; status?: string; limit?: number }): Promise<Product[]> => {
  // Placeholder: In a real app, fetch from Firestore with filters
  console.warn("getProducts: Fetching products - database not implemented yet.", filters);
  return [];
};

// Example of how categories might be managed later
export const getCategories = async (): Promise<string[]> => {
  // Placeholder: Fetch from a categories collection or derive from products
  console.warn("getCategories: Fetching categories - database not implemented yet.");
  return ["Living Room", "Bedroom", "Office", "Dining", "Outdoor"]; // Placeholder
};
