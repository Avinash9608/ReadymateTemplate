"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, SettingsIcon, Info, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    siteName: '',
    tagline: '',
    logoLight: '',
    logoDark: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const DEFAULTS = {
    siteName: 'FurnishVerse',
    tagline: 'Your futuristic furniture destination.',
    logoLight: '',
    logoDark: '',
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setFormData({
            siteName: data.settings.siteName || DEFAULTS.siteName,
            tagline: data.settings.tagline || DEFAULTS.tagline,
            logoLight: data.settings.logoLight || DEFAULTS.logoLight,
            logoDark: data.settings.logoDark || DEFAULTS.logoDark,
          });
        } else {
          setFormData(DEFAULTS);
        }
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoLight' | 'logoDark') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/settings/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setFormData(prev => ({ ...prev, [type]: data.url }));
      toast({ title: 'Logo Uploaded', description: 'Logo image uploaded successfully.' });
    } else {
      toast({ title: 'Upload Error', description: data.error || 'Failed to upload logo.', variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setFormData({
        siteName: data.settings.siteName,
        tagline: data.settings.tagline,
        logoLight: data.settings.logoLight,
        logoDark: data.settings.logoDark,
      });
      toast({ title: 'Settings Updated', description: 'Site settings have been saved.' });
      window.location.reload();
    } else {
      toast({ title: 'Error', description: data.error || 'Failed to save settings.', variant: 'destructive' });
    }
  };

  if (loading) {
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
              placeholder={DEFAULTS.siteName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder={DEFAULTS.tagline}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo (Light Theme)</Label>
            <div className="flex items-center space-x-2">
              <Input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'logoLight')} />
              {formData.logoLight ? (
                <img src={formData.logoLight} alt="Logo Light" className="h-10" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo uploaded</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo (Dark Theme)</Label>
            <div className="flex items-center space-x-2">
              <Input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'logoDark')} />
              {formData.logoDark ? (
                <img src={formData.logoDark} alt="Logo Dark" className="h-10" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo uploaded</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
