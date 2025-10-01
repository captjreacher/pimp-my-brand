// Text extraction utilities for various file types

export async function extractText(file: File): Promise<string> {
  const type = file.type;
  
  // Plain text files
  if (type === 'text/plain' || type === 'text/markdown') {
    return await file.text();
  }
  
  // For PDFs and other complex formats, we'll store and process server-side
  // For now, return placeholder - server will handle extraction
  if (type === 'application/pdf') {
    return `[PDF uploaded: ${file.name}. Text extraction pending...]`;
  }
  
  if (type.includes('word') || type.includes('document')) {
    return `[Document uploaded: ${file.name}. Text extraction pending...]`;
  }
  
  // Images - placeholder for OCR
  if (type.startsWith('image/')) {
    return `[Image uploaded: ${file.name}. OCR pending...]`;
  }
  
  return `[File uploaded: ${file.name}]`;
}

export function combineCorpus(texts: string[]): string {
  return texts.filter(Boolean).join('\n\n---\n\n');
}
