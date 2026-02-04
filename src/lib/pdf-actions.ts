
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
    
    // Processamento do PDF no servidor
    const data = await pdf(buffer);
    
    if (!data || !data.text) {
      throw new Error("O documento não contém texto legível.");
    }

    // Limpeza básica e normalização do texto extraído
    return data.text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error: any) {
    console.error('Erro na extração de PDF:', error.message);
    throw new Error('Falha ao processar o documento PDF. Verifique se o arquivo não está protegido por senha.');
  }
}
