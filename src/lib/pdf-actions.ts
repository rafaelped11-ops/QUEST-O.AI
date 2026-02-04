
'use server';

import pdf from 'pdf-parse';

/**
 * Server action robusta para extrair texto de um arquivo PDF.
 * Inclui tratamento específico para erros de estrutura (bad XRef).
 */
export async function extractTextFromPdf(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Nenhum arquivo enviado para o servidor.');

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Tenta extrair o texto. Se falhar por erro de XRef, fornece orientação clara.
    const data = await pdf(buffer).catch((err: any) => {
      const msg = err?.message || '';
      if (msg.includes('XRef') || msg.includes('xref') || msg.includes('corrupt')) {
        throw new Error("Estrutura do PDF corrompida (bad XRef). Dica: Abra o arquivo no seu computador e 'Salve como PDF' ou 'Imprima como PDF' para corrigir a tabela de referências interna antes de enviar.");
      }
      throw err;
    });
    
    if (!data || !data.text) {
      throw new Error("Não foi possível extrair texto deste PDF. Verifique se o arquivo não contém apenas imagens (scans) sem OCR.");
    }

    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 50) {
      throw new Error("O texto extraído é muito curto para gerar questões de qualidade. Certifique-se de que o PDF contém conteúdo textual legível.");
    }

    return cleanedText;
  } catch (error: any) {
    console.error('Erro no processamento de PDF:', error);
    throw new Error(error.message || 'Falha crítica ao processar o documento PDF.');
  }
}
