// src/components/pdf-viewer.tsx
import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "../../scripts/pdf-worker";

interface PdfViewerProps {
  file: File | null;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      try {
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        URL.revokeObjectURL(fileUrl);
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
      }
    };

    loadPdf();
  }, [file]);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;

      const containerTop = containerRef.current.getBoundingClientRect().top;

      let minDistance = Infinity;
      let activePage = currentPage;

      pageRefs.current.forEach((canvas, index) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);
        if (distance < minDistance) {
          minDistance = distance;
          activePage = index + 1;
        }
      });

      setCurrentPage(activePage);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", onScroll);
      return () => container.removeEventListener("scroll", onScroll);
    }
  }, [currentPage]);

  if (!file) return null;

  return (
    <div className="mt-6 max-h-[80vh] w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="mb-2 text-gray-700 font-semibold">
        Página {currentPage} de {numPages}
      </div>

      <div
        ref={containerRef}
        className="overflow-auto w-full border rounded-xl shadow max-h-[80vh] flex flex-col items-center space-y-8 p-4 bg-gray-300"
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pdf={pdfDoc}
            pageNumber={i + 1}
            ref={(el) => {
              pageRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}

type PageProps = {
  pdf: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
};

const Page = React.forwardRef<HTMLCanvasElement, PageProps>(
  ({ pdf, pageNumber }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!pdf) return;

      const renderPage = async () => {
        const page = await pdf.getPage(pageNumber);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
      };

      renderPage();
    }, [pdf, pageNumber]);

    React.useImperativeHandle(ref, () => canvasRef.current!);

    return (
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow border"
        aria-label={`Página ${pageNumber}`}
      />
    );
  }
);

Page.displayName = "Page";
