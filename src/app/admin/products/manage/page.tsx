
"use client";

import { useEffect, useState } from 'react';
import { getProducts, type Product } from '@/lib/products'; // Assuming getProducts will fetch from DB
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, PlusCircle, Archive, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';

export default function ManageProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        // This will be an empty array until DB is implemented and products are added
        const fetchedProducts = await getProducts(); 
        setProducts(fetchedProducts.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast({ title: "Error", description: "Could not load products.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [toast]);

  const handleDeleteConfirmation = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const executeDeleteProduct = async () => {
    if (productToDelete) {
      // Placeholder for actual delete logic (e.g., call an API to delete from DB and Firebase Storage)
      console.log("Deleting product (mock):", productToDelete.id);
      // Example: await deleteProductFromDB(productToDelete.id, productToDelete.imagePath);
      // setProducts(prev => prev.filter(p => p.id !== productToDelete.id)); // Update UI optimistically or after confirmation
      toast({
        title: "Product Deleted (Mock)",
        description: `The product "${productToDelete.name}" has been notionally deleted.`,
      });
      setProductToDelete(null);
    }
    setIsAlertOpen(false);
  };

  const togglePublishStatus = async (product: Product) => {
    // Placeholder for actual status update logic
    console.log("Toggling status (mock) for:", product.id, "to", product.status === 'draft' ? 'new' : 'draft');
    // Example: await updateProductInDB(product.id, { status: newStatus });
    // setProducts(prev => prev.map(p => p.id === product.id ? {...p, status: newStatus} : p)); // Update UI
    toast({
      title: "Product Updated (Mock)",
      description: `"${product.name}" status notionally updated.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline">Manage Products</CardTitle>
                <CardDescription>View, edit, or delete your products.</CardDescription>
              </div>
            </div>
            <Link href="/admin/products/create" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Product
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image 
                          src={product.imageUrl || `https://placehold.co/64x64.png?text=${product.name.substring(0,1)}`} 
                          alt={product.name} 
                          data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ").toLowerCase()}
                          width={64} height={64} 
                          className="rounded-md object-cover aspect-square"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell className="text-muted-foreground">${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={product.status === 'new' || product.status === 'old' ? 'default' : 
                                     product.status === 'draft' ? 'secondary' : 'outline'} 
                            className="capitalize"
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => togglePublishStatus(product)} 
                            title={product.status === 'draft' || product.status === 'archived' ? "Publish" : "Unpublish (Draft)"}
                        >
                          {product.status === 'draft' || product.status === 'archived' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Link href={`/admin/products/edit/${product.id}`} passHref>
                          <Button variant="outline" size="icon" title="Edit Product" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteConfirmation(product)} title="Delete Product">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-10">
                No products created yet. Start by creating one!
              </p>
            )}
          </CardContent>
        </Card>

        {productToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product titled "<strong>{productToDelete.name}</strong>".
                Actual deletion from database and storage requires backend implementation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDeleteProduct}>Delete Product (Mock)</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
