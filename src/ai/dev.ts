
import { config } from 'dotenv';
config();

// Registro de todos os fluxos para o ambiente de desenvolvimento do Genkit
import '@/ai/flows/generate-questions-from-pdf.ts';
import '@/ai/flows/parse-manual-questions.ts';
import '@/ai/flows/essay-training-flows.ts';
import '@/ai/flows/adjust-question-difficulty.ts';
import '@/ai/flows/generate-questions-from-topic.ts';
import '@/ai/flows/summarize-study-material.ts';
