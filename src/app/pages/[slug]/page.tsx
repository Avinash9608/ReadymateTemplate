
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useSettings, type PageConfig, type PageComponent as PageComponentType } from '@/contexts/SettingsContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react'; // Added Loader2
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Corrected import

// Placeholder Dynamic Components
const HeroBlock = ({ title, subtitle }: { title?: string, subtitle?: string }) => (
  <section className="py-12 md:py-20 bg-secondary/50 rounded-lg shadow-md my-4">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-4xl font-bold font-headline text-primary mb-4">{title || "Hero Title Placeholder"}</h1>
      {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
    </div>
  </section>
);

const TextContentBlock = ({ text }: { text?: string }) => (
  <div className="prose dark:prose-invert max-w-none my-4 p-6 bg-card rounded-lg shadow">
    <p>{text || "This is a placeholder for rich text content. Edit this page in the admin panel to add your own text, images, and more."}</p>
  </div>
);

const ContactFormBlock = () => (
  <div className="my-4 p-6 bg-card rounded-lg shadow">
    <h3 className="text-2xl font-semibold mb-4">Contact Us (Placeholder)</h3>
    <form className="space-y-4">
      <div><Label htmlFor="name-ph">Name</Label><Input id="name-ph" type="text" placeholder="Your Name" /></div>
      <div><Label htmlFor="email-ph">Email</Label><Input id="email-ph" type="email" placeholder="Your Email" /></div>
      <div><Label htmlFor="message-ph">Message</Label><Textarea id="message-ph" placeholder="Your Message" /></div>
      <Button type="button" disabled>Send Message (Disabled)</Button>
    </form>
  </div>
);

const MapBlock = ({ address }: { address?: string }) => (
  <div className="my-4 p-6 bg-card rounded-lg shadow flex flex-col items-center justify-center aspect-video">
    <h3 className="text-2xl font-semibold mb-2">Map Placeholder</h3>
    {address && <p className="text-muted-foreground mb-2">Location: {address}</p>}
    <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground">
      [Google Maps Embed Placeholder]
    </div>
  </div>
);

const FaqBlock = ({ faqs }: { faqs?: { q: string, a: string }[] }) => (
  <div className="my-4 p-6 bg-card rounded-lg shadow">
    <h3 className="text-2xl font-semibold mb-4">FAQ (Placeholder)</h3>
    {(faqs && faqs.length > 0) ? faqs.map((faq, i) => (
      <div key={i} className="mb-2">
        <h4 className="font-medium">{faq.q || `Question ${i+1}`}</h4>
        <p className="text-muted-foreground">{faq.a || `Answer placeholder ${i+1}`}</p>
      </div>
    )) : <p className="text-muted-foreground">No FAQ items defined.</p>}
  </div>
);

const ImageBlock = ({ src, alt }: { src?: string, alt?: string }) => (
   <div className="my-4 rounded-lg shadow overflow-hidden aspect-video bg-muted flex items-center justify-center">
    {src ? (
      <Image src={src} alt={alt || "Placeholder Image"} data-ai-hint="custom page image" width={800} height={450} className="object-cover w-full h-full" />
    ) : (
      <p className="text-muted-foreground">Image Placeholder</p>
    )}
  </div>
);

const ButtonBlock = ({ text, link }: { text?: string, link?: string }) => (
  <div className="my-4 text-center">
    <Button asChild={!!link} disabled={!link && !text} size="lg">
      {link ? <Link href={link}>{text || "Button Placeholder"}</Link> : <span>{text || "Button Placeholder"}</span>}
    </Button>
  </div>
);

const ProductGridBlock = () => (
  <div className="my-4 p-6 bg-card rounded-lg shadow">
    <h3 className="text-2xl font-semibold mb-4">Product Grid (Placeholder)</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="border p-4 rounded bg-muted text-center">Product {i}</div>)}
    </div>
  </div>
);
const TestimonialSliderBlock = () => (
  <div className="my-4 p-6 bg-card rounded-lg shadow text-center">
    <h3 className="text-2xl font-semibold mb-4">Testimonials (Placeholder)</h3>
    <p className="italic text-muted-foreground">"This is a great product!" - Happy Customer</p>
  </div>
);
const CallToActionBlock = ({ title, text, buttonText, buttonLink }: { title?: string, text?: string, buttonText?: string, buttonLink?: string }) => (
  <section className="py-12 bg-primary/10 rounded-lg shadow-md my-4">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold font-headline text-primary mb-3">{title || "Call to Action!"}</h2>
      <p className="text-lg text-foreground mb-6">{text || "Don't miss out on this amazing opportunity."}</p>
      <Button asChild={!!buttonLink} size="lg" disabled={!buttonText}>
        {buttonLink ? <Link href={buttonLink}>{buttonText || "Learn More"}</Link> : <span>{buttonText || "Learn More"}</span>}
      </Button>
    </div>
  </section>
);

// Component mapping
const componentMap: Record<string, React.FC<any>> = {
  Hero: HeroBlock,
  TextContent: TextContentBlock,
  ContactForm: ContactFormBlock,
  Map: MapBlock,
  FAQ: FaqBlock,
  Image: ImageBlock,
  Button: ButtonBlock,
  ProductGrid: ProductGridBlock,
  TestimonialSlider: TestimonialSliderBlock,
  CallToAction: CallToActionBlock,
};

const RenderComponent = ({ component }: { component: PageComponentType }) => {
  const ComponentToRender = componentMap[component.type];
  if (!ComponentToRender) {
    return (
      <div className="my-4 p-4 border border-destructive bg-destructive/10 rounded-md text-destructive">
        <AlertTriangle className="inline-block mr-2 h-5 w-5" />
        Unknown component type: {component.type}. Please define it or check configuration.
      </div>
    );
  }
  return <ComponentToRender {...(component.props || {})} />;
};


export default function DynamicPage() {
  const params = useParams();
  const router = useRouter();
  const { getPageBySlug, isLoading: settingsLoading } = useSettings();
  const [pageConfig, setPageConfig] = useState<PageConfig | null | 'loading'>('loading');

  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0];

  useEffect(() => {
    if (settingsLoading) {
      setPageConfig('loading');
      return;
    }
    if (slug) {
      const config = getPageBySlug(slug);
      setPageConfig(config || null); // Set to config if found, otherwise null
    } else {
      setPageConfig(null); // No slug, so page not found
    }
  }, [slug, getPageBySlug, settingsLoading]);

  if (pageConfig === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading page content...</p>
      </div>
    );
  }

  if (pageConfig === null) { // Page explicitly not found or slug missing
    return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-24 w-24 text-destructive mb-6" />
        <h1 className="text-4xl font-bold font-headline mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">The page you are looking for does not exist or may have been moved.</p>
        <Button onClick={() => router.push('/')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go Back Home
        </Button>
      </div>
    );
  }
  
  // At this point, pageConfig is a valid PageConfig object
  if (!pageConfig.isPublished) {
     return (
      <div className="text-center py-20">
        <AlertTriangle className="mx-auto h-24 w-24 text-amber-500 mb-6" />
        <h1 className="text-4xl font-bold font-headline mb-4">Page Not Published</h1>
        <p className="text-muted-foreground mb-8">This page exists but is not currently published. Please check back later or contact an administrator.</p>
        <Button onClick={() => router.push('/')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go Back Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-5xl font-bold font-headline text-glow-primary text-center">{pageConfig.title}</h1>
      </header>

      {pageConfig.suggestedLayout && pageConfig.suggestedLayout.length > 0 ? (
        pageConfig.suggestedLayout.map((component) => (
          <RenderComponent key={component.id} component={component} />
        ))
      ) : (
        <TextContentBlock text="This page is under construction. Please add content via the admin panel."/>
      )}
    </div>
  );
}
