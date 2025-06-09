
'use server';
/**
 * @fileOverview A Genkit flow to generate a product image using AI.
 *
 * - generateProductImage - A function that calls the product image generation flow.
 * - GenerateProductImageInput - The input type for the flow.
 * - GenerateProductImageOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const GenerateProductImageInputSchema = z.object({
  productName: z.string().describe('The name of the product for which to generate an image.'),
  dataAiHint: z.string().optional().describe('Optional keywords or hints to guide the image generation (e.g., "modern style", "wooden texture").'),
});
export type GenerateProductImageInput = z.infer<typeof GenerateProductImageInputSchema>;

// Define the output schema
const GenerateProductImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>' or a placeholder URL."),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

// Exported function to call the flow
export async function generateProductImage(
  input: GenerateProductImageInput
): Promise<GenerateProductImageOutput> {
  console.log("[Flow Call] generateProductImage called with input:", JSON.stringify(input));
  return generateProductImageFlow(input);
}

// Define the Genkit flow
const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async (input) => {
    const placeholderOnError = `https://placehold.co/600x400.png?text=AI+Gen+Error`;
    console.log(`[Flow Execution] Attempting to generate image for: "${input.productName}", hint: "${input.dataAiHint || 'None'}"`);
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // MUST use this model for image generation
        prompt: `Generate an e-commerce product image for a product named "${input.productName}". ${input.dataAiHint ? `Consider these hints: "${input.dataAiHint}".` : ''} The image should be clean, well-lit, and suitable for a product listing on a website. Focus on the product itself. Avoid text overlays unless specifically part of the product design.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
        },
      });

      // Log the entire media object to understand its structure, especially on failure.
      console.log("[Flow Execution] AI generate call completed. Media object received:", JSON.stringify(media, null, 2));

      if (media && media.url && media.url.startsWith('data:image')) {
        console.log("[Flow Execution] Successfully generated image. Data URI starts with 'data:image'.");
        return { imageDataUri: media.url };
      } else {
        console.warn("[Flow Execution] AI image generation returned no valid media URL or not a data URI. Media URL:", media?.url, "Using placeholder.");
        return { imageDataUri: `https://placehold.co/600x400.png?text=AI+Img+Invalid` }; // More specific placeholder
      }
    } catch (error: any) {
      // Enhanced error logging
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("[Flow Execution] CRITICAL ERROR in generateProductImageFlow during AI call.");
      console.error("Input that caused error:", JSON.stringify(input));
      console.error("Error Message:", error.message);
      console.error("Error Name:", error.name);
      if (error.stack) {
        console.error("Error Stack:", error.stack);
      }
      // Attempt to log the full error object by iterating its properties
      // as JSON.stringify might miss non-enumerable properties or circular structures.
      let fullErrorDetails = {};
      if (typeof error === 'object' && error !== null) {
        Object.getOwnPropertyNames(error).forEach(key => {
          // @ts-ignore
          fullErrorDetails[key] = error[key];
        });
      }
      console.error("Full Error Object (properties):", JSON.stringify(fullErrorDetails, null, 2));
      
      // Specific checks for Google AI / Genkit related error structures
      if (error.details) console.error("Error Details (from error object, if any):", JSON.stringify(error.details, null, 2));
      if (error.cause) console.error("Error Cause (from error object, if any):", JSON.stringify(error.cause, null, 2));
      
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      return { imageDataUri: placeholderOnError };
    }
  }
);

