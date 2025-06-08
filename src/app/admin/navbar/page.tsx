"use client";

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useSettings, type NavItem } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit3, Trash2, ArrowUp, ArrowDown, LinkIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

type NavItemFormData = Omit<NavItem, 'id' | 'order'>;

interface NavbarFormProps {
  isEditing: string | null;
  setIsEditing: React.Dispatch<React.SetStateAction<string | null>>;
  formData: NavItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<NavItemFormData>>;
  paramsProcessed: boolean;
  setParamsProcessed: React.Dispatch<React.SetStateAction<boolean>>;
  updateNavItem: (id: string, data: Partial<NavItemFormData>) => void;
  addNavItem: (data: NavItemFormData) => void;
  resetForm: () => void;
}

function NavbarForm({
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  paramsProcessed,
  setParamsProcessed,
  updateNavItem,
  addNavItem,
  resetForm,
}: NavbarFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (paramsProcessed || isEditing) return;

    const action = searchParams.get('action');
    const label = searchParams.get('label');
    const slugFromParams = searchParams.get('slug');
    const typeFromParams = searchParams.get('type') as 'internal' | 'external' | null;

    if (action === 'add' && label && slugFromParams && typeFromParams === 'internal') {
      setFormData({
        label: label,
        type: 'internal',
        slug: slugFromParams,
        externalUrl: '',
        isVisible: true,
      });
      setIsEditing(null);
      toast({ title: "Ready to Add Nav Item", description: `Details for page "${label}" pre-filled.` });

      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
      setParamsProcessed(true);
    }
  }, [searchParams, router, paramsProcessed, isEditing, toast, setFormData, setIsEditing, setParamsProcessed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isVisible: checked }));
  };

  const handleTypeChange = (value: 'internal' | 'external') => {
    setFormData(prev => ({ ...prev, type: value, slug: value === 'external' ? '' : (prev.slug || '/'), externalUrl: value === 'internal' ? '' : (prev.externalUrl || '') }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.label) {
      toast({ title: "Error", description: "Label is required.", variant: "destructive" });
      return;
    }
    if (formData.type === 'internal' && !formData.slug) {
      toast({ title: "Error", description: "Slug is required for internal links.", variant: "destructive" });
      return;
    }
    if (formData.type === 'external' && !formData.externalUrl) {
      toast({ title: "Error", description: "URL is required for external links.", variant: "destructive" });
      return;
    }

    if (isEditing) {
      updateNavItem(isEditing, { ...formData, slug: formData.type === 'internal' ? formData.slug : undefined, externalUrl: formData.type === 'external' ? formData.externalUrl : undefined });
      toast({ title: "Navbar Item Updated", description: `"${formData.label}" has been updated.` });
    } else {
      addNavItem({ ...formData, slug: formData.type === 'internal' ? formData.slug : undefined, externalUrl: formData.type === 'external' ? formData.externalUrl : undefined });
      toast({ title: "Navbar Item Added", description: `"${formData.label}" has been added.` });
    }
    resetForm();
  };

  return (
    <Suspense fallback={<div>Loading Form...</div>}>
      <Card className="shadow-xl sticky top-24">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            {isEditing ? <Edit3 className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            {isEditing ? 'Edit Navbar Item' : 'Add New Navbar Item'}
          </CardTitle>
          <CardDescription>{isEditing ? 'Modify the details of the selected item.' : 'Create a new link for your site navigation.'}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" value={formData.label} onChange={handleInputChange} placeholder="e.g., Home, About Us" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type">Link Type</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Page (Slug)</SelectItem>
                  <SelectItem value="external">External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'internal' ? (
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={formData.slug} onChange={handleInputChange} placeholder="e.g., /about, /pages/contact" />
                <p className="text-xs text-muted-foreground">For custom pages, use /pages/your-slug.</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="externalUrl">External URL</Label>
                <Input id="externalUrl" name="externalUrl" type="url" value={formData.externalUrl} onChange={handleInputChange} placeholder="e.g., https://example.com" />
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="isVisible" className="cursor-pointer">Visible</Label>
              <Switch id="isVisible" name="isVisible" checked={formData.isVisible} onCheckedChange={handleSwitchChange} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
            {isEditing && <Button type="button" variant="outline" onClick={resetForm}>Cancel Edit</Button>}
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Add Item'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </Suspense>
  );
}

export default function AdminNavbarPage() {
  const { settings, addNavItem, updateNavItem, removeNavItem, reorderNavItems, isLoading: settingsLoading } = useSettings();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<NavItemFormData>({
    label: '',
    type: 'internal',
    slug: '/',
    externalUrl: '',
    isVisible: true,
  });
  const [paramsProcessed, setParamsProcessed] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/');
    }
  }, [user, authLoading, router, toast]);

  const handleEdit = (item: NavItem) => {
    setIsEditing(item.id);
    setFormData({
      label: item.label,
      type: item.type,
      slug: item.slug || '/',
      externalUrl: item.externalUrl || '',
      isVisible: item.isVisible,
    });
    setParamsProcessed(true);
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ label: '', type: 'internal', slug: '/', externalUrl: '', isVisible: true });
    setParamsProcessed(false);
  };

  const sortedNavItems = settings.navItems ? [...settings.navItems].sort((a, b) => a.order - b.order) : [];

  if (authLoading || settingsLoading || !user || !user.isAdmin) {
    return <div className="text-center py-10 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading navbar settings...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <NavbarForm
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            formData={formData}
            setFormData={setFormData}
            paramsProcessed={paramsProcessed}
            setParamsProcessed={setParamsProcessed}
            updateNavItem={updateNavItem}
            addNavItem={addNavItem}
            resetForm={resetForm}
          />
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center"><LinkIcon className="mr-2 h-5 w-5" />Current Navbar Items</CardTitle>
              <CardDescription>Manage and reorder your existing navigation links. Changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedNavItems.length > 0 ? (
                <ul className="space-y-3">
                  {sortedNavItems.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-grow">
                        <span className={`font-medium ${!item.isVisible ? 'text-muted-foreground line-through' : ''}`}>{item.label}</span>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'internal' ? `Slug: ${item.slug}` : `URL: ${item.externalUrl}`} (Order: {item.order})
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => reorderNavItems(item.id, 'up')} disabled={index === 0} title="Move Up">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => reorderNavItems(item.id, 'down')} disabled={index === sortedNavItems.length - 1} title="Move Down">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)} title="Edit Item">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => { 
                          removeNavItem(item.id); 
                          toast({ title: "Item Removed", description: `"${item.label}" was removed.`}); 
                          if (isEditing === item.id) resetForm(); 
                        }} title="Delete Item">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">No navigation items configured yet. Add one using the form.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}