'use server';

/**
 * @fileOverview An AI-powered Local Purchase Order (LPO) generation flow.
 *
 * - generateLpo - A function that analyzes low-stock items and vendor data to generate an LPO.
 * - GenerateLpoInput - The input type for the generateLpo function.
 * - GenerateLpoOutput - The return type for the generateLpo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single low-stock item
const LowStockItemSchema = z.object({
  id: z.string().describe('The unique item code.'),
  name: z.string().describe('The name of the item.'),
  quantity: z.number().describe('The current stock quantity.'),
  reorderLevel: z.number().describe('The reorder level for the item.'),
  usageHistory: z.array(z.object({
    date: z.string(),
    quantity: z.number(),
  })).describe('Last 30 days of usage history.'),
});

// Define the schema for a single vendor
const VendorSchema = z.object({
  id: z.string().describe('The unique vendor ID.'),
  name: z.string().describe('The name of the vendor.'),
  supplies: z.array(z.string()).describe('An array of item IDs that this vendor supplies.'),
});

// Define the input schema for the LPO generation flow
export const GenerateLpoInputSchema = z.object({
  lowStockItems: z.array(LowStockItemSchema).describe('A list of items that are below their reorder level.'),
  vendors: z.array(VendorSchema).describe('A list of available vendors.'),
});
export type GenerateLpoInput = z.infer<typeof GenerateLpoInputSchema>;

// Define the schema for a single item within the generated LPO
const LpoItemSchema = z.object({
  itemId: z.string().describe('The ID of the item to order.'),
  itemName: z.string().describe('The name of the item.'),
  quantityToOrder: z.number().describe('The suggested quantity to order based on usage and stock levels.'),
  selectedVendorId: z.string().describe('The ID of the recommended vendor for this item.'),
  reasoning: z.string().describe('A brief justification for the recommended quantity and vendor choice.'),
});

// Define the output schema for the LPO generation flow
export const GenerateLpoOutputSchema = z.object({
  lpoId: z.string().describe('A generated unique ID for the LPO, e.g., LPO-YYYYMMDD-XXXX.'),
  generatedDate: z.string().describe('The ISO date string for when the LPO was generated.'),
  items: z.array(LpoItemSchema).describe('The list of items to be included in the LPO.'),
  summary: z.string().describe('A brief overall summary of the generated LPO.'),
});
export type GenerateLpoOutput = z.infer<typeof GenerateLpoOutputSchema>;

// The main exported function that clients will call
export async function generateLpo(input: GenerateLpoInput): Promise<GenerateLpoOutput> {
  return lpoGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lpoGenerationPrompt',
  input: {schema: GenerateLpoInputSchema},
  output: {schema: GenerateLpoOutputSchema},
  prompt: `You are an AI assistant for a pharmacy responsible for generating Local Purchase Orders (LPOs).
  Your task is to analyze a list of low-stock items and a list of available vendors to create an optimized purchase order.

  **Analysis Criteria:**
  1.  **Order Quantity:** For each item, recommend an order quantity. This should be enough to get back above the reorder level, considering the recent usage history. A simple rule is to order enough to last for another 30-60 days based on recent average daily usage.
  2.  **Vendor Selection:** For each item, you must select the best vendor from the provided list. A vendor can only be selected for an item if they supply it (check the vendor's 'supplies' array). If multiple vendors supply the same item, you can choose one, but try to consolidate orders with fewer vendors if possible to simplify logistics.
  3.  **Reasoning:** Briefly explain your choice of quantity and vendor for each item.
  4.  **LPO Details:** Generate a unique LPO ID and provide a high-level summary of the order.

  **Input Data:**

  **Low-Stock Items:**
  {{#each lowStockItems}}
  - Item: {{name}} (ID: {{id}})
    - Current Quantity: {{quantity}}
    - Reorder Level: {{reorderLevel}}
    - 30-Day Usage: {{#each usageHistory}}Used {{quantity}} on {{date}}; {{/each}}
  {{/each}}

  **Available Vendors:**
  {{#each vendors}}
  - Vendor: {{name}} (ID: {{id}})
    - Supplies Item IDs: {{#each supplies}}{{.}}, {{/each}}
  {{/each}}

  Please generate the LPO in the required JSON format.
`,
});

const lpoGenerationFlow = ai.defineFlow(
  {
    name: 'lpoGenerationFlow',
    inputSchema: GenerateLpoInputSchema,
    outputSchema: GenerateLpoOutputSchema,
  },
  async input => {
    // In a real application, you might add more logic here,
    // like checking for preferred vendors, contract pricing, etc.
    const {output} = await prompt(input);
    return output!;
  }
);
