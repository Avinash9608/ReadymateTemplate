
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
import { useSettings, type PageComponent } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, Sparkles, LayoutList } from 'lucide-react';
import { suggestPageLayout, type PageLayoutSuggestionOutput } from '@/ai/flows/page-layout-suggestion-flow';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; // Added for Publish switch

const pageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  pageType: z.enum(["Standard", "Form", "Landing"]),
  layoutPrompt: z.string().optional(),
  isPublished: z.boolean().default(true),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function CreatePage() {
  const { addPage, getPageBySlug, addNavItem } = useSettings(); // Added addNavItem
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLayout, setIsSuggestingLayout] = useState(false);
  const [suggestedComponents, setSuggestedComponents] = useState<string[] | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      isPublished: true,
      pageType: "Standard",
    }
  });

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setValue("title", title);
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^a-z0-9-]/g, ''); 
    setValue("slug", slug);
  };

  const handleSuggestLayout = async () => {
    const { pageType, layoutPrompt } = watch();
    if (!layoutPrompt) {
      toast({ title: "Prompt needed", description: "Please describe the page content to suggest a layout.", variant: "destructive" });
      return;
    }
    setIsSuggestingLayout(true);
    setSuggestedComponents(null);
    try {
      const result: PageLayoutSuggestionOutput = await suggestPageLayout({ pageType, userPrompt: layoutPrompt });
      setSuggestedComponents(result.suggestedComponents);
      toast({ title: "Layout Suggested!", description: "Review the suggested components below." });
    } catch (error) {
      console.error("Error suggesting layout:", error);
      toast({ title: "AI Error", description: "Could not suggest a layout. Please try again.", variant: "destructive" });
    } finally {
      setIsSuggestingLayout(false);
    }
  };

  const onSubmit: SubmitHandler<PageFormValues> = async (data) => {
    setIsSubmitting(true);

    const existingPage = getPageBySlug(data.slug);
    if (existingPage) {
      toast({ title: "Slug already exists", description: "Please choose a unique slug for the page URL part.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    const pageLayout: PageComponent[] = suggestedComponents 
      ? suggestedComponents.map((type, index) => ({ 
          id: `${type.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.now()}`, 
          type, 
          props: { placeholderContent: `Placeholder for ${type}` } 
        }))
      : [{ 
          id: `default-text-${Date.now()}`, 
          type: 'TextContent', 
          props: { placeholderContent: 'Edit this page to add content.' } 
        }];

    const newPage = addPage({
      title: data.title,
      slug: data.slug, 
      pageType: data.pageType,
      layoutPrompt: data.layoutPrompt,
      suggestedLayout: pageLayout,
      isPublished: data.isPublished,
    });

    if (data.isPublished) {
      addNavItem({
        label: newPage.title,
        type: 'internal',
        slug: `/pages/${newPage.slug}`,
        isVisible: true,
      });
      toast({
        title: "Page Created & Published!",
        description: `The page "${newPage.title}" has been created and added to the navbar. Redirecting to edit...`,
      });
    } else {
      toast({
        title: "Page Created as Draft!",
        description: `The page "${newPage.title}" has been created as a draft. Redirecting to edit...`,
      });
    }
    
    router.push(`/admin/pages/edit/${newPage.id}`);
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <PlusCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline">Create New Page</CardTitle>
              <CardDescription>Define the details and layout for your new page.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input 
                id="title" 
                {...register("title")} 
                onChange={handleTitleChange}
                placeholder="e.g., Contact Us, About Our Company" 
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Page Slug (URL part)</Label>
              <Input id="slug" {...register("slug")} placeholder="e.g., contact-us, about-our-company" />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">Full URL will be: /pages/{watch("slug") || "your-slug"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageType">Page Type</Label>
              <Select
                value={watch("pageType")}
                onValueChange={(value) => setValue("pageType", value as "Standard" | "Form" | "Landing")}
              >
                <SelectTrigger id="pageType">
                  <SelectValue placeholder="Select page type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard Content Page</SelectItem>
                  <SelectItem value="Form">Form-centric Page (e.g., Contact)</SelectItem>
                  <SelectItem value="Landing">Landing Page</SelectItem>
                </SelectContent>
              </Select>
              {errors.pageType && <p className="text-sm text-destructive">{errors.pageType.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="layoutPrompt">Describe Page Content (for AI Layout Suggestion)</Label>
              <Textarea 
                id="layoutPrompt" 
                {...register("layoutPrompt")} 
                placeholder="e.g., A contact page with company address, phone/email, a Google Map, an inquiry form, and a helpful FAQ." 
                rows={3}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestLayout} disabled={isSuggestingLayout || !watch("layoutPrompt")}>
                {isSuggestingLayout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isSuggestingLayout ? "Suggesting..." : "Suggest Layout with AI"}
              </Button>
            </div>

            {suggestedComponents && suggestedComponents.length > 0 && (
              <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                <Label className="flex items-center"><LayoutList className="mr-2 h-5 w-5 text-primary"/> AI Suggested Layout Components:</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedComponents.map((component, index) => (
                    <Badge key={index} variant="secondary">{component}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">This layout will be used to create the initial page structure.</p>
              </div>
            )}
             {suggestedComponents === null && watch("layoutPrompt") && !isSuggestingLayout && (
                <p className="text-sm text-muted-foreground">Click "Suggest Layout with AI" to get component ideas based on your description.</p>
            )}
            {suggestedComponents?.length === 0 && !isSuggestingLayout && (
                <p className="text-sm text-muted-foreground">AI could not determine specific components. A default text block will be added.</p>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isPublished"
                checked={watch("isPublished")}
                onCheckedChange={(checked) => setValue("isPublished", checked)}
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish this page (and add to navbar if not already present)
              </Label>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isSuggestingLayout}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Creating Page..." : "Create Page & Edit"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
