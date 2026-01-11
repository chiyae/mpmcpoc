'use server';

/**
 * @fileOverview An AI-powered stock level prediction flow.
 *
 * - predictStockLevel - A function that predicts stock levels and triggers alerts.
 * - PredictStockLevelInput - The input type for the predictStockLevel function.
 * - PredictStockLevelOutput - The return type for the predictStockLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictStockLevelInputSchema = z.object({
  itemName: z.string().describe('The name of the item to predict stock level for.'),
  currentStockQuantity: z.number().describe('The current stock quantity of the item.'),
  reorderLevel: z.number().describe('The reorder level of the item.'),
  usageHistory: z.array(z.object({
    date: z.string().describe('The date of usage.'),
    quantity: z.number().describe('The quantity used on that date.'),
  })).describe('The historical usage data for the item.'),
});

export type PredictStockLevelInput = z.infer<typeof PredictStockLevelInputSchema>;

const PredictStockLevelOutputSchema = z.object({
  shouldReorder: z.boolean().describe('Whether the item should be reordered based on predicted stock levels.'),
  predictedStockLevel: z.number().describe('The predicted stock level in a week.'),
  reason: z.string().describe('The reasoning behind the reorder recommendation.'),
});

export type PredictStockLevelOutput = z.infer<typeof PredictStockLevelOutputSchema>;

export async function predictStockLevel(input: PredictStockLevelInput): Promise<PredictStockLevelOutput> {
  return predictStockLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStockLevelPrompt',
  input: {schema: PredictStockLevelInputSchema},
  output: {schema: PredictStockLevelOutputSchema},
  prompt: `You are an AI assistant that predicts stock levels for dispensary items and recommends reordering when necessary.

  Analyze the following data to determine if a reorder is needed for the item: {{itemName}}.

Current Stock Quantity: {{currentStockQuantity}}
Reorder Level: {{reorderLevel}}
Usage History:
{{#each usageHistory}}
- Date: {{date}}, Quantity Used: {{quantity}}
{{/each}}

Consider factors like current stock, reorder level, usage history, and potential fluctuations in demand.

Based on your analysis, determine if a reorder is necessary. Also estimate the stock level in a week.

Output in JSON format:
{
  "shouldReorder": true/false, //true if reorder is needed, false otherwise
  "predictedStockLevel": number, //predicted stock level in a week
  "reason": "string" // Explanation for the recommendation. e.g., "Reorder is recommended because the current stock is below the reorder level and the usage history shows a consistent demand."
}
`,
});

const predictStockLevelFlow = ai.defineFlow(
  {
    name: 'predictStockLevelFlow',
    inputSchema: PredictStockLevelInputSchema,
    outputSchema: PredictStockLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
