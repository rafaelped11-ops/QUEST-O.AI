'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const SuggestTopicsOutputSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    aspects: z.array(z.string()).describe("Lista de 3 aspectos específicos para o candidato abordar."),
  })).length(3),
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
      system: `Você é um especialista em sugerir temas de redação para concursos de alto nível, especificamente seguindo o padrão Cebraspe.
      
      CRITÉRIOS CEBRASPE PARA TEMAS:
      1. Os temas devem ser atuais e vinculados ao conteúdo técnico fornecido.
      2. Devem incluir obrigatoriamente 3 aspectos específicos (tópicos 1, 2 e 3) para o candidato abordar.`,
      prompt: `Baseado no conteúdo fornecido, sugira EXATAMENTE 3 temas prováveis. 
      
      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "topics": [
          {
            "title": "Título do Tema",
            "aspects": ["Aspecto 1", "Aspecto 2", "Aspecto 3"]
          }
        ]
      }

      CONTEÚDO:
      ${input.content}`,
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
      system: `Você é um corretor especializado em bancas de concurso (como Cebraspe, FCC, FGV). 
      Sua correção deve ser rigorosa e técnica. A pontuação máxima permitida é ${input.maxScore}.`,
      prompt: `Avalie a seguinte redação. 
      TEMA: "${input.topic}"
      REDAÇÃO DO CANDIDATO: 
      "${input.essay}"

      REGRAS DE RESPOSTA (JSON APENAS):
      1. "finalScore" deve ser um número entre 0 e ${input.maxScore}.
      2. "feedback" deve ser uma STRING curta com a avaliação geral.
      3. "strengths" deve ser um ARRAY de strings com pontos fortes.
      4. "weaknesses" deve ser um ARRAY de strings com pontos fracos.
      5. "detailedAnalysis" deve ser uma STRING longa com a análise detalhada.

      ESTRUTURA OBRIGATÓRIA:
      {
        "finalScore": ${input.maxScore / 2},
        "feedback": "Texto da avaliação geral",
        "strengths": ["ponto 1", "ponto 2"],
        "weaknesses": ["melhoria 1", "melhoria 2"],
        "detailedAnalysis": "Análise técnica completa..."
      }`,
      schema: CorrectEssayOutputSchema,
    });
  }
);
