import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "../../scripts/pdf-worker";
import type { ExtractedText, PdfViewerProps, Point, Polygon } from "./types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { PageWithOverlay } from "./page-with-overlay";
import { RightSidebar } from "./extrated-text-sidebar";

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [zoom, setZoom] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const zoomLevels = [0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3];

  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const fileUrl = URL.createObjectURL(file);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        URL.revokeObjectURL(fileUrl);
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
      } finally {
        setIsLoading(false);
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

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  const handleZoomReset = () => {
    setZoom(1.2);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
  };

  const stopDrawing = () => {
    if (currentPolygon.length >= 3) {
      const newPolygon: Polygon = {
        points: currentPolygon,
        id: `polygon_${Date.now()}`,
        pageNumber: currentPage,
      };
      setPolygons((prev) => [...prev, newPolygon]);
    }
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  const clearPolygons = () => {
    setPolygons([]);
    setExtractedTexts([]);
    setShowExtractedText(false);
    overlayRefs.current.forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  const extractTextFromPolygons = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    setIsLoading(true);
    const extractedResults: ExtractedText[] = [];

    for (const polygon of polygons) {
      try {
        const page = await pdfDoc.getPage(polygon.pageNumber);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: zoom });

        const textsInPolygon: string[] = [];

        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            const x = item.transform[4] * zoom;
            const y = viewport.height - item.transform[5] * zoom;

            if (isPointInPolygon({ x, y }, polygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        if (textsInPolygon.length > 0) {
          extractedResults.push({
            pageNumber: polygon.pageNumber,
            text: textsInPolygon.join(" ").trim(),
            polygonId: polygon.id,
          });
        }
      } catch (err) {
        console.error(
          `Erro ao extrair texto da página ${polygon.pageNumber}:`,
          err
        );
      }
    }

    setExtractedTexts(extractedResults);
    setShowExtractedText(true);
    setIsLoading(false);
  };

  const extractTextFromAllPages = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    setIsLoading(true);
    const extractedResults: ExtractedText[] = [];
    const referencePolygon = polygons[0]; // Assuming the first polygon is the reference

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: zoom });

        const textsInPolygon: string[] = [];

        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            const x = item.transform[4] * zoom;
            const y = viewport.height - item.transform[5] * zoom;

            if (isPointInPolygon({ x, y }, referencePolygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        if (textsInPolygon.length > 0) {
          extractedResults.push({
            pageNumber: pageNum,
            text: textsInPolygon.join(" ").trim(),
            polygonId: `${referencePolygon.id}_page_${pageNum}`,
          });
        }
      } catch (err) {
        console.error(`Erro ao extrair texto da página ${pageNum}:`, err);
      }
    }

    setExtractedTexts(extractedResults);
    setShowExtractedText(true);
    setIsLoading(false);
  };

  const scrollToPage = (pageNumber: number) => {
    const pageCanvas = pageRefs.current[pageNumber - 1];
    if (pageCanvas && containerRef.current) {
      pageCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x <
          ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
            (polygon[j].y - polygon[i].y) +
            polygon[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  if (!file) return null;

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        numPages={numPages}
        isDrawing={isDrawing}
        zoom={zoom}
      />

      {/* Main Content with Sidebars */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Sidebar Esquerda */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          zoom={zoom}
          zoomLevels={zoomLevels}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleZoomReset={handleZoomReset}
          isDrawing={isDrawing}
          startDrawing={startDrawing}
          stopDrawing={stopDrawing}
          clearPolygons={clearPolygons}
          polygons={polygons}
          extractTextFromPolygons={extractTextFromPolygons}
          extractTextFromAllPages={extractTextFromAllPages}
          currentPage={currentPage}
          numPages={numPages}
          extractedTexts={extractedTexts}
          showExtractedText={showExtractedText}
          setShowExtractedText={setShowExtractedText}
          scrollToPage={scrollToPage}
          isLoading={isLoading}
        />

        {/* PDF Viewer (Centro) */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gradient-to-b from-gray-100 to-gray-200 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {Array.from({ length: numPages }, (_, i) => (
              <PageWithOverlay
                key={`page_${i + 1}`}
                pdf={pdfDoc}
                pageNumber={i + 1}
                zoom={zoom}
                isDrawing={isDrawing}
                currentPolygon={currentPolygon}
                setCurrentPolygon={setCurrentPolygon}
                polygons={polygons.filter((p) => p.pageNumber === i + 1)}
                onCanvasRef={(canvas) => {
                  pageRefs.current[i] = canvas;
                }}
                onOverlayRef={(canvas) => {
                  overlayRefs.current[i] = canvas;
                }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Direita */}
        <RightSidebar
          showExtractedText={showExtractedText}
          setShowExtractedText={setShowExtractedText}
          extractedTexts={extractedTexts}
          scrollToPage={scrollToPage}
        />
      </div>
    </div>
  );
}