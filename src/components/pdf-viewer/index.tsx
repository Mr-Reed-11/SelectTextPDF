// src/components/pdf-viewer.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "../../scripts/pdf-worker";

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  points: Point[];
  id: string;
  pageNumber: number;
}

interface ExtractedText {
  pageNumber: number;
  text: string;
  polygonId: string;
}

interface PdfViewerProps {
  file: File | null;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [showExtractedText, setShowExtractedText] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLCanvasElement | null)[]>([]);

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

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
  };

  const stopDrawing = () => {
    if (currentPolygon.length >= 3) {
      const newPolygon: Polygon = {
        points: currentPolygon,
        id: `polygon_${Date.now()}`,
        pageNumber: currentPage
      };
      setPolygons(prev => [...prev, newPolygon]);
    }
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  const clearPolygons = () => {
    setPolygons([]);
    setExtractedTexts([]);
    // Limpar overlays
    overlayRefs.current.forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  const extractTextFromPolygons = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    const extractedResults: ExtractedText[] = [];

    for (const polygon of polygons) {
      try {
        const page = await pdfDoc.getPage(polygon.pageNumber);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        // Encontrar texto dentro do polígono
        const textsInPolygon: string[] = [];
        
        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            // Converter coordenadas do PDF para coordenadas do canvas
            const x = item.transform[4] * 1.5;
            const y = viewport.height - (item.transform[5] * 1.5);
            
            if (isPointInPolygon({ x, y }, polygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        if (textsInPolygon.length > 0) {
          extractedResults.push({
            pageNumber: polygon.pageNumber,
            text: textsInPolygon.join(' ').trim(),
            polygonId: polygon.id
          });
        }
      } catch (err) {
        console.error(`Erro ao extrair texto da página ${polygon.pageNumber}:`, err);
      }
    }

    setExtractedTexts(extractedResults);
    setShowExtractedText(true);
  };

  const extractTextFromAllPages = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    const extractedResults: ExtractedText[] = [];
    const referencePolygon = polygons[0]; // Usar o primeiro polígono como referência

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        const textsInPolygon: string[] = [];
        
        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            const x = item.transform[4] * 1.5;
            const y = viewport.height - (item.transform[5] * 1.5);
            
            if (isPointInPolygon({ x, y }, referencePolygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        if (textsInPolygon.length > 0) {
          extractedResults.push({
            pageNumber: pageNum,
            text: textsInPolygon.join(' ').trim(),
            polygonId: `${referencePolygon.id}_page_${pageNum}`
          });
        }
      } catch (err) {
        console.error(`Erro ao extrair texto da página ${pageNum}:`, err);
      }
    }

    setExtractedTexts(extractedResults);
    setShowExtractedText(true);
  };

  // Função para verificar se um ponto está dentro de um polígono
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x < ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) / (polygon[j].y - polygon[i].y) + polygon[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  if (!file) return null;

  return (
    <div className="mt-6 max-h-[90vh] w-full max-w-6xl mx-auto flex">
      {/* Painel de controle */}
      <div className="w-80 p-4 bg-gray-50 border-r flex flex-col space-y-4">
        <div className="text-lg font-bold text-gray-800">Controles de Seleção</div>
        
        <div className="flex flex-col space-y-2">
          <button
            onClick={startDrawing}
            disabled={isDrawing}
            className={`px-4 py-2 rounded font-medium ${
              isDrawing 
                ? 'bg-green-500 text-white cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isDrawing ? 'Desenhando... (clique para finalizar)' : 'Iniciar Desenho'}
          </button>
          
          {isDrawing && (
            <button
              onClick={stopDrawing}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
            >
              Finalizar Polígono
            </button>
          )}
          
          <button
            onClick={clearPolygons}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
          >
            Limpar Seleções
          </button>
        </div>

        <div className="border-t pt-4">
          <div className="text-md font-semibold text-gray-700 mb-2">Extração de Texto</div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={extractTextFromPolygons}
              disabled={polygons.length === 0}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded font-medium"
            >
              Extrair Texto dos Polígonos
            </button>
            
            <button
              onClick={extractTextFromAllPages}
              disabled={polygons.length === 0}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white rounded font-medium"
            >
              Extrair de Todas as Páginas
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <div>Polígonos criados: {polygons.length}</div>
          <div>Página atual: {currentPage} de {numPages}</div>
        </div>

        {/* Resultados da extração */}
        {showExtractedText && extractedTexts.length > 0 && (
          <div className="border-t pt-4 max-h-60 overflow-y-auto">
            <div className="text-md font-semibold text-gray-700 mb-2">Texto Extraído</div>
            {extractedTexts.map((result, index) => (
              <div key={index} className="mb-3 p-3 bg-white rounded border">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Página {result.pageNumber}
                </div>
                <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                  {result.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visualizador de PDF */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b">
          <div className="text-center text-gray-700 font-semibold">
            Página {currentPage} de {numPages}
          </div>
          <div className="text-center text-sm text-gray-500 mt-1">
            {isDrawing ? 'Clique para adicionar pontos ao polígono' : 'Use os controles à esquerda para começar'}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-300 p-4 space-y-8"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <PageWithOverlay
              key={`page_${i + 1}`}
              pdf={pdfDoc}
              pageNumber={i + 1}
              isDrawing={isDrawing}
              currentPolygon={currentPolygon}
              setCurrentPolygon={setCurrentPolygon}
              polygons={polygons.filter(p => p.pageNumber === i + 1)}
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
    </div>
  );
}

type PageWithOverlayProps = {
  pdf: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
  isDrawing: boolean;
  currentPolygon: Point[];
  setCurrentPolygon: React.Dispatch<React.SetStateAction<Point[]>>;
  polygons: Polygon[];
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  onOverlayRef: (canvas: HTMLCanvasElement | null) => void;
};

const PageWithOverlay: React.FC<PageWithOverlayProps> = ({
  pdf,
  pageNumber,
  isDrawing,
  currentPolygon,
  setCurrentPolygon,
  polygons,
  onCanvasRef,
  onOverlayRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Configurar overlay
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width = viewport.width;
        overlay.height = viewport.height;
        drawPolygons();
      }
    };

    renderPage();
  }, [pdf, pageNumber]);

  useEffect(() => {
    onCanvasRef(canvasRef.current);
    onOverlayRef(overlayRef.current);
  }, [onCanvasRef, onOverlayRef]);

  const drawPolygons = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Desenhar polígonos salvos
    polygons.forEach((polygon) => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 2;

      polygon.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Desenhar pontos
      polygon.points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(34, 197, 94, 1)';
        ctx.fill();
      });
    });

    // Desenhar polígono atual sendo desenhado
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2;

      currentPolygon.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      if (currentPolygon.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Desenhar pontos
      currentPolygon.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
        ctx.fill();
      });
    }
  };

  useEffect(() => {
    drawPolygons();
  }, [currentPolygon, polygons]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPolygon(prev => [...prev, { x, y }]);
  };

  return (
    <div ref={containerRef} className="relative flex justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow border"
        aria-label={`Página ${pageNumber}`}
      />
      <canvas
        ref={overlayRef}
        className="absolute top-0 left-0 rounded-xl cursor-crosshair"
        onClick={handleOverlayClick}
        style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}
      />
    </div>
  );
};