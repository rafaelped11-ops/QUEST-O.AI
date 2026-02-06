'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const SuggestTopicsOutputSchema = z.object({
  topics: z.array(z.string()).length(3),
});

export async function suggestEssayTopics(input: { content: string }) {
  return suggestEssayTopicsFlow(input);
}

const suggestEssayTopicsFlow = ai.defineFlow(
  {
    name: 'suggestEssayTopicsFlow',
    inputSchema: z.object({ content: z.string() }),
    outputSchema: SuggestTopicsOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: `Você é um especialista em sugerir temas de redação para concursos de alto nível, especificamente seguindo o padrão Cebraspe (Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos).
      
      CRITÉRIOS CEBRASPE PARA TEMAS:
      1. Os temas devem ser atuais e vinculados ao conteúdo técnico fornecido.
      2. Devem ser estruturados como uma proposta de redação discursiva.
      3. Devem incluir aspectos específicos para o candidato abordar (tópicos 1, 2 e 3).`,
      prompt: `Baseado no conteúdo técnico extraído do PDF abaixo, sugira EXATAMENTE 3 temas prováveis para uma prova discursiva desafiadora. Cada tema deve ser uma frase curta e impactante que represente o assunto principal:\n\n${input.content}`,
      schema: SuggestTopicsOutputSchema,
    });
  }
);

const CorrectEssayOutputSchema = z.object({
  finalScore: z.number(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  detailedAnalysis: z.string(),
});

export async function correctEssay(input: { topic: string; essay: string; maxScore: number }) {
  return correctEssayFlow(input);
}

const correctEssayFlow = ai.defineFlow(
  {
    name: 'correctEssayFlow',
    inputSchema: z.object({
      topic: z.string(),
      essay: z.string(),
      maxScore: z.number(),
    }),
    outputSchema: CorrectEssayOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: `Você é um corretor especializado em bancas de concurso de alto nível, como Cebraspe, FCC e FGV.
      A pontuação máxima para esta prova é ${input.maxScore}.
      
      CRITÉRIOS DE AVALIAÇÃO:
      - Apresentação e legibilidade.
      - Aspectos macroestruturais (desenvolvimento do tema, coerência e coesão).
      - Aspectos microestruturais (gramática, pontuação, ortografia e concordância).
      - Rigor técnico em relação ao tema proposto.`,
      prompt: `Avalie a seguinte redação.
      TEMA PROPOSTO: "${input.topic}"
      PONTUAÇÃO MÁXIMA: ${input.maxScore}
      
      TEXTO DO CANDIDATO:
      ${input.essay}`,
      schema: CorrectEssayOutputSchema,
    });
  }
);
