
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
  imageDataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateProductImageOutput = z.infer<typeof GenerateProductImageOutputSchema>;

// Exported function to call the flow
export async function generateProductImage(
  input: GenerateProductImageInput
): Promise<GenerateProductImageOutput> {
  return generateProductImageFlow(input);
}

// Define the prompt
const imageGenerationPrompt = ai.definePrompt({
  name: 'generateProductImagePrompt',
  input: {schema: GenerateProductImageInputSchema},
  output: {schema: GenerateProductImageOutputSchema},
  prompt: `Generate an e-commerce product image for a product named "{{productName}}".
  {{#if dataAiHint}}Keywords and hints: "{{dataAiHint}}"{{/if}}
  The image should be clean, well-lit, and suitable for a product listing on a website. Focus on the product itself. Avoid text overlays unless specifically part of the product design.
  Output format should be the image data URI in the 'imageDataUri' field.`,
});


// Define the Genkit flow
const generateProductImageFlow = ai.defineFlow(
  {
    name: 'generateProductImageFlow',
    inputSchema: GenerateProductImageInputSchema,
    outputSchema: GenerateProductImageOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // MUST use this model for image generation
        prompt: `Generate an e-commerce product image for a product named "${input.productName}". ${input.dataAiHint ? `Consider these hints: "${input.dataAiHint}".` : ''} The image should be clean, well-lit, and suitable for a product listing on a website. Focus on the product itself. Avoid text overlays.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
        },
      });

      if (media && media.url) {
        return { imageDataUri: media.url };
      } else {
        console.warn('AI image generation returned no media URL. Using placeholder.');
        return { imageDataUri: `https://placehold.co/600x400.png?text=AI+Error` };
      }
    } catch (error) {
      console.error("Error in generateProductImageFlow:", error);
      return { imageDataUri: `https://placehold.co/600x400.png?text=AI+Gen+Failed` };
    }
  }
);
