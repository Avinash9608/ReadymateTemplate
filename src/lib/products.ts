// src/lib/products.ts
import mongoose, { Schema, model, models } from 'mongoose';
import dbConnect from './firebase';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  status: 'new' | 'old' | 'draft' | 'archived' | 'ai-generated-temp';
  imageUrl?: string;
  imagePath?: string;
  features?: string[];
  dimensions?: string;
  material?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
  dataAiHint?: string;
};

const ProductSchema = new Schema<Product>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['new', 'old', 'draft', 'archived', 'ai-generated-temp'], required: true },
  imageUrl: String,
  imagePath: String,
  features: [String],
  dimensions: String,
  material: String,
  stock: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  dataAiHint: String,
});

const ProductModel = models.Product || model<Product>('Product', ProductSchema);

export const addProduct = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl' | 'imagePath'> & { imageUrl?: string; imagePath?: string }
): Promise<string | null> => {
  await dbConnect();
  const now = new Date();
  const doc = await ProductModel.create({
    ...productData,
    createdAt: now,
    updatedAt: now,
  });
  return doc._id.toString();
};

export const getProducts = async (filters: {
  category?: string;
  status?: 'new' | 'old' | 'draft' | 'archived' | 'all';
  limit?: number;
  includeDraftArchived?: boolean;
} = {}): Promise<Product[]> => {
  await dbConnect();
  const query: any = {};
  if (filters.category && filters.category !== 'all') query.category = filters.category;
  if (filters.status && filters.status !== 'all') query.status = filters.status;
  if (!filters.includeDraftArchived) query.status = { $nin: ['draft', 'archived'] };
  let cursor = ProductModel.find(query).sort({ createdAt: -1 });
  if (filters.limit) cursor = cursor.limit(filters.limit);
  const docs = await cursor.lean();
  return docs.map((doc: any) => ({ ...doc, id: doc._id.toString() }));
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  await dbConnect();
  const doc: any = await ProductModel.findOne({ slug }).lean();
  if (!doc) return undefined;
  return { ...doc, id: doc._id.toString() };
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  await dbConnect();
  const res = await ProductModel.deleteOne({ _id: productId });
  return res.deletedCount === 1;
};

export const getCategories = async (): Promise<string[]> => {
  await dbConnect();
  const categories = await ProductModel.distinct('category');
  return categories;
};
