import * as pdfjsLib from 'pdfjs-dist';

// Security: Max allowed upload size (25MB) to protect against memory exhaustion
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Sanitizes extracted raw text from documents to strip dangerous control characters,
 * null bytes, and non-printable binary artifacts while preserving document structure.
 */
export function sanitizeDocumentText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Remove null bytes and non-printable control chars (except standard \t, \n, \r)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode line separators
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive consecutive empty lines
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

/**
 * Extracts plain text from a File object (supports .pdf and .txt).
 * Includes security file size validation and safe fallback decoding.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for text extraction.');
  }

  // Security guard: Check file size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of 25MB.`);
  }

  const fileType = file.name.split('.').pop()?.toLowerCase() || '';

  if (fileType === 'txt') {
    const raw = await file.text();
    return sanitizeDocumentText(raw);
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
          .map((item: any) => (typeof item === 'object' && item && 'str' in item ? String(item.str) : ''))
          .filter(Boolean)
          .join(' ');
        fullText += (i > 1 ? '\n\n' : '') + pageText;
      }

      if (fullText.trim().length > 0) {
        return sanitizeDocumentText(fullText);
      }
    } catch (pdfErr) {
      console.warn('PDF parsing with pdfjs-dist encountered an issue, trying safe stream fallback:', pdfErr);
    }

    // Safe fallback text extraction for PDF text streams
    try {
      const text = await file.text();
      const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
      if (clean.length > 50) {
        return sanitizeDocumentText(clean);
      }
    } catch (e) {
      console.warn('Fallback stream text extraction failed:', e);
    }
  }

  // Generic safe text reader
  const genericText = await file.text();
  return sanitizeDocumentText(genericText);
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
