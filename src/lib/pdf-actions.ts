'use server';

import pdf from 'pdf-parse';

/**
 * Server action para extrair texto de um documento PDF.
 */

export async function extractTextFromPdf(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado para o servidor.');

  // Limite de segurança para evitar estouro de memória no servidor
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('O arquivo PDF é muito grande (máximo 10MB).');
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const data = await pdf(buffer).catch((err: any) => {
      const msg = err?.message || '';
      if (msg.includes('XRef') || msg.includes('xref') || msg.includes('corrupt')) {
        throw new Error("PDF com estrutura corrompida (bad XRef). Dica: abra o arquivo no Chrome, clique em Imprimir e selecione 'Salvar como PDF' para corrigi-lo.");
      }
      throw err;
    });
    
    if (!data || !data.text) {
      throw new Error("Não foi possível extrair texto deste PDF.");
    }

    // Limpeza profunda do texto para o prompt
    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 50) {
      throw new Error("O texto extraído é insuficiente para gerar questões de qualidade.");
    }

    return cleanedText;
  } catch (error: any) {
    console.error('Erro fatal no processamento de PDF:', error);
    throw new Error(error.message || 'Erro inesperado ao processar o PDF no servidor.');
  }
}
