declare module "pdfjs-dist/legacy/build/pdf.mjs" {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
  const pdfjs: any;
  export default pdfjs;
}

declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs" {
  const workerSrc: string;
  export default workerSrc;
}

declare module "pdfjs-dist/build/pdf.mjs" {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
  const pdfjs: any;
  export default pdfjs;
}

declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  const workerSrc: string;
  export default workerSrc;
}
