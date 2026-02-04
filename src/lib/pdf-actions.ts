
'use server';

import pdf from 'pdf-parse';

/**
 * Server action para extrair texto de um arquivo PDF.
 */
export async function extractTextFromPdf(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado para o servidor.');

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Processamento do PDF no servidor usando pdf-parse
    const data = await pdf(buffer);
    
    if (!data || !data.text) {
      throw new Error("O PDF parece estar vazio ou não contém texto extraível.");
    }

    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 10) {
      throw new Error("O texto extraído é insuficiente para gerar questões.");
    }

    return cleanedText;
  } catch (error: any) {
    console.error('Erro na extração de PDF:', error);
    // Retornamos a mensagem de erro real para o cliente
    const errorMsg = error?.message || 'Erro desconhecido ao processar o arquivo';
    throw new Error(`Falha ao ler PDF: ${errorMsg}`);
  }
}
