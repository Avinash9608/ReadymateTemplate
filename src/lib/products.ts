
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'new' | 'old';
  imageUrl: string;
  slug: string;
  features?: string[];
  dimensions?: string;
  material?: string;
  dataAiHint?: string; // For placeholder image AI hint
};

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Quantum Entanglement Sofa',
    slug: 'quantum-entanglement-sofa',
    description: 'A sofa that exists in multiple states of comfort simultaneously. Upholstered in advanced nano-fabric.',
    price: 2999.99,
    category: 'Living Room',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'futuristic sofa',
    features: ['Self-cleaning nano-fabric', 'Adjustable firmness zones', 'Integrated ambient lighting'],
    dimensions: '220cm W x 100cm D x 85cm H',
    material: 'Nano-fabric, Carbon Fiber Frame',
  },
  {
    id: '2',
    name: 'Nebula SmartBed',
    slug: 'nebula-smartbed',
    description: 'Experience sleep like never before with personalized climate control, dream recording, and anti-gravity suspension.',
    price: 4500.00,
    category: 'Bedroom',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'smart bed',
    features: ['AI-powered sleep tracking', 'Zero-gravity mode', 'Holographic star projector'],
    dimensions: 'King Size: 193cm W x 203cm L',
    material: 'Memory Foam, Aerospace Aluminum',
  },
  {
    id: '3',
    name: 'ChronoLuxe Armchair',
    slug: 'chronoluxe-armchair',
    description: 'A timeless design with a futuristic twist. Features bio-feedback sensors for optimal ergonomic support.',
    price: 1250.50,
    category: 'Living Room',
    status: 'old',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'luxury armchair',
    features: ['Bio-adaptive lumbar support', 'Integrated charging ports', 'Temperature-regulating fabric'],
    dimensions: '80cm W x 90cm D x 110cm H',
    material: 'Recycled Leather, Polished Chrome',
  },
  {
    id: '4',
    name: 'AeroGlide Office Chair',
    slug: 'aeroglide-office-chair',
    description: 'Float through your workday with this ergonomically advanced office chair. Features magnetic levitation for smooth adjustments.',
    price: 799.00,
    category: 'Office',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'office chair',
    features: ['Magnetic height adjustment', 'Ventilated mesh back', 'Dynamic posture support'],
    dimensions: '65cm W x 60cm D x 120-135cm H',
    material: 'Performance Mesh, Titanium Alloy',
  },
  {
    id: '5',
    name: 'Lumina Glow Coffee Table',
    slug: 'lumina-glow-coffee-table',
    description: 'A coffee table that doubles as an interactive light display. Control patterns and colors with a simple gesture.',
    price: 650.00,
    category: 'Living Room',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'glowing table',
    features: ['Interactive LED surface', 'Wireless charging spots', 'Scratch-resistant smart glass'],
    dimensions: '120cm L x 60cm W x 45cm H',
    material: 'Smart Glass, Anodized Aluminum',
  },
  {
    id: '6',
    name: 'Echo Minimalist Wardrobe',
    slug: 'echo-minimalist-wardrobe',
    description: 'A sleek, handle-less wardrobe with voice-activated doors and an AI stylist assistant.',
    price: 2200.00,
    category: 'Bedroom',
    status: 'old',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'minimalist wardrobe',
    features: ['Voice control', 'AI outfit suggestions', 'Self-organizing compartments'],
    dimensions: '180cm W x 60cm D x 240cm H',
    material: 'Matte Finish Composite, Carbon Fiber Accents',
  },
  {
    id: '7',
    name: 'Nova Smart Desk Pro',
    slug: 'nova-smart-desk-pro',
    description: 'The ultimate productivity hub with an integrated transparent display, biometric scanner, and customizable height settings.',
    price: 1899.99,
    category: 'Office',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'smart desk pro',
    features: ['Transparent OLED display', 'Biometric security', 'Automated sit/stand modes'],
    dimensions: '150cm W x 75cm D x 70-120cm H',
    material: 'Reinforced Glass, Aircraft-grade Aluminum',
  },
  {
    id: '8',
    name: 'Orion Modular Bookshelf',
    slug: 'orion-modular-bookshelf',
    description: 'A versatile bookshelf system that can be reconfigured to suit any space. Magnetic connectors for easy assembly.',
    price: 950.00,
    category: 'Living Room',
    status: 'new',
    imageUrl: 'https://placehold.co/800x600.png',
    dataAiHint: 'modular bookshelf',
    features: ['Magnetic modular units', 'Integrated LED strip lighting', 'Anti-gravity bookends (optional)'],
    dimensions: 'Variable; Each cube 40cm x 40cm x 40cm',
    material: 'Sustainable Bamboo Composite, Neodymium Magnets',
  }
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return mockProducts.find(p => p.slug === slug);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  const categoryName = categorySlug.replace('-', ' '); // simple slug to name
  return mockProducts.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
};
