import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts plain text from a File object (supports .pdf and .txt).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';

  if (fileType === 'txt') {
    return await file.text();
  }

  if (fileType === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += (i > 1 ? '\n\n' : '') + pageText;
      }

      if (fullText.trim().length > 0) {
        return fullText.trim();
      }
    } catch (pdfErr) {
      console.warn('PDF parsing with pdfjs-dist failed, attempting raw text extraction:', pdfErr);
    }

    // Fallback text extraction for PDF text streams
    try {
      const text = await file.text();
      const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
      if (clean.length > 50) {
        return clean;
      }
    } catch (e) {
      console.warn('Fallback stream text extraction failed:', e);
    }
  }

  // Generic text reader
  return await file.text();
}

/**
 * Extracts candidate name from the top lines of a resume text.
 */
export function extractCandidateNameFromResume(text: string): string | null {
  if (!text || text.trim().length === 0) return null;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    const cleaned = line.replace(/^(Name\s*:\s*|Candidate\s*:\s*|Resume\s*of\s*:?\s*)/i, '').trim();

    // Skip generic headers
    if (/^(resume|curriculum|cv|contact|summary|profile|email|phone|objective|experience|skills|education)/i.test(cleaned)) {
      continue;
    }

    const words = cleaned.split(/[\s,]+/);
    // Standard 2 to 4 word candidate name
    if (words.length >= 2 && words.length <= 4 && cleaned.length >= 4 && cleaned.length <= 36) {
      if (!/[0-9@/:;{}[\]()_+=*&^%$#]/.test(cleaned)) {
        return words
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  return null;
}
