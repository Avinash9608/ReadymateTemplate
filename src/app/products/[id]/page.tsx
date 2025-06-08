"use client";

import { useParams, useRouter } from 'next/navigation';
import { getProductBySlug, type Product as ProductType } from '@/lib/products';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import { ChevronLeft, ShoppingCartIcon, Tag, Layers, Maximize } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<ProductType | null>(null);
  const [browsingHistoryForAI, setBrowsingHistoryForAI] = useState<string>("");

  useEffect(() => {
    if (params.id) {
      const slug = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundProduct = getProductBySlug(slug);
      if (foundProduct) {
        setProduct(foundProduct);
        // Update browsing history for AI (simple example)
        // In a real app, this would be more sophisticated and stored/retrieved properly
        const history = localStorage.getItem('browsingHistory') || '';
        const newHistory = `${history}, ${foundProduct.name}`.replace(/^,|,$/, '').trim();
        localStorage.setItem('browsingHistory', newHistory);
        setBrowsingHistoryForAI(newHistory);
      } else {
        // Handle product not found, maybe redirect or show a 404 component
        // For now, redirecting to products page
        router.push('/products');
      }
    }
  }, [params.id, router]);

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading product details...</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your shopping cart.`,
      className: "bg-primary text-primary-foreground"
    });
  };

  return (
    <div className="space-y-12">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Product Image Gallery - simplified to one image */}
        <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg group">
          <Image
            src={product.imageUrl}
            alt={product.name}
            data-ai-hint={product.dataAiHint || 'product large'}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-500"
          />
           <Badge variant={product.status === 'new' ? "default" : "secondary"} className="absolute top-4 left-4 capitalize neon-glow-primary">{product.status}</Badge>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <h1 className="font-headline text-4xl font-bold text-glow-primary">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary">${product.price.toFixed(2)}</p>
          
          <div className="text-muted-foreground prose prose-sm max-w-none">
            <p>{product.description}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            {product.category && (
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">Category:</span>
                <Badge variant="outline" className="ml-2">{product.category}</Badge>
              </div>
            )}
            {product.material && (
              <div className="flex items-center">
                <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">Material:</span>
                <span className="ml-2 text-foreground">{product.material}</span>
              </div>
            )}
            {product.dimensions && (
               <div className="flex items-center">
                <Maximize className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">Dimensions:</span>
                <span className="ml-2 text-foreground">{product.dimensions}</span>
              </div>
            )}
          </div>

          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto group">
            <ShoppingCartIcon className="mr-2 h-5 w-5 group-hover:animate-pulse" /> Add to Cart
          </Button>
        </div>
      </div>

      {/* AI Product Recommendations */}
      {browsingHistoryForAI && (
        <section className="mt-16">
          <h2 className="text-3xl font-headline font-semibold mb-8 text-center">You Might Also Like</h2>
          <ProductRecommendations initialBrowsingHistory={browsingHistoryForAI} />
        </section>
      )}
    </div>
  );
}
