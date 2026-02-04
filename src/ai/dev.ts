import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-study-material.ts';
import '@/ai/flows/generate-questions-from-topic.ts';
import '@/ai/flows/adjust-question-difficulty.ts';