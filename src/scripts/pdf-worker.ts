// Importa as opções globais do PDF.js (biblioteca usada para renderizar arquivos PDF no navegador)
import { GlobalWorkerOptions } from "pdfjs-dist";

// Importa o arquivo do "web worker" necessário para processar PDFs em segundo plano.
// O sufixo `?url` é específico de bundlers como Vite, Webpack ou Parcel, e faz com que o worker seja tratado como um recurso externo (URL).
import workerURL from "pdfjs-dist/build/pdf.worker?url";

// Define a URL do worker globalmente para que o PDF.js possa utilizá-lo corretamente.
// Isso evita erros como "Missing PDF worker" ao tentar carregar arquivos PDF.
GlobalWorkerOptions.workerSrc = workerURL;
