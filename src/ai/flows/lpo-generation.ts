
'use server';

/**
 * @fileOverview An AI-powered Local Purchase Order (LPO) generation flow.
 *
 * - generateLpo - A function that analyzes low-stock items and vendor data to generate an LPO.
 */

import {ai} from '@/ai/genkit';
import { GenerateLpoInputSchema, GenerateLpoOutputSchema, type GenerateLpoInput, type GenerateLpoOutput } from '@/lib/types';


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
