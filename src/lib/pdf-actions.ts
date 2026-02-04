
'use server';

import pdf from 'pdf-parse';

/**
 * Server action robusta para extrair texto de um arquivo PDF.
 * Importante: Apenas funções assíncronas são exportadas aqui.
 */
export async function extractTextFromPdf(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado para o servidor.');

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Tenta extrair o texto com tratamento para erros de XRef
    const data = await pdf(buffer).catch((err: any) => {
      const msg = err?.message || '';
      if (msg.includes('XRef') || msg.includes('xref') || msg.includes('corrupt')) {
        throw new Error("Estrutura do PDF corrompida (bad XRef). Tente abrir o PDF e usar 'Imprimir como PDF' para corrigi-lo.");
      }
      throw err;
    });
    
    if (!data || !data.text) {
      throw new Error("Não foi possível extrair texto deste PDF.");
    }

    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 50) {
      throw new Error("O texto extraído é muito curto para gerar questões.");
    }

    return cleanedText;
  } catch (error: any) {
    console.error('Erro no processamento de PDF:', error);
    throw new Error(error.message || 'Falha ao processar o documento PDF.');
  }
}
