
import { config } from 'dotenv';
config();

// Registro de todos os fluxos para o ambiente de desenvolvimento do Genkit
import '@/ai/flows/generate-questions-from-pdf';
import '@/ai/flows/parse-manual-questions';
import '@/ai/flows/essay-training-flows';
import '@/ai/flows/adjust-question-difficulty';
import '@/ai/flows/generate-questions-from-topic';
import '@/ai/flows/summarize-study-material';
