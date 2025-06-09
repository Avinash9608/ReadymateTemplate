
import { config } from 'dotenv';
config();

import '@/ai/flows/product-recommendation.ts';
import '@/ai/flows/page-layout-suggestion-flow.ts';
import '@/ai/flows/generate-product-image-flow.ts'; // Added import for the new image generation flow

