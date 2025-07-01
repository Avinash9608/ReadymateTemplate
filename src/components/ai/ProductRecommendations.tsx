"use client";

import { useEffect, useState } from 'react';
import { getProductRecommendations, type ProductRecommendationOutput } from '@/ai/flows/product-recommendation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import type { Product } from '@/lib/products';

export default function ProductRecommendations({ initialBrowsingHistory = "viewed futuristic sofa, smart bed" }: { initialBrowsingHistory?: string }) {
  const [aiRecommendedProductNames, setAiRecommendedProductNames] = useState<string[]>([]);
  const [displayableRecommendations, setDisplayableRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [browsingHistory, setBrowsingHistory] = useState(initialBrowsingHistory);

  useEffect(() => {
    async function fetchAndProcessRecommendations() {
      if (!browsingHistory) {
        setLoading(false);
        setError("No browsing history provided for recommendations.");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        const aiResult = await getProductRecommendations({ browsingHistory });
        const recommendedNames = aiResult.recommendedProducts
          .split(',')
          .map(name => name.trim().toLowerCase())
          .filter(name => name.length > 0);
        setAiRecommendedProductNames(recommendedNames);

        if (recommendedNames.length > 0) {
          // Fetch only 'new' (published and visible) products from the API
          const response = await fetch('/api/products?status=new');
          const allProducts: Product[] = await response.json();
          const matchedProducts = allProducts.filter(product => 
            recommendedNames.some(recName => product.name.toLowerCase().includes(recName))
          ).slice(0, 3); 
          setDisplayableRecommendations(matchedProducts);
        } else {
          setDisplayableRecommendations([]);
        }

      } catch (err: any) {
        console.error("Error fetching/processing product recommendations:", err);
        setError(err.message || "Failed to load recommendations. Please try again later.");
        setDisplayableRecommendations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAndProcessRecommendations();
  }, [browsingHistory]);


  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-8">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (displayableRecommendations.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No specific recommendations for you at the moment. Explore our collection!</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayableRecommendations.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
            <CardHeader className="p-0">
              <Image 
                src={product.imageUrl || `https://placehold.co/600x400.png?text=No+Image`}
                alt={product.name} 
                data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
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
