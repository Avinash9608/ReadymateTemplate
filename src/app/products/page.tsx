
"use client";

import { useState, useMemo, useEffect } from 'react';
import { mockProducts, type Product } from '@/lib/products';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Zap, Filter, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from '@/components/ui/sidebar'; // Added SidebarProvider

const categories = Array.from(new Set(mockProducts.map(p => p.category)));

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [productStatus, setProductStatus] = useState<'all' | 'new' | 'old'>('all');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesStatus = productStatus === 'all' || product.status === productStatus;
      return matchesSearchTerm && matchesCategory && matchesPrice && matchesStatus;
    });
  }, [searchTerm, selectedCategory, priceRange, productStatus]);

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
            {categories.map(cat => (
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
          defaultValue={[0, 5000]}
          min={0}
          max={5000}
          step={50}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Status</Label>
        <div className="mt-2 space-y-2">
          {['all', 'new', 'old'].map(statusValue => (
            <div key={statusValue} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${statusValue}`}
                checked={productStatus === statusValue}
                onCheckedChange={() => setProductStatus(statusValue as 'all' | 'new' | 'old')}
              />
              <Label htmlFor={`status-${statusValue}`} className="capitalize font-normal">{statusValue}</Label>
            </div>
          ))}
        </div>
      </div>
       <Button onClick={() => setIsFilterSidebarOpen(false)} className="w-full md:hidden">Apply Filters</Button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5 sticky top-20 h-[calc(100vh-10rem)] overflow-y-auto pr-4 border-r">
        <h3 className="text-xl font-headline font-semibold mb-4 flex items-center">
          <Filter className="mr-2 h-5 w-5" /> Filters
        </h3>
        <FilterControls />
      </aside>

      {/* Mobile Sidebar Trigger and Sheet */}
       <div className="md:hidden mb-4">
        <Button variant="outline" onClick={() => setIsFilterSidebarOpen(true)} className="w-full">
          <Filter className="mr-2 h-5 w-5" /> Show Filters
        </Button>
        <SidebarProvider>
          <Sidebar open={isFilterSidebarOpen} onOpenChange={setIsFilterSidebarOpen} side="left" variant='sidebar' collapsible='offcanvas'>
              <SidebarHeader className="flex justify-between items-center p-4 border-b">
                <h3 className="text-xl font-headline font-semibold flex items-center">
                  <Filter className="mr-2 h-5 w-5" /> Filters
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </SidebarHeader>
              <SidebarContent>
                <FilterControls />
              </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>


      {/* Product Grid */}
      <main className="w-full md:w-3/4 lg:w-4/5">
        <h1 className="text-3xl font-headline font-bold mb-8">Our Collection</h1>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col">
                <CardHeader className="p-0">
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name} 
                    data-ai-hint={product.dataAiHint || 'product image'}
                    width={600} 
                    height={400} 
                    className="object-cover w-full h-56 group-hover:scale-105 transition-transform duration-300" 
                  />
                </CardHeader>
                <CardContent className="pt-4 flex-grow">
                  <CardTitle className="font-headline text-lg mb-1">{product.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</CardDescription>
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
          <p className="text-muted-foreground text-center py-12">No products match your current filters. Try adjusting your search!</p>
        )}
      </main>
    </div>
  );
}

