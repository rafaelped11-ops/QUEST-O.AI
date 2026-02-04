
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-questions-from-pdf.ts';
import '@/ai/flows/parse-manual-questions.ts';
import '@/ai/flows/essay-training-flows.ts';
