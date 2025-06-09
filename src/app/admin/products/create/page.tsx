
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
import { Loader2, PlusCircle, ShoppingBag, Sparkles } from 'lucide-react';
import NextImage from 'next/image';
import { generateProductImage } from '@/ai/flows/generate-product-image-flow';
import { addProductToFirestore, type Product } from '@/lib/products'; 

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["new", "old", "draft", "archived"]).default("draft"),
  stock: z.coerce.number().min(0, "Stock cannot be negative").default(0),
  image: typeof window !== 'undefined'
    ? z.instanceof(FileList).optional()
    : z.undefined(),
  dataAiHint: z.string().max(200, "AI hint should be concise (max 200 chars)").optional(),
  features: z.string().optional().describe("Comma-separated list of product features"),
  dimensions: z.string().optional(),
  material: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const mockCategories = ["Living Room", "Bedroom", "Office", "Dining", "Outdoor", "Lighting", "Accessories", "Smart Home", "Eco-Friendly"];

export default function CreateProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGeneratedImagePreview, setAiGeneratedImagePreview] = useState<string | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
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
      setValue("dataAiHint", name.split(" ").slice(0, 4).join(" ").toLowerCase());
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualImagePreview(reader.result as string);
        setAiGeneratedImagePreview(null); 
      };
      reader.readAsDataURL(file);
    } else {
      setManualImagePreview(null);
    }
  };

  const handleGenerateAiImage = async () => {
    const productName = watch("name");
    const hint = watch("dataAiHint");
    if (!productName) {
      toast({ title: "Product Name Needed", description: "Please enter a product name before generating an AI image.", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);
    setAiGeneratedImagePreview(null); 
    try {
      const result = await generateProductImage({ productName, dataAiHint: hint });
      if (result.imageDataUri && result.imageDataUri.startsWith('data:image')) {
        setAiGeneratedImagePreview(result.imageDataUri);
        setManualImagePreview(null); 
        setValue("image", undefined); 
        toast({ title: "AI Image Generated!", description: "Review the generated image below. Save product to store it." });
      } else if (result.imageDataUri && result.imageDataUri.startsWith('https://placehold.co')) {
        setAiGeneratedImagePreview(result.imageDataUri);
        setManualImagePreview(null);
        setValue("image", undefined);
        toast({ title: "AI Image Placeholder", description: "AI generation returned a placeholder. You can try again or upload manually.", variant: "default", duration: 8000 });
      } else {
        throw new Error(result.imageDataUri || "Invalid image data received from AI.");
      }
    } catch (error: any) {
      console.error("Error generating AI image on client:", error);
      toast({
        title: "AI Image Generation Failed",
        description: `Could not generate image. ${error.message || "Please check server logs, content policies, API key, or try again. Upload manually if issue persists."}`,
        variant: "destructive",
        duration: 15000,
       });
      setAiGeneratedImagePreview(`https://placehold.co/300x200.png?text=AI+Gen+Client+Error`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true);

    let imageUrlForDb: string | undefined = undefined;
    let imagePathForDb: string | undefined = undefined;
    // Default to the form's status, but allow override for AI image temp status
    let productStatusForDb: Product['status'] = data.status; 

    if (manualImagePreview) {
      imageUrlForDb = manualImagePreview; // This will be a data URI
      const fileExtension = data.image?.[0]?.name.split('.').pop() || 'jpg';
      imagePathForDb = `products/images/manual/${data.slug}-${Date.now()}.${fileExtension}`;
      console.log("Using manual image preview data URI for upload:", data.image?.[0]?.name);
    } else if (aiGeneratedImagePreview && aiGeneratedImagePreview.startsWith('data:image')) {
      imageUrlForDb = aiGeneratedImagePreview; // This is a data URI
      imagePathForDb = `products/images/ai-generated/${data.slug}-${Date.now()}.png`; // Assume png for AI
      productStatusForDb = 'ai-generated-temp'; // Temp status to indicate AI image needs upload by backend
      console.log("Using AI-generated image data URI for upload.");
    } else if (aiGeneratedImagePreview && aiGeneratedImagePreview.startsWith('https://placehold.co')) {
      imageUrlForDb = aiGeneratedImagePreview; 
      imagePathForDb = `placeholders/ai-failed/${data.slug}.png`;
      console.log("Using placeholder image from AI generation attempt.");
    } else {
      imageUrlForDb = `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0, 15))}`;
      imagePathForDb = `placeholders/default/${data.slug}.png`;
      console.log("Using default placeholder image.");
    }

    const productToSave: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      status: productStatusForDb,
      stock: data.stock,
      imageUrl: imageUrlForDb, 
      imagePath: imagePathForDb,
      dataAiHint: data.dataAiHint || data.name.split(" ").slice(0, 2).join(" ").toLowerCase(),
      features: data.features?.split(',').map(f => f.trim()).filter(f => f) || [],
      dimensions: data.dimensions,
      material: data.material,
    };
    
    try {
        const newProductId = await addProductToFirestore(productToSave);
        if (newProductId) {
            toast({
                title: "Product Created Successfully!",
                description: `The product "${productToSave.name}" has been saved to the database.`,
            });
            router.push('/admin/products/manage');
        } else {
            // This case implies addProductToFirestore returned null without throwing an error, which shouldn't happen with current implementation
            toast({
                title: "Error Creating Product",
                description: "There was an issue saving the product. No ID returned.",
                variant: "destructive",
            });
        }
    } catch (error: any) {
        console.error("Error during product submission process:", error);
        toast({
            title: "Error Creating Product",
            description: error.message || "An unexpected error occurred. Please check console and server logs.",
            variant: "destructive",
            duration: 10000,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const currentImagePreview = manualImagePreview || aiGeneratedImagePreview;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <ShoppingBag className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline">Create New Product</CardTitle>
              <CardDescription>Add a new product. You can upload an image or generate one with AI.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" {...register("name")} onChange={handleNameChange} placeholder="e.g., Quantum Sofa" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Product Slug (URL part)</Label>
                <Input id="slug" {...register("slug")} placeholder="e.g., quantum-sofa" readOnly className="bg-muted/50" />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} placeholder="Describe your product..." rows={3} />
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
                <Select value={watch("category")} onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {mockCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
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
                 <Select value={watch("status")} onValueChange={(value) => setValue("status", value as ProductFormValues["status"])}>
                  <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
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

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="material">Material (Optional)</Label>
                    <Input id="material" {...register("material")} placeholder="e.g., Oak Wood, Velvet" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (Optional)</Label>
                    <Input id="dimensions" {...register("dimensions")} placeholder="e.g., 120x60x75 cm" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="features">Features (Optional, comma-separated)</Label>
                <Textarea id="features" {...register("features")} placeholder="e.g., USB Charging, Smart Controls, Eco-friendly" rows={2}/>
            </div>


            <Card className="p-4 space-y-4 bg-secondary/30">
              <Label className="text-base font-semibold">Product Image</Label>
              {currentImagePreview && (
                <div className="my-4 border rounded-md overflow-hidden w-full aspect-video max-w-sm mx-auto bg-muted">
                  <NextImage src={currentImagePreview} alt="Product Preview" width={400} height={300} className="object-contain w-full h-full" />
                </div>
              )}
              <div className="space-y-2">
                  <Label htmlFor="image">Upload Image Manually</Label>
                  <Input id="image" type="file" {...register("image")} accept="image/*" onChange={handleImageFileChange} />
                  <p className="text-xs text-muted-foreground">Overrides AI-generated image if a file is selected. Ensure CORS is configured on Firebase Storage for this to work.</p>
                  {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
              </div>
              <div className="flex items-center my-2">
                <hr className="flex-grow border-t" />
                <span className="mx-2 text-xs text-muted-foreground">OR</span>
                <hr className="flex-grow border-t" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataAiHint">AI Image Generation Hint (Optional)</Label>
                <Textarea id="dataAiHint" {...register("dataAiHint")} placeholder="e.g., futuristic chair, minimalist design, on a white background" rows={2} />
                {errors.dataAiHint && <p className="text-sm text-destructive">{errors.dataAiHint.message}</p>}
                 <Button type="button" variant="outline" size="sm" onClick={handleGenerateAiImage} disabled={isGeneratingImage || !watch("name")}>
                  {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isGeneratingImage ? "Generating..." : "Generate Image with AI"}
                </Button>
                <p className="text-xs text-muted-foreground">Uses product name and this hint. Overridden by manual upload. Ensure CORS configured for Genkit image generation model and Firebase Storage.</p>
              </div>
            </Card>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isGeneratingImage}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Creating Product..." : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
