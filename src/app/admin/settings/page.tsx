
"use client";

import { useEffect, useState } from 'react';
import { useSettings, type SiteSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, SettingsIcon, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const { settings, setSettings, isLoading: settingsLoading } = useSettings();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<SiteSettings>({
    siteName: '',
    tagline: '',
    logoLightUrl: '',
    logoDarkUrl: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/');
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    if (!settingsLoading && settings) {
      setFormData({
        siteName: settings.siteName || '',
        tagline: settings.tagline || '',
        logoLightUrl: settings.logoLightUrl || '',
        logoDarkUrl: settings.logoDarkUrl || '',
      });
    }
  }, [settings, settingsLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = () => {
    setSettings(formData);
    toast({
      title: "Settings Updated",
      description: "Site branding settings have been saved.",
    });
  };

  if (authLoading || settingsLoading || !user || !user.isAdmin) {
    return <div className="text-center py-10">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline">Site Branding & Settings</CardTitle>
              <CardDescription>Manage your site's name, tagline, and logos.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              name="siteName"
              value={formData.siteName}
              onChange={handleInputChange}
              placeholder="e.g., FurnishVerse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="e.g., Your futuristic furniture destination."
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Logo URLs</AlertTitle>
            <AlertDescription>
              Please provide direct URLs to your logo images. For actual file uploads, Cloudinary integration would be a next step.
              If a URL is not provided for a specific theme, the site name text will be displayed.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="logoLightUrl">Logo URL (Light Theme)</Label>
            <Input
              id="logoLightUrl"
              name="logoLightUrl"
              value={formData.logoLightUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo-light.png"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoDarkUrl">Logo URL (Dark Theme)</Label>
            <Input
              id="logoDarkUrl"
              name="logoDarkUrl"
              value={formData.logoDarkUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo-dark.png"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
