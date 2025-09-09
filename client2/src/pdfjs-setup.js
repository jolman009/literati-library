import * as ReactPdf from 'react-pdf';

import { GlobalWorkerOptions } from 'pdfjs-dist';
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Set for direct pdfjs-dist usage
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = workerUrl;
}

// Also set for react-pdf (if you use it)
if (ReactPdf?.pdfjs?.GlobalWorkerOptions && !ReactPdf.pdfjs.GlobalWorkerOptions.workerSrc) {
  ReactPdf.pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
}

// No exports; this file is side-effectful by design
export {};
