// Filename: src/lib/pdfHelper.ts

export async function generatePDFThumbnail(file: File): Promise<Blob | null> {
  try {
    // Lazily load pdfjs-dist only in the browser when a file is uploaded,
    // so it's never evaluated during server-side prerendering (it requires
    // browser globals like `Iterator` that are absent on older Node runtimes).
    const pdfjsLib = await import('pdfjs-dist');

    // We dynamically pull the exact version installed via npm to prevent mismatches
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/build/pdf.worker.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const page = await pdf.getPage(1); 
    const viewport = page.getViewport({ scale: 1.5 }); 
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Add canvas object and cast to any to satisfy TypeScript
    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas, 
    };
    
    await page.render(renderContext).promise;
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
    
  } catch (error) {
    console.error("PDF Thumbnail generation failed:", error);
    return null;
  }
}