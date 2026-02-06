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
      Toda a sua resposta deve estar obrigatoriamente em PORTUGUÊS.
      
      CRITÉRIOS CEBRASPE PARA TEMAS:
      1. Os temas devem ser atuais e vinculados ao conteúdo técnico fornecido.
      2. Devem incluir obrigatoriamente 3 aspectos específicos (tópicos 1, 2 e 3) para o candidato abordar.`,
      prompt: `Baseado no conteúdo fornecido, sugira EXATAMENTE 3 temas prováveis. 
      Responda tudo em PORTUGUÊS.
      
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
  scoresByAspect: z.array(z.object({
    aspect: z.string(),
    score: z.number(),
    maxScore: z.number(),
    feedback: z.string(),
  })),
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
      Sua correção deve ser rigorosa e técnica. A pontuação máxima permitida é ${input.maxScore}.
      Responda SEMPRE em PORTUGUÊS.`,
      prompt: `Avalie a seguinte redação e forneça notas detalhadas por aspecto abordado. 
      TEMA: "${input.topic}"
      REDAÇÃO DO CANDIDATO: 
      "${input.essay}"

      REGRAS DE RESPOSTA (JSON APENAS, EM PORTUGUÊS):
      1. "finalScore" deve ser a soma exata das notas dos aspectos.
      2. "feedback" deve ser uma STRING com a avaliação geral (EM PORTUGUÊS).
      3. "strengths" e "weaknesses" devem ser ARRAYS de strings (EM PORTUGUÊS).
      4. "detailedAnalysis" deve ser uma análise técnica minuciosa (EM PORTUGUÊS).
      5. "scoresByAspect" DEVE conter a pontuação dividida pelos 3 tópicos/aspectos principais solicitados no tema.

      ESTRUTURA OBRIGATÓRIA (RESPOSTA EM PORTUGUÊS):
      {
        "finalScore": ${input.maxScore / 2},
        "feedback": "Sua avaliação macroestrutural em português...",
        "strengths": ["ponto 1", "ponto 2"],
        "weaknesses": ["melhoria 1", "melhoria 2"],
        "detailedAnalysis": "Sua análise técnica em português...",
        "scoresByAspect": [
          { "aspect": "Descrição do Aspecto 1", "score": 10, "maxScore": 15, "feedback": "Comentário sobre este ponto" },
          { "aspect": "Descrição do Aspecto 2", "score": 8, "maxScore": 15, "feedback": "Comentário sobre este ponto" },
          { "aspect": "Descrição do Aspecto 3", "score": 12, "maxScore": 20, "feedback": "Comentário sobre este ponto" }
        ]
      }`,
      schema: CorrectEssayOutputSchema,
    });
  }
);
