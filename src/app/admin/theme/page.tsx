
"use client";

import { useState, useEffect } from 'react';
import { useTheme, type CustomColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge'; // Added import

// Helper to convert HSL string to individual H, S, L values
const parseHslString = (hslString: string | undefined): { h: string, s: string, l: string } => {
  if (!hslString) return { h: '', s: '', l: '' };
  const parts = hslString.replace(/%/g, '').split(' ');
  return {
    h: parts[0] || '',
    s: parts[1] || '',
    l: parts[2] || '',
  };
};

// Helper to construct HSL string from individual H, S, L values
const constructHslString = (h: string, s: string, l: string): string => {
  if (!h && !s && !l) return '';
  return `${h || '0'} ${s || '0'}% ${l || '0'}%`;
};

export default function AdminThemePage() {
  const { customColors, setCustomColors: applyCustomColors, effectiveTheme } = useTheme();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State for HSL components
  const [primaryH, setPrimaryH] = useState('');
  const [primaryS, setPrimaryS] = useState('');
  const [primaryL, setPrimaryL] = useState('');

  const [accentH, setAccentH] = useState('');
  const [accentS, setAccentS] = useState('');
  const [accentL, setAccentL] = useState('');
  
  // More colors can be added: background, foreground

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/');
    }
  }, [user, isLoading, router, toast]);
  
  useEffect(() => {
    const { h: pH, s: pS, l: pL } = parseHslString(customColors.primary);
    setPrimaryH(pH); setPrimaryS(pS); setPrimaryL(pL);

    const { h: aH, s: aS, l: aL } = parseHslString(customColors.accent);
    setAccentH(aH); setAccentS(aS); setAccentL(aL);

  }, [customColors]);


  const handleSaveTheme = () => {
    const newCustomColors: CustomColors = {};
    const primaryColor = constructHslString(primaryH, primaryS, primaryL);
    if (primaryColor) newCustomColors.primary = primaryColor;

    const accentColor = constructHslString(accentH, accentS, accentL);
    if (accentColor) newCustomColors.accent = accentColor;
    
    // Construct and add other colors (background, foreground) similarly if inputs are provided for them

    applyCustomColors(newCustomColors);
    toast({
      title: "Theme Updated",
      description: "Custom theme colors have been applied.",
    });
  };

  const handleResetToDefaults = () => {
    // Reset HSL input fields
    setPrimaryH(''); setPrimaryS(''); setPrimaryL('');
    setAccentH(''); setAccentS(''); setAccentL('');
    // Call setCustomColors with empty object to clear custom styles from :root
    // This will make it fall back to globals.css defaults
    applyCustomColors({}); 
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to defaults.",
    });
  };

  if (isLoading || !user || !user.isAdmin) {
    return <div className="text-center py-10">Checking permissions...</div>;
  }

  const ColorInputGroup = ({ label, h, setH, s, setS, l, setL, colorPreview }: {
    label: string,
    h: string, setH: (v: string) => void,
    s: string, setS: (v: string) => void,
    l: string, setL: (v: string) => void,
    colorPreview?: string
  }) => (
    <div className="space-y-3 p-4 border rounded-md bg-card">
      <Label className="text-lg font-semibold block">{label}</Label>
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded border" style={{ backgroundColor: colorPreview ? `hsl(${colorPreview})` : 'transparent' }}></div>
        <div className="grid grid-cols-3 gap-2 flex-grow">
          <div>
            <Label htmlFor={`${label}-h`} className="text-xs">H (0-360)</Label>
            <Input id={`${label}-h`} type="number" value={h} onChange={(e) => setH(e.target.value)} placeholder="e.g. 183" />
          </div>
          <div>
            <Label htmlFor={`${label}-s`} className="text-xs">S (0-100)%</Label>
            <Input id={`${label}-s`} type="number" value={s} onChange={(e) => setS(e.target.value)} placeholder="e.g. 100" />
          </div>
          <div>
            <Label htmlFor={`${label}-l`} className="text-xs">L (0-100)%</Label>
            <Input id={`${label}-l`} type="number" value={l} onChange={(e) => setL(e.target.value)} placeholder="e.g. 74" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
           <div className="flex items-center space-x-3 mb-2">
            <Palette className="h-10 w-10 text-primary" />
            <div>
                <CardTitle className="text-2xl font-headline">Admin Theme Control</CardTitle>
                <CardDescription>Customize the website's color theme. Enter HSL values (e.g., H: 183, S: 100, L: 74 for Electric Blue).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ColorInputGroup 
            label="Primary Color" 
            h={primaryH} setH={setPrimaryH} 
            s={primaryS} setS={setPrimaryS} 
            l={primaryL} setL={setPrimaryL} 
            colorPreview={constructHslString(primaryH, primaryS, primaryL)}
          />
          <ColorInputGroup 
            label="Accent Color" 
            h={accentH} setH={setAccentH} 
            s={accentS} setS={setAccentS} 
            l={accentL} setL={setAccentL}
            colorPreview={constructHslString(accentH, accentS, accentL)}
          />
          {/* Example display of current theme mode */}
          <p className="text-sm text-muted-foreground">
            Current site mode: <Badge variant="outline">{effectiveTheme}</Badge>. Theme colors apply to both light and dark modes.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleResetToDefaults}>Reset to Defaults</Button>
          <Button onClick={handleSaveTheme}>
            <Save className="mr-2 h-4 w-4" /> Apply Theme
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
