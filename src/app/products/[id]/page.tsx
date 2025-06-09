
"use client";

import { useParams, useRouter } from 'next/navigation';
import { getProductBySlug, type Product as ProductType } from '@/lib/products'; // Updated
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import ProductRecommendations from '@/components/ai/ProductRecommendations';
import { ChevronLeft, ShoppingCartIcon, Tag, Layers, Maximize, Loader2, AlertTriangle } from 'lucide-react'; // Added Loader2, AlertTriangle
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<ProductType | null | undefined>(undefined); // undefined for loading state
  const [isLoading, setIsLoading] = useState(true);
  const [browsingHistoryForAI, setBrowsingHistoryForAI] = useState<string>("");

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      if (params.id) {
        const slug = Array.isArray(params.id) ? params.id[0] : params.id;
        try {
          const foundProduct = await getProductBySlug(slug); // Assuming this is now async
          if (foundProduct) {
            setProduct(foundProduct);
            const history = localStorage.getItem('browsingHistory') || '';
            const newHistory = `${history}, ${foundProduct.name}`.replace(/^,|,$/, '').trim().split(',').slice(-5).join(','); // Keep last 5
            localStorage.setItem('browsingHistory', newHistory);
            setBrowsingHistoryForAI(newHistory);
          } else {
            setProduct(null); // Explicitly set to null if not found
          }
        } catch (error) {
          console.error("Failed to load product:", error);
          setProduct(null);
        }
      } else {
        setProduct(null); // No ID, so no product
      }
      setIsLoading(false);
    }
    loadProduct();
  }, [params.id]);

  if (isLoading || product === undefined) { // Show loading if isLoading or product state is initial undefined
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading product details...</p>
      </div>
    );
  }

  if (product === null) { // Product explicitly not found or error occurred
     return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-24 w-24 text-destructive mb-6" />
        <h1 className="text-4xl font-bold font-headline mb-4">404 - Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you are looking for does not exist or may have been removed.</p>
        <Button onClick={() => router.push('/products')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
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
        <ChevronLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg group">
          <Image
            src={product.imageUrl || `https://placehold.co/600x600.png?text=No+Image`}
            alt={product.name}
            data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-500"
          />
           <Badge variant={product.status === 'new' ? "default" : "secondary"} className="absolute top-4 left-4 capitalize neon-glow-primary">{product.status}</Badge>
        </div>

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
            <div className="flex items-center">
                <Layers className="h-5 w-5 mr-2 text-muted-foreground" /> {/* Using Layers as generic icon for stock */}
                <span className="font-medium">Stock:</span>
                <span className="ml-2 text-foreground">{product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</span>
            </div>
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
          
          <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto group" disabled={product.stock === 0}>
            <ShoppingCartIcon className="mr-2 h-5 w-5 group-hover:animate-pulse" /> 
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {browsingHistoryForAI && (
        <section className="mt-16">
          <h2 className="text-3xl font-headline font-semibold mb-8 text-center">You Might Also Like</h2>
          <ProductRecommendations initialBrowsingHistory={browsingHistoryForAI} />
        </section>
      )}
    </div>
  );
}
