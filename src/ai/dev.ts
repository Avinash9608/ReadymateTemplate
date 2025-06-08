import { config } from 'dotenv';
config();

import '@/ai/flows/product-recommendation.ts';
import '@/ai/flows/page-layout-suggestion.ts'; // Added import for the new flow
