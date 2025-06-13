
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import { ArrowRight, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { getProductsFromFirestore, getCategoriesFromFirestore, type Product } from '@/lib/products';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { Badge } from '@/components/ui/badge';

interface CategoryType {
  name: string;
  slug: string;
  imageUrl: string;
  dataAiHint?: string;
  productCount: number;
  representativeProduct?: Product;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all products to get better featured products and category data
        const [allProducts, fetchedCategoryNames] = await Promise.all([
          getProductsFromFirestore({ status: 'all', includeDraftArchived: true }),
          getCategoriesFromFirestore()
        ]);

        // Get featured products (prioritize 'new' status, then any available)
        const newProducts = allProducts.filter(p => p.status === 'new');
        const featuredProductsList = newProducts.length >= 3
          ? newProducts.slice(0, 3)
          : allProducts.slice(0, 3);
        setFeaturedProducts(featuredProductsList);

        // Create category objects with product counts and representative images
        const categoryObjects: CategoryType[] = await Promise.all(
          fetchedCategoryNames.map(async (name) => {
            const categoryProducts = allProducts.filter(p => p.category === name);
            const representativeProduct = categoryProducts[0]; // Get first product as representative

            return {
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              imageUrl: representativeProduct?.imageUrl || `data:image/svg+xml;base64,${btoa(`
                <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#f8f9fa"/>
                  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#6c757d" text-anchor="middle" dy=".3em">${name}</text>
                </svg>
              `)}`,
              dataAiHint: name.toLowerCase(),
              productCount: categoryProducts.length,
              representativeProduct: representativeProduct
            };
          })
        );
        setCategories(categoryObjects);

      } catch (err: any) {
        console.error("Failed to load homepage data:", err);
        setError(err.message || "Failed to load data. Please try again later.");
        setFeaturedProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        <AlertTriangle className="mx-auto h-16 w-16 mb-4" />
        <p className="text-xl font-semibold">Error Loading Page</p>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
        </div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="md:pr-12">
              <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-glow-primary">
                Welcome to FurnishVerse
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                Discover furniture that blends cutting-edge design with futuristic technology. Elevate your space.
              </p>
              <Link href="/products">
                <Button size="lg" className="group">
                  Explore Collection <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="relative h-64 md:h-auto md:min-h-[400px]">
              <Image
                src="https://www.ironplane.com/hubfs/phillip-goldsberry-fZuleEfeA1Q-unsplash.jpg"
                alt="Futuristic Living Room"
                data-ai-hint="futuristic interior"
                layout="fill"
                objectFit="cover"
                className="rounded-lg shadow-2xl transform md:rotate-3 transition-transform duration-500 hover:rotate-0"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">Featured Products</h2>
        {featuredProducts.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 group bg-card dark:bg-card border border-border dark:border-border" style={{ width: '320px', height: '400px' }}>
                <div className="relative w-full h-full flex flex-col">
                  <div className="relative w-full h-64 overflow-hidden">
                    <ImageWithFallback
                      src={product.imageUrl || `data:image/svg+xml;base64,${btoa(`
                        <svg width="320" height="256" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#f8f9fa"/>
                          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dy=".3em">No Image</text>
                        </svg>
                      `)}`}
                      alt={product.name}
                      width={320}
                      height={256}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between p-4 bg-card dark:bg-card">
                    <div className="text-center">
                      <CardTitle className="font-headline text-lg mb-2 text-foreground dark:text-foreground leading-tight">
                        {product.name}
                      </CardTitle>
                      <div className="text-primary dark:text-primary font-bold text-xl mb-3">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>

                    <Link href={`/products/${product.slug}`} className="w-full">
                      <Button
                        size="default"
                        className="w-full group bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No featured products available at the moment. Check back soon!</p>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">Shop by Category</h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.name}`}>
                <Card className="relative overflow-hidden group cursor-pointer hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 h-full bg-card dark:bg-card border border-border dark:border-border">
                  <CardHeader className="p-0">
                    <div className="relative aspect-video">
                      <ImageWithFallback
                        src={category.imageUrl}
                        alt={category.name}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/60 transition-all duration-300" />
                      <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                        <div className="text-white text-center">
                          <h3 className="text-3xl font-headline font-bold text-white mb-4 drop-shadow-lg">
                            {category.name}
                          </h3>
                          {category.representativeProduct && (
                            <div className="space-y-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-xl font-bold text-white drop-shadow-md">
                                {category.representativeProduct.name}
                              </p>
                              <p className="text-lg font-semibold text-white/95 drop-shadow-md">
                                ${category.representativeProduct.price.toFixed(2)}
                              </p>
                            </div>
                          )}
                          <Badge variant="secondary" className="bg-white/25 text-white border-white/40 mt-4 backdrop-blur-sm">
                            {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
           <p className="text-muted-foreground text-center">No categories available at the moment.</p>
        )}
      </section>
      
      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">Just For You</h2>
        <ProductRecommendations />
      </section>
    </div>
  );
}
