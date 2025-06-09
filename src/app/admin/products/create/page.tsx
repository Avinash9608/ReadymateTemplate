
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, ShoppingBag } from 'lucide-react';
// import { getCategories } from '@/lib/products'; // Will use this when categories are dynamic

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["new", "old", "draft", "archived"]).default("draft"),
  stock: z.coerce.number().min(0, "Stock cannot be negative").default(0),
  image: z.instanceof(FileList).optional(), // Accept FileList, make it optional for now
  dataAiHint: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Placeholder categories until fetched dynamically
const mockCategories = ["Living Room", "Bedroom", "Office", "Dining", "Outdoor"];

export default function CreateProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [categories, setCategories] = useState<string[]>(mockCategories);

  // useEffect(() => {
  //   async function fetchCategories() {
  //     const fetched = await getCategories();
  //     setCategories(fetched.length > 0 ? fetched : mockCategories);
  //   }
  //   fetchCategories();
  // }, []);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "draft",
      stock: 0,
    }
  });

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, ''); 
    setValue("slug", slug);
    if (!watch("dataAiHint")) {
      setValue("dataAiHint", name.split(" ").slice(0, 2).join(" ").toLowerCase());
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true);
    
    let productPayload: any = { ...data };
    delete productPayload.image; // Remove FileList from payload to be "saved"

    if (data.image && data.image.length > 0) {
      const imageFile = data.image[0];
      // ** SIMULATE UPLOAD AND URL GENERATION **
      // In a real app, you would upload imageFile to Firebase Storage here
      // and get back the actual URL and path.
      const simulatedFileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
      productPayload.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(imageFile.name.substring(0,15))}`; // Placeholder URL
      productPayload.imagePath = `products/images/${simulatedFileName}`; // Placeholder path

      console.log("Simulated image upload for:", imageFile.name);
      console.log("Generated imageUrl (placeholder):", productPayload.imageUrl);
      console.log("Generated imagePath (placeholder):", productPayload.imagePath);
      // ** END SIMULATION **
    } else {
        // Default placeholder if no image is selected
        productPayload.imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0,15))}`;
        productPayload.dataAiHint = data.name.split(" ").slice(0,2).join(" ").toLowerCase();
    }


    console.log("Submitting product data (mock):", productPayload);

    // Placeholder for actual product creation logic (e.g., API call to save to DB)
    // Example: const newProduct = await addProductToDB(productPayload);
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Product Created (Mock)!",
      description: `The product "${data.name}" has been notionally created. Image URL is simulated.`,
    });
    
    // router.push(`/admin/products/edit/${newProduct.id}`); // Redirect to edit page of the new product
    router.push('/admin/products/manage'); // Or redirect to manage page
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <ShoppingBag className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline">Create New Product</CardTitle>
              <CardDescription>Add a new product to your catalog. Image upload is simulated.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  {...register("name")} 
                  onChange={handleNameChange}
                  placeholder="e.g., Quantum Sofa" 
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Product Slug (URL part)</Label>
                <Input id="slug" {...register("slug")} placeholder="e.g., quantum-sofa" />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                {...register("description")} 
                placeholder="Describe your product..." 
                rows={5}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" {...register("price")} placeholder="e.g., 299.99" />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={watch("category")}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" type="number" {...register("stock")} placeholder="e.g., 100" />
                {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                 <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as ProductFormValues["status"])}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="new">New (Published)</SelectItem>
                    <SelectItem value="old">Old (Published)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="dataAiHint">Image AI Hint (Optional)</Label>
                <Input 
                    id="dataAiHint" 
                    {...register("dataAiHint")} 
                    placeholder="e.g., modern sofa, futuristic chair (max 2 words)" 
                />
                <p className="text-xs text-muted-foreground">Keywords for AI image search if no image is uploaded. Auto-filled from name if empty.</p>
                {errors.dataAiHint && <p className="text-sm text-destructive">{errors.dataAiHint.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input id="image" type="file" {...register("image")} accept="image/*" />
                <p className="text-xs text-muted-foreground">
                    Select an image for the product. Actual upload to Firebase Storage needs backend implementation.
                </p>
                {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Creating Product..." : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
