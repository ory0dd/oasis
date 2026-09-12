import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Cache worker initialization
let isWorkerReady = false;
let workerInitPromise = null;

// Official CDN worker matching installed pdfjs-dist version
const CDN_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;

/**
 * Initializes the PDF.js worker with high resilience.
 * Solves the issue where LiteSpeed / Apache / Hostinger serves .mjs as 'text/plain',
 * causing browsers to reject module worker instantiation.
 */
async function ensureWorkerConfigured() {
    if (isWorkerReady) return;
    if (typeof window === 'undefined' || !pdfjsLib.GlobalWorkerOptions) return;

    // Strategy 1: Use static worker with .js extension from /pdf.worker.min.js.
    // Apache/LiteSpeed/Hostinger ALREADY serve .js files with valid JavaScript MIME type natively!
    try {
        const checkLocal = await fetch('/pdf.worker.min.js', { method: 'HEAD' });
        if (checkLocal.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            isWorkerReady = true;
            return;
        }
    } catch {
        // Continue to Strategy 2
    }

    // Strategy 2: Fetch the local bundled worker and wrap it in an in-memory Blob with
    // explicit 'application/javascript' MIME type.
    try {
        const response = await fetch(pdfWorkerUrl);
        if (response.ok) {
            const workerCode = await response.blob();
            const jsBlob = new Blob([workerCode], { type: 'application/javascript' });
            pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(jsBlob);
            isWorkerReady = true;
            return;
        }
    } catch (e) {
        console.warn('[pdfExtractor] Could not create Blob worker from local bundle:', e);
    }

    // Strategy 3: Fallback to official CDN if online, or local URL as last resort
    try {
        if (navigator.onLine) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
        } else {
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        }
    } catch {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
    isWorkerReady = true;
}

/**
 * Extracts plain text and page metadata from a PDF file (File, Blob, or ArrayBuffer)
 * @param {File|Blob|ArrayBuffer} fileOrBuffer 
 * @param {Function} onProgress Optional progress callback ({ current, total })
 * @returns {Promise<{ text: string, numPages: number, pages: Array<{ pageNum: number, text: string }> }>}
 */
export async function extractTextFromPdf(fileOrBuffer, onProgress = null) {
    let arrayBuffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
        arrayBuffer = fileOrBuffer;
    } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
        arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
        throw new Error('Formato de archivo PDF no válido.');
    }

    if (!workerInitPromise) {
        workerInitPromise = ensureWorkerConfigured();
    }
    await workerInitPromise;

    const data = new Uint8Array(arrayBuffer);

    let pdfDoc;
    try {
        const loadingTask = pdfjsLib.getDocument({
            data,
            useSystemFonts: true,
            isEvalSupported: false
        });
        pdfDoc = await loadingTask.promise;
    } catch (primaryErr) {
        console.warn('[pdfExtractor] Primary worker failed, retrying with CDN fallback:', primaryErr);
        try {
            // Direct CDN fallback if blob worker was blocked by browser security policy
            pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
            const fallbackTask = pdfjsLib.getDocument({
                data,
                useSystemFonts: true,
                isEvalSupported: false
            });
            pdfDoc = await fallbackTask.promise;
        } catch (secondaryErr) {
            console.error('[pdfExtractor] All worker strategies failed:', secondaryErr);
            throw new Error(`Error al procesar el PDF: ${secondaryErr.message || primaryErr.message}`);
        }
    }

    const numPages = pdfDoc.numPages;
    const pages = [];
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let lastY = null;
        let pageText = '';
        
        for (const item of textContent.items) {
            if (!item.str) continue;
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += '\n';
            } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
                pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
        }

        const cleanPageText = pageText.trim();
        pages.push({ pageNum, text: cleanPageText });
        fullText += `[PÁGINA ${pageNum}]\n${cleanPageText}\n\n`;

        if (typeof onProgress === 'function') {
            onProgress({ current: pageNum, total: numPages, pageNum, numPages });
        }
    }

    return {
        text: fullText.trim(),
        numPages,
        pages
    };
}
