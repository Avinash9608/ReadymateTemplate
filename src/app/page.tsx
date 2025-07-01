"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import ProductRecommendations from "@/components/ai/ProductRecommendations";
import { ArrowRight, Zap, Loader2, AlertTriangle } from "lucide-react";
import type { Product } from '@/lib/products';
import { useSettings, type PageConfig, type PageComponent as PageComponentType } from '@/contexts/SettingsContext';

interface CategoryType {
  name: string;
  slug: string;
  imageUrl: string;
  dataAiHint?: string;
}

// --- Dynamic Components for Home Page ---
const HeroBlock = ({ title, subtitle }: { title?: string, subtitle?: string }) => (
  <section className="relative py-12 md:py-20 overflow-hidden">
    <div className="absolute inset-0 opacity-10 dark:opacity-5"></div>
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="md:pr-12">
          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-glow-primary">
            {title || "Welcome to FurnishVerse"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8">
            {subtitle || "Discover furniture that blends cutting-edge design with futuristic technology. Elevate your space."}
          </p>
          <Link href="/products">
            <Button size="lg" className="group">
              Explore Collection{" "}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        <div className="relative h-64 md:h-auto md:min-h-[400px]">
          <Image
            src="https://www.ironplane.com/hubfs/phillip-goldsberry-fZuleEfeA1Q-unsplash.jpg"
            alt="Futuristic Living Room"
            data-ai-hint="futuristic interior"
            layout="fill"
            objectFit="cover"
            className="rounded-lg shadow-2xl transform md:rotate-3 transition-transform duration-500 hover:rotate-0"
            priority
          />
        </div>
      </div>
    </div>
  </section>
);

const TextContentBlock = ({ text }: { text?: string }) => (
  <div className="prose dark:prose-invert max-w-none my-4 p-6 bg-card rounded-lg shadow">
    <p>{text || "This is a placeholder for rich text content."}</p>
  </div>
);

const ContactFormBlock = ({ title, fields }: { title?: string, fields?: {name: string, label: string, type: string, placeholder?: string}[] }) => {
  const defaultFields = [
    { name: "name", label: "Name", type: "text", placeholder: "Your Name" },
    { name: "email", label: "Email", type: "email", placeholder: "Your Email" },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "Your Phone Number (Optional)" },
    { name: "message", label: "Message", type: "textarea", placeholder: "Your Message" },
  ];
  const formFieldsToRender = fields && fields.length > 0 ? fields : defaultFields;

  return (
    <div className="my-4 p-6 bg-card rounded-lg shadow">
      <h3 className="text-2xl font-semibold mb-4">{title || "Contact Us"}</h3>
      <form className="space-y-4">
        {formFieldsToRender.map(field => (
          <div key={field.name}>
            <label htmlFor={`form-${field.name}`} className="block text-sm font-medium mb-1">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea id={`form-${field.name}`} placeholder={field.placeholder} className="w-full p-2 border rounded" />
            ) : (
              <input id={`form-${field.name}`} type={field.type} placeholder={field.placeholder} className="w-full p-2 border rounded" />
            )}
          </div>
        ))}
        <Button type="button">Send Message</Button>
      </form>
    </div>
  );
};

const MapBlock = ({ address }: { address?: string }) => (
  <div className="my-4 p-6 bg-card rounded-lg shadow flex flex-col items-center justify-center aspect-video">
    <h3 className="text-2xl font-semibold mb-2">Map Placeholder</h3>
    {address && <p className="text-muted-foreground mb-2">Location: {address}</p>}
    <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground">
      [Google Maps Embed Placeholder for: {address || 'Default Location'}]
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
    )) : <p className="text-muted-foreground">No FAQ items defined. Add them via admin.</p>}
  </div>
);

const ImageBlock = ({ src, alt }: { src?: string, alt?: string }) => (
   <div className="my-4 rounded-lg shadow overflow-hidden aspect-video bg-muted flex items-center justify-center">
    {src ? (
      <Image src={src} alt={alt || "Displayed image"} data-ai-hint={alt || "custom page image"} width={800} height={450} className="object-cover w-full h-full" />
    ) : (
      <p className="text-muted-foreground">Image Placeholder - Add URL via admin</p>
    )}
  </div>
);

const ButtonBlock = ({ text, link }: { text?: string, link?: string }) => (
  <div className="my-4 text-center">
    <Button asChild={!!link} disabled={!text} size="lg">
      {link ? <Link href={link}>{text || "Button Placeholder"}</Link> : <span>{text || "Button Placeholder"}</span>}
    </Button>
  </div>
);

const ProductGridBlock = () => (
  <div className="my-4 p-6 bg-card rounded-lg shadow">
    <h3 className="text-2xl font-semibold mb-4">Product Grid (Placeholder)</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <div key={i} className="border p-4 rounded bg-muted text-center">Product Placeholder {i}</div>)}
    </div>
  </div>
);

const TestimonialSliderBlock = () => (
  <div className="my-4 p-6 bg-card rounded-lg shadow text-center">
    <h3 className="text-2xl font-semibold mb-4">Testimonials (Placeholder)</h3>
    <p className="italic text-muted-foreground">"This is a great product!" - Happy Customer (Placeholder)</p>
  </div>
);

const CallToActionBlock = ({ title, text, buttonText, buttonLink }: { title?: string, text?: string, buttonText?: string, buttonLink?: string }) => (
  <section className="py-12 bg-primary/10 rounded-lg shadow-md my-4">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl font-bold font-headline text-primary mb-3">{title || "Call to Action!"}</h2>
      <p className="text-lg text-foreground mb-6">{text || "Don't miss out on this amazing opportunity. Configure this text."}</p>
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

// Default Home Page Content (fallback)
function DefaultHomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedProducts, fetchedCategoryNames] = await Promise.all([
          fetch('/api/products?limit=3&status=new').then(res => res.json()),
          fetch('/api/categories').then(res => res.json()),
        ]);
        setFeaturedProducts(fetchedProducts);
        setCategories(fetchedCategoryNames);
      } catch (err: any) {
        console.error("Failed to load homepage data:", err);
        setError(err.message || "Failed to load data. Please try again later.");
        setFeaturedProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        <AlertTriangle className="mx-auto h-16 w-16 mb-4" />
        <p className="text-xl font-semibold">Error Loading Page</p>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <HeroBlock />

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">
          Featured Products
        </h2>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
              >
                <CardHeader className="p-0">
                  <Image
                    src={
                      product.imageUrl ||
                      `https://placehold.co/600x400.png?text=No+Image`
                    }
                    alt={product.name}
                    data-ai-hint={
                      product.dataAiHint ||
                      product.name.split(" ").slice(0, 2).join(" ")
                    }
                    width={600}
                    height={400}
                    className="object-cover w-full h-64 group-hover:scale-105 transition-transform duration-300"
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  <CardTitle className="font-headline text-xl mb-1">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-primary font-semibold text-lg">
                    ${product.price.toFixed(2)}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Link href={`/products/${product.slug}`} className="w-full">
                    <Button variant="outline" className="w-full group">
                      View Details{" "}
                      <Zap className="ml-2 h-4 w-4 text-accent group-hover:animate-neon-pulse" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            No featured products available at the moment. Check back soon!
          </p>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">
          Shop by Category
        </h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
              >
                <div className="relative rounded-lg overflow-hidden group aspect-video cursor-pointer">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    data-ai-hint={
                      category.dataAiHint || category.name.toLowerCase()
                    }
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-110 transition-transform duration-500 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <h3 className="text-2xl font-headline font-bold text-white text-glow-accent">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            No categories available at the moment.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-headline font-semibold mb-8 text-center">
          Just For You
        </h2>
        <ProductRecommendations />
      </section>
    </div>
  );
}

export default function HomePage() {
  const { getPageBySlug, isLoading: settingsLoading } = useSettings();
  const [homePageConfig, setHomePageConfig] = useState<PageConfig | null | 'loading'>('loading');

  useEffect(() => {
    if (settingsLoading) {
      setHomePageConfig('loading');
      return;
    }
    // Check for a home page configuration
    const homePage = getPageBySlug('home') || getPageBySlug('/');
    setHomePageConfig(homePage || null);
  }, [getPageBySlug, settingsLoading]);

  if (homePageConfig === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a configured home page, render it dynamically
  if (homePageConfig && homePageConfig.isPublished) {
    return (
      <div className="space-y-8">
        {homePageConfig.suggestedLayout && homePageConfig.suggestedLayout.length > 0 ? (
          homePageConfig.suggestedLayout.map((component) => (
            <RenderComponent key={component.id} component={component} />
          ))
        ) : (
          <TextContentBlock text="This home page is under construction. Please add content via the admin panel."/>
        )}
      </div>
    );
  }

  // Fallback to default home page
  return <DefaultHomePage />;
}
