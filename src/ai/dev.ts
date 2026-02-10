
import { config } from 'dotenv';

// Load .env.local to make sure the Gemini API key is available for Genkit.
// Next.js automatically handles this for the main app, but the genkit script needs it explicitly.
config({ path: '.env.local' });
config();
    
