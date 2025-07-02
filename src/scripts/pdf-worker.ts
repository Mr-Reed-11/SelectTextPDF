import { GlobalWorkerOptions } from "pdfjs-dist";
import workerURL from "pdfjs-dist/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = workerURL;