
import { config } from 'dotenv';
config();

// Registro de todos os fluxos para o ambiente de desenvolvimento do Genkit
import './flows/generate-questions-from-pdf';
import './flows/parse-manual-questions';
import './flows/essay-training-flows';
import './flows/adjust-question-difficulty';
import './flows/generate-questions-from-topic';
import './flows/summarize-study-material';
