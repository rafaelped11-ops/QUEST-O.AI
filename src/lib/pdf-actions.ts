
'use server';

import pdf from 'pdf-parse';

/**
 * Server action to extract text from a PDF file.
 * Uses pdf-parse to read the content on the server side.
 */
export async function extractTextFromPdf(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado.');

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);
    
    // Basic cleaning of the extracted text
    return data.text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha ao processar o documento PDF.');
  }
}
