
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings, type PageComponent, type PageConfig } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Sparkles, LayoutList, Trash2, ArrowUp, ArrowDown, PlusCircle, SettingsIcon, Edit } from 'lucide-react';
import { suggestPageLayout, type PageLayoutSuggestionOutput } from '@/ai/flows/page-layout-suggestion-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

const pageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  pageType: z.enum(["Standard", "Form", "Landing"]),
  layoutPrompt: z.string().optional(),
  isPublished: z.boolean().default(true),
});

type PageFormValues = z.infer<typeof pageSchema>;

const availableComponentTypes = ["Hero", "TextContent", "ContactForm", "Map", "FAQ", "Image", "Button", "ProductGrid", "TestimonialSlider", "CallToAction"] as const;
type AvailableComponentType = typeof availableComponentTypes[number];

// --- Component Prop Edit Forms ---
const TextContentEditSchema = z.object({ text: z.string().min(1, "Text cannot be empty") });
type TextContentFormValues = z.infer<typeof TextContentEditSchema>;
const TextContentEditForm = ({ currentProps, onSave }: { currentProps: Record<string, any>, onSave: (newProps: Record<string, any>) => void }) => {
  const methods = useForm<TextContentFormValues>({ resolver: zodResolver(TextContentEditSchema), defaultValues: { text: currentProps.text || '' } });
  const onSubmit: SubmitHandler<TextContentFormValues> = (data) => onSave(data);
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="text">Content</Label>
          <Textarea id="text" {...methods.register("text")} rows={5} />
          {methods.formState.errors.text && <p className="text-sm text-destructive">{methods.formState.errors.text.message}</p>}
        </div>
        <Button type="submit">Save Text</Button>
      </form>
    </FormProvider>
  );
};

const ImageEditSchema = z.object({ src: z.string().url("Must be a valid URL"), alt: z.string().min(1, "Alt text is required") });
type ImageFormValues = z.infer<typeof ImageEditSchema>;
const ImageEditForm = ({ currentProps, onSave }: { currentProps: Record<string, any>, onSave: (newProps: Record<string, any>) => void }) => {
  const methods = useForm<ImageFormValues>({ resolver: zodResolver(ImageEditSchema), defaultValues: { src: currentProps.src || '', alt: currentProps.alt || '' } });
  const onSubmit: SubmitHandler<ImageFormValues> = (data) => onSave(data);
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="src">Image URL</Label>
          <Input id="src" {...methods.register("src")} placeholder="https://placehold.co/600x400.png" />
          {methods.formState.errors.src && <p className="text-sm text-destructive">{methods.formState.errors.src.message}</p>}
        </div>
        <div>
          <Label htmlFor="alt">Alt Text</Label>
          <Input id="alt" {...methods.register("alt")} placeholder="Descriptive alt text" />
          {methods.formState.errors.alt && <p className="text-sm text-destructive">{methods.formState.errors.alt.message}</p>}
        </div>
        <Button type="submit">Save Image</Button>
      </form>
    </FormProvider>
  );
};
// Add more edit forms for other components (Hero, Button, etc.) here


export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { getPageById, getPageBySlug, updatePage, isLoading: settingsLoading } = useSettings();
  const { toast } = useToast();
  
  const pageId = typeof params.pageId === 'string' ? params.pageId : undefined;

  const [pageData, setPageData] = useState<PageConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLayout, setIsSuggestingLayout] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<PageComponent[]>([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PageComponent | null>(null);
  
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isDirty } } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
  });

  useEffect(() => {
    if (pageId && !settingsLoading) {
      const fetchedPage = getPageById(pageId);
      if (fetchedPage) {
        setPageData(fetchedPage);
        reset({
          title: fetchedPage.title,
          slug: fetchedPage.slug,
          pageType: fetchedPage.pageType as "Standard" | "Form" | "Landing",
          layoutPrompt: fetchedPage.layoutPrompt || '',
          isPublished: fetchedPage.isPublished,
        });
        setCurrentLayout(fetchedPage.suggestedLayout.map(comp => ({...comp, props: comp.props || { placeholderContent: `Default content for ${comp.type}` }})) || []);
      } else {
        toast({ title: "Page not found", description: "Could not find the page you're trying to edit.", variant: "destructive" });
        router.push('/admin/pages/manage');
      }
    }
  }, [pageId, settingsLoading, getPageById, reset, router, toast]);

  const originalSlug = pageData?.slug;

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setValue("title", title, { shouldDirty: true });
    const currentSlug = watch("slug");
    // Only auto-update slug if it matches the auto-generated slug from original title or if it's empty
    const autoSlugFromOriginalTitle = pageData?.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (currentSlug === autoSlugFromOriginalTitle || !currentSlug || currentSlug === originalSlug) {
        const newSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setValue("slug", newSlug, { shouldDirty: true });
    }
  };

  const handleSuggestLayout = async () => {
    const { pageType, layoutPrompt } = watch();
    if (!layoutPrompt) {
      toast({ title: "Prompt needed", description: "Please describe the page content to suggest a layout.", variant: "destructive" });
      return;
    }
    setIsSuggestingLayout(true);
    try {
      const result: PageLayoutSuggestionOutput = await suggestPageLayout({ pageType, userPrompt: layoutPrompt });
      const newLayout: PageComponent[] = result.suggestedComponents.map((type, index) => ({
        id: `${type.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.now()}`,
        type,
        props: { placeholderContent: `New placeholder for ${type}. Click edit to customize.` } 
      }));
      setCurrentLayout(newLayout);
      setValue("layoutPrompt", layoutPrompt, {shouldDirty: true}); // Mark form dirty
      toast({ title: "Layout Suggested!", description: "Review the new suggested components below. Save to apply." });
    } catch (error) {
      console.error("Error suggesting layout:", error);
      toast({ title: "AI Error", description: "Could not suggest a layout. Please try again.", variant: "destructive" });
    } finally {
      setIsSuggestingLayout(false);
    }
  };

  const onSubmit: SubmitHandler<PageFormValues> = async (data) => {
    if (!pageData) return;
    setIsSubmitting(true);

    if (data.slug !== originalSlug) {
      const existingPageWithSlug = getPageBySlug(data.slug);
      if (existingPageWithSlug && existingPageWithSlug.id !== pageData.id) {
          toast({ title: "Slug already exists", description: "The new slug you've chosen is already in use by another page. Please choose a unique slug.", variant: "destructive" });
          setIsSubmitting(false);
          return;
      }
    }

    updatePage(pageData.id, {
      title: data.title,
      slug: data.slug,
      pageType: data.pageType,
      layoutPrompt: data.layoutPrompt,
      suggestedLayout: currentLayout,
      isPublished: data.isPublished,
    });

    toast({
      title: "Page Updated!",
      description: `The page "${data.title}" has been successfully updated.`,
    });
    setPageData(prev => prev ? {...prev, ...data, suggestedLayout: currentLayout, slug: data.slug} : null); 
    reset(data); 
    setIsSubmitting(false);
  };

  const handleAddComponent = (componentType: AvailableComponentType) => {
    if (!componentType) return;
    let defaultProps: Record<string, any> = { placeholderContent: `New ${componentType} Block. Edit to add content.` };
    if (componentType === "TextContent") defaultProps = { text: "New text block. Edit me!" };
    if (componentType === "Image") defaultProps = { src: "", alt: "Placeholder image" };
    if (componentType === "Hero") defaultProps = { title: "Hero Title", subtitle: "Hero Subtitle" };
    if (componentType === "Button") defaultProps = { text: "Click Me", link: "/" };

    const newComponent: PageComponent = {
      id: `${componentType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      type: componentType,
      props: defaultProps
    };
    setCurrentLayout(prev => [...prev, newComponent]);
  };

  const handleRemoveComponent = (componentId: string) => {
    setCurrentLayout(prev => prev.filter(comp => comp.id !== componentId));
  };

  const handleMoveComponent = (componentId: string, direction: 'up' | 'down') => {
    setCurrentLayout(prevLayout => {
      const newLayout = [...prevLayout];
      const index = newLayout.findIndex(c => c.id === componentId);
      if (index === -1) return newLayout;

      if (direction === 'up' && index > 0) {
        [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
      } else if (direction === 'down' && index < newLayout.length - 1) {
        [newLayout[index + 1], newLayout[index]] = [newLayout[index], newLayout[index + 1]];
      }
      return newLayout;
    });
  };

  const openEditModal = (component: PageComponent) => {
    setEditingComponent(component);
    setIsEditModalOpen(true);
  };

  const handleSaveComponentProps = (updatedProps: Record<string, any>) => {
    if (!editingComponent) return;
    setCurrentLayout(prev => prev.map(c => c.id === editingComponent.id ? { ...c, props: updatedProps } : c));
    setIsEditModalOpen(false);
    setEditingComponent(null);
    toast({title: "Component Updated", description: `Properties for ${editingComponent.type} saved.`})
  };

  const renderEditFormComponent = () => {
    if (!editingComponent) return null;
    switch (editingComponent.type) {
      case "TextContent":
        return <TextContentEditForm currentProps={editingComponent.props} onSave={handleSaveComponentProps} />;
      case "Image":
        return <ImageEditForm currentProps={editingComponent.props} onSave={handleSaveComponentProps} />;
      // Add cases for Hero, Button, etc.
      // case "Hero":
      //   return <HeroEditForm currentProps={editingComponent.props} onSave={handleSaveComponentProps} />;
      default:
        return <p>No edit form available for component type: {editingComponent.type}. Default props will be used.</p>;
    }
  };


  if (settingsLoading || !pageData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading page data...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-xl sticky top-24">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-xl font-headline">Page Settings</CardTitle>
                        <CardDescription>Edit basic page information and AI layout prompt.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Page Title</Label>
                  <Input id="title" {...register("title")} onChange={handleTitleChange} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="slug">Page Slug</Label>
                  <Input id="slug" {...register("slug")} />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                   <p className="text-xs text-muted-foreground">Full URL: /pages/{watch("slug")}</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pageType">Page Type</Label>
                   <Controller
                        name="pageType"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="pageType"><SelectValue placeholder="Select page type" /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="Standard">Standard Content Page</SelectItem>
                                <SelectItem value="Form">Form-centric Page</SelectItem>
                                <SelectItem value="Landing">Landing Page</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                  {errors.pageType && <p className="text-sm text-destructive">{errors.pageType.message}</p>}
                </div>
                 <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="isPublished" className="cursor-pointer">Published</Label>
                   <Controller
                        name="isPublished"
                        control={control}
                        render={({ field }) => (
                            <Switch id="isPublished" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="layoutPrompt">AI Layout Prompt</Label>
                  <Textarea id="layoutPrompt" {...register("layoutPrompt")} rows={3} placeholder="Describe the desired page content for AI..." />
                  <Button type="button" variant="outline" size="sm" onClick={handleSuggestLayout} disabled={isSuggestingLayout || !watch("layoutPrompt")}>
                    {isSuggestingLayout ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                    {isSuggestingLayout ? "Suggesting..." : "Update Layout with AI"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isSuggestingLayout}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Page
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                    <LayoutList className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-xl font-headline">Page Layout</CardTitle>
                        <CardDescription>Manage and reorder components on this page.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Controller
                        name="addComponentType" 
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={(value) => handleAddComponent(value as AvailableComponentType)} value="">
                                <SelectTrigger id="addComponentType" className="flex-grow">
                                    <SelectValue placeholder="Add a new component..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableComponentTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {currentLayout.length > 0 ? (
                  <ul className="space-y-3">
                    {currentLayout.map((component, index) => (
                      <li key={component.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex-grow">
                          <span className="font-medium">{component.type}</span>
                          <p className="text-xs text-muted-foreground">
                            {component.props?.text || component.props?.src || component.props?.title || component.props?.placeholderContent || `Component ID: ${component.id}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <Button variant="outline" size="icon" onClick={() => openEditModal(component)} title="Edit Component Properties">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(component.id, 'up')} disabled={index === 0} title="Move Up">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleMoveComponent(component.id, 'down')} disabled={index === currentLayout.length - 1} title="Move Down">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleRemoveComponent(component.id)} title="Remove Component">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No components in layout. Add components or use AI to suggest a layout.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      
      {editingComponent && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if(!isOpen) { setEditingComponent(null); setIsEditModalOpen(false);}}}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit {editingComponent.type} Properties</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderEditFormComponent()}
            </div>
            {/* Footer might be part of individual forms or generic */}
            {/* <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter> */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
