import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker for Vite production and development
try {
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    }
} catch (e) {
    console.warn('Could not set pdfjs worker url:', e);
}

/**
 * Extracts plain text and page metadata from a PDF file (File, Blob, or ArrayBuffer)
 * @param {File|Blob|ArrayBuffer} fileOrBuffer 
 * @param {Function} onProgress Optional progress callback (current, total)
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

    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        isEvalSupported: false
    });

    const pdfDoc = await loadingTask.promise;
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
            onProgress(pageNum, numPages);
        }
    }

    return {
        text: fullText.trim(),
        numPages,
        pages
    };
}
