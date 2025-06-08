"use client";

import { useEffect, useState } from 'react';
import { getProductRecommendations, type ProductRecommendationOutput } from '@/ai/flows/product-recommendation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Zap } from 'lucide-react';
import { mockProducts, type Product } from '@/lib/products'; // Import mockProducts for fallback/display

export default function ProductRecommendations({ initialBrowsingHistory = "viewed futuristic sofa, smart bed" }: { initialBrowsingHistory?: string }) {
  const [recommendations, setRecommendations] = useState<ProductRecommendationOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for "browsing history" - simple mock for demonstration
  // In a real app, this would be derived from user activity
  const [browsingHistory, setBrowsingHistory] = useState(initialBrowsingHistory);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!browsingHistory) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const result = await getProductRecommendations({ browsingHistory });
        setRecommendations(result);
      } catch (err) {
        console.error("Error fetching product recommendations:", err);
        setError("Failed to load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [browsingHistory]);

  // Helper to parse recommendations and map to mock products
  // This is a simplified approach. A real app would need more robust parsing and product matching.
  const getRecommendedProducts = (): Product[] => {
    if (!recommendations || !recommendations.recommendedProducts) return [];
    
    const recommendedNames = recommendations.recommendedProducts
      .split(',')
      .map(name => name.trim().toLowerCase());

    return mockProducts.filter(product => 
      recommendedNames.some(recName => product.name.toLowerCase().includes(recName))
    ).slice(0, 3); // Limit to 3 recommendations for display
  };

  const displayableRecommendations = getRecommendedProducts();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  if (!recommendations || displayableRecommendations.length === 0) {
    return <p className="text-muted-foreground text-center">No specific recommendations for you at the moment. Explore our collection!</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayableRecommendations.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
            <CardHeader className="p-0">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                data-ai-hint={product.dataAiHint || 'product image'}
                width={600} 
                height={400} 
                className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300" />
            </CardHeader>
            <CardContent className="pt-4">
              <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
              <CardDescription className="text-primary font-semibold">${product.price.toFixed(2)}</CardDescription>
            </CardContent>
            <CardFooter>
              <Link href={`/products/${product.slug}`} className="w-full">
                <Button variant="outline" className="w-full group">
                  View Product <Zap className="ml-2 h-4 w-4 text-accent group-hover:animate-neon-pulse" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
