import React, { useEffect, useRef, useState } from "react";
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
    setShowExtractedText(false);
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
            const y = viewport.height - (item.transform[5] * zoom);
            
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
    setIsLoading(false);
  };

  const extractTextFromAllPages = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    setIsLoading(true);
    const extractedResults: ExtractedText[] = [];
    const referencePolygon = polygons[0];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: zoom });

        const textsInPolygon: string[] = [];
        
        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            const x = item.transform[4] * zoom;
            const y = viewport.height - (item.transform[5] * zoom);
            
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
    setIsLoading(false);
  };

  const scrollToPage = (pageNumber: number) => {
    const pageCanvas = pageRefs.current[pageNumber - 1];
    if (pageCanvas && containerRef.current) {
      pageCanvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    <div className="h-full w-full flex flex-col lg:flex-row bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-80'} 
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'overflow-hidden' : ''}
        bg-white border-r border-gray-200 shadow-sm flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Controles
              </h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors lg:block hidden"
            >
              <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Zoom Controls */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Zoom
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= zoomLevels[0]}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Drawing Controls */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Seleção
              </h3>
              
              <div className="space-y-2">
                {!isDrawing ? (
                  <button
                    onClick={startDrawing}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Iniciar Desenho
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-700 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        Modo desenho ativo
                      </div>
                      <p className="text-xs text-green-600 mt-1">Clique no PDF para adicionar pontos</p>
                    </div>
                    <button
                      onClick={stopDrawing}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Finalizar Polígono
                    </button>
                  </div>
                )}
                
                <button
                  onClick={clearPolygons}
                  disabled={polygons.length === 0}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar Seleções
                </button>
              </div>
            </div>

            {/* Extraction Controls */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Extração
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={extractTextFromPolygons}
                  disabled={polygons.length === 0 || isLoading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed text-sm"
                >
                  Extrair Texto dos Polígonos
                </button>
                
                <button
                  onClick={extractTextFromAllPages}
                  disabled={polygons.length === 0 || isLoading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed text-sm"
                >
                  Extrair de Todas as Páginas
                </button>
              </div>
            </div>

            {/* Status Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Polígonos:</span>
                  <span className="font-medium text-gray-800">{polygons.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Página:</span>
                  <span className="font-medium text-gray-800">{currentPage} de {numPages}</span>
                </div>
                {extractedTexts.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Textos extraídos:</span>
                    <span className="font-medium text-green-600">{extractedTexts.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Page Navigation */}
            {numPages > 1 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Navegação</h3>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: numPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => scrollToPage(i + 1)}
                        className={`
                          px-2 py-1 text-xs rounded transition-colors
                          ${currentPage === i + 1 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }
                        `}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Text Results */}
            {showExtractedText && extractedTexts.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Texto Extraído
                    </h3>
                    <button
                      onClick={() => setShowExtractedText(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <div className="space-y-3">
                    {extractedTexts.map((result, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Página {result.pageNumber}
                            </span>
                            <button
                              onClick={() => scrollToPage(result.pageNumber)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Ir para página
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                            {result.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="text-lg font-semibold text-gray-800">
                Página {currentPage} de {numPages}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center space-x-4">
              {isDrawing && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Modo desenho ativo
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                Zoom: {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>
          
          {isDrawing && (
            <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              💡 Clique no PDF para adicionar pontos ao polígono. Use os controles da barra lateral para finalizar.
            </div>
          )}
        </div>

        {/* PDF Container */}
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
    </div>
  );
}

type PageWithOverlayProps = {
  pdf: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
  zoom: number;
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
  zoom,
  isDrawing,
  currentPolygon,
  setCurrentPolygon,
  polygons,
  onCanvasRef,
  onOverlayRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdf) return;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width = viewport.width;
        overlay.height = viewport.height;
        drawPolygons();
      }
    };

    renderPage();
  }, [pdf, pageNumber, zoom]);

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
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

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

      // Desenhar pontos com melhor visual
      polygon.points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(34, 197, 94, 1)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Numeração dos pontos
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), point.x, point.y + 3);
      });
    });

    // Desenhar polígono atual sendo desenhado
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

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

      // Desenhar pontos do polígono atual
      currentPolygon.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Numeração dos pontos
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), point.x, point.y + 3);
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
    <div className="relative flex justify-center">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-lg border border-gray-300 bg-white transition-transform duration-200 group-hover:shadow-xl"
          aria-label={`Página ${pageNumber}`}
        />
        <canvas
          ref={overlayRef}
          className={`
            absolute top-0 left-0 rounded-xl transition-all duration-200
            ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}
          `}
          onClick={handleOverlayClick}
          style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}
        />
        
        {/* Page Number Badge */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {pageNumber}
        </div>
        
        {/* Polygon Count Badge */}
        {polygons.length > 0 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {polygons.length}
          </div>
        )}
      </div>
    </div>
  );
};