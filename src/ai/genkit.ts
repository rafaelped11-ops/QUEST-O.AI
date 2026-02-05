import { genkit } from 'genkit';

/**
 * Configuração central do Genkit v1.x.
 * Inicialização limpa sem plugins para evitar problemas de compatibilidade no Firebase App Hosting.
 */
export const ai = genkit({
  plugins: [],
});
