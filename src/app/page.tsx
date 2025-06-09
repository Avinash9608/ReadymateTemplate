
"use client"; 

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import { ArrowRight, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { getProductsFromFirestore, getCategoriesFromFirestore, type Product } from '@/lib/products'; 

interface CategoryType {
  name: string;
  slug: string;
  imageUrl: string;
  dataAiHint?: string;
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
        const [fetchedProducts, fetchedCategoryNames] = await Promise.all([
          getProductsFromFirestore({ limit: 3, status: 'new' }),
          getCategoriesFromFirestore()
        ]);
        setFeaturedProducts(fetchedProducts);
        
        const categoryObjects: CategoryType[] = fetchedCategoryNames.map(name => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          imageUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(name)}`,
          dataAiHint: name.toLowerCase()
        }));
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader className="p-0">
                  <Image 
                    src={product.imageUrl || `https://placehold.co/600x400.png?text=No+Image`} 
                    alt={product.name} 
                    data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
                    width={600} 
                    height={400} 
                    className="object-cover w-full h-64 group-hover:scale-105 transition-transform duration-300" 
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  <CardTitle className="font-headline text-xl mb-1">{product.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold text-lg">${product.price.toFixed(2)}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Link href={`/products/${product.slug}`} className="w-full">
                    <Button variant="outline" className="w-full group">
                      View Details <Zap className="ml-2 h-4 w-4 text-accent group-hover:animate-neon-pulse" />
                    </Button>
                  </Link>
                </CardFooter>
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
              <Link key={category.slug} href={`/products?category=${category.slug}`}>
                <div className="relative rounded-lg overflow-hidden group aspect-video cursor-pointer">
                  <Image 
                    src={category.imageUrl} 
                    alt={category.name} 
                    data-ai-hint={category.dataAiHint || category.name.toLowerCase()}
                    layout="fill" 
                    objectFit="cover" 
                    className="group-hover:scale-110 transition-transform duration-500 ease-in-out" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <h3 className="text-2xl font-headline font-bold text-white text-glow-accent">{category.name}</h3>
                  </div>
                </div>
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
