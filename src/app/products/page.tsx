
"use client";

import { useState, useMemo, useEffect, Suspense, type Dispatch, type SetStateAction } from 'react';
import { getProducts, getCategories, type Product } from '@/lib/products'; // Updated
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Zap, Filter, X, Loader2 } from 'lucide-react'; // Added Loader2
import { useSearchParams } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from '@/components/ui/sidebar';


interface InitialCategoryHandlerProps {
  setSelectedCategory: Dispatch<SetStateAction<string>>;
}

function InitialCategoryHandler({ setSelectedCategory }: InitialCategoryHandlerProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, setSelectedCategory]);

  return null;
}

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]); // Max price from products
  const [productStatus, setProductStatus] = useState<'all' | 'new' | 'old' | 'draft' | 'archived'>('all');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(), // Fetch all products initially
          getCategories()
        ]);
        setAllProducts(fetchedProducts);
        setAllCategories(fetchedCategories);
        
        // Set initial max price for slider based on fetched products
        if (fetchedProducts.length > 0) {
          const maxPrice = Math.max(...fetchedProducts.map(p => p.price), 5000);
          setPriceRange([0, Math.ceil(maxPrice / 100) * 100]); // Round up to nearest 100
        }

      } catch (error) {
        console.error("Failed to load products/categories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);


  const filteredProducts = useMemo(() => {
    if (isLoading) return []; // Don't filter if still loading base data
    return allProducts.filter(product => {
      const matchesSearchTerm = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStatus = productStatus === 'all' || product.status === productStatus;
      
      // Only show 'new' or 'old' (published) products by default unless 'draft' or 'archived' is explicitly selected.
      const isPubliclyVisible = product.status === 'new' || product.status === 'old';
      if (productStatus === 'all') {
        return matchesSearchTerm && matchesCategory && matchesPrice && isPubliclyVisible;
      }
      return matchesSearchTerm && matchesCategory && matchesPrice && matchesStatus;
    });
  }, [searchTerm, selectedCategory, priceRange, productStatus, allProducts, isLoading]);

  const FilterControls = () => (
    <div className="space-y-6 p-4">
      <div>
        <Label htmlFor="search" className="text-sm font-medium">Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="category" className="text-sm font-medium">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger id="category" className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
        <Slider
          min={0}
          max={Math.max(...allProducts.map(p => p.price), 5000)} // Dynamic max based on products
          step={50}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Status (Admin View)</Label>
        <div className="mt-2 space-y-2">
          {(['all', 'new', 'old', 'draft', 'archived'] as const).map(statusValue => (
            <div key={statusValue} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${statusValue}`}
                checked={productStatus === statusValue}
                onCheckedChange={() => setProductStatus(statusValue)}
              />
              <Label htmlFor={`status-${statusValue}`} className="capitalize font-normal">
                {statusValue === 'new' || statusValue === 'old' ? `${statusValue} (Published)` : statusValue}
              </Label>
            </div>
          ))}
        </div>
         <p className="text-xs text-muted-foreground mt-1">Note: 'Draft' and 'Archived' are typically admin-only views.</p>
      </div>
      <Button onClick={() => setIsFilterSidebarOpen(false)} className="w-full md:hidden">
        Apply Filters
      </Button>
    </div>
  );

  if (isLoading && allProducts.length === 0) { // Show loader only on initial full load
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin"/>}>
        <InitialCategoryHandler setSelectedCategory={setSelectedCategory} />
      </Suspense>

      <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5 sticky top-20 h-[calc(100vh-10rem)] overflow-y-auto pr-4 border-r">
        <h3 className="text-xl font-headline font-semibold mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filters
        </h3>
        <FilterControls />
      </aside>

      <div className="md:hidden mb-4">
        <Button variant="outline" onClick={() => setIsFilterSidebarOpen(true)} className="w-full">
          <Filter className="mr-2 h-5 w-5" /> Show Filters
        </Button>
        <SidebarProvider>
          <Sidebar 
            open={isFilterSidebarOpen} 
            onOpenChange={setIsFilterSidebarOpen} 
            side="left" 
            variant="sidebar" 
            collapsible="offcanvas"
          >
            <SidebarHeader className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-headline font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5" /> Filters
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFilterSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </SidebarHeader>
            <SidebarContent>
              <FilterControls />
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>

      <main className="w-full md:w-3/4 lg:w-4/5">
        <h1 className="text-3xl font-headline font-bold mb-8">Our Collection</h1>
        {isLoading && allProducts.length > 0 ? ( // Show subtle loading for filter changes
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p>Filtering...</p></div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col"
              >
                <CardHeader className="p-0">
                  <Image
                    src={product.imageUrl || `https://placehold.co/600x400.png?text=No+Image`}
                    alt={product.name}
                    data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
                    width={600}
                    height={400}
                    className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300"
                  />
                </CardHeader>
                <CardContent className="pt-4 flex-grow">
                  <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </CardDescription>
                  <p className="text-primary font-semibold text-md">${product.price.toFixed(2)}</p>
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
        ) : (
          <p className="text-muted-foreground text-center py-12">
            No products match your current filters. Try adjusting your search!
          </p>
        )}
      </main>
    </div>
  );
}
