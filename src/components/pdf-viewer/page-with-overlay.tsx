import { useEffect, useRef, useState } from "react";
import type { Point, Polygon } from "./types";
import * as pdfjsLib from "pdfjs-dist";

type PageWithOverlayProps = {
  pdf: pdfjsLib.PDFDocumentProxy | null;
  pageNumber: number;
  zoom: number;
  isDrawing: boolean;
  currentPolygon: Point[];
  setCurrentPolygon: React.Dispatch<React.SetStateAction<Point[]>>;
  polygons: Polygon[];
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>; // Adicionado para limpar polígonos
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  onOverlayRef: (canvas: HTMLCanvasElement | null) => void;
};

export const PageWithOverlay: React.FC<PageWithOverlayProps> = ({
  pdf,
  pageNumber,
  zoom,
  isDrawing,
  currentPolygon,
  setCurrentPolygon,
  polygons,
  setPolygons, // Adicionado
  onCanvasRef,
  onOverlayRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hasTextContent, setHasTextContent] = useState<boolean>(false);
  const [showTextAlert, setShowTextAlert] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const prevZoomRef = useRef<number>(zoom); // Ref para armazenar o zoom anterior

  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Effect para limpar polígonos quando o zoom mudar
  useEffect(() => {
    if (prevZoomRef.current !== zoom) {
      // Limpa polígonos existentes
      setPolygons([]);
      // Limpa polígono atual sendo desenhado
      setCurrentPolygon([]);
      // Atualiza a referência do zoom anterior
      prevZoomRef.current = zoom;
    }
  }, [zoom, setPolygons, setCurrentPolygon]);

  // Função para verificar se há conteúdo de texto na página
  const checkTextContent = async (page: pdfjsLib.PDFPageProxy) => {
    try {
      const textContent = await page.getTextContent();

      const hasValidText = textContent.items.some(
        (item: any) => item.str && item.str.trim().length > 0
      );

      setHasTextContent(hasValidText);
      return hasValidText;
    } catch (error) {
      console.warn("Erro ao verificar conteúdo de texto:", error);
      setHasTextContent(false);
      return false;
    }
  };

  // Função para detectar seleção de texto
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || "";

    if (selectedText.length > 0) {
      setSelectedText(selectedText);

      // Se não há conteúdo de texto identificado pelo sistema, mostra o alerta
      if (!hasTextContent) {
        setShowTextAlert(true);
        // Auto-hide após 5 segundos
        setTimeout(() => setShowTextAlert(false), 5000);
      }
    }
  };

  useEffect(() => {
    if (!pdf) return;

    let isUnmounted = false;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Cancela render anterior
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderTask = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (isUnmounted) return;

        // Verifica se há conteúdo de texto na página
        await checkTextContent(page);

        // Ajusta o overlay (canvas da camada superior)
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = viewport.width;
          overlay.height = viewport.height;
        }

        // Desenha polígonos
        drawPolygons();
      } catch (error: any) {
        if (error?.name === "RenderingCancelledException") {
          // Render cancelado normalmente, pode ignorar
        } else {
          console.error("Erro ao renderizar a página:", error);
        }
      }
    };

    renderPage();

    return () => {
      isUnmounted = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, zoom]);

  useEffect(() => {
    onCanvasRef(canvasRef.current);
    onOverlayRef(overlayRef.current);
  }, [onCanvasRef, onOverlayRef]);

  

  // Adiciona event listeners para detecção de seleção de texto
  useEffect(() => {
    const handleSelectionChange = () => handleTextSelection();

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, [hasTextContent]);

  const drawPolygons = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Desenhar polígonos salvos com espessura proporcional ao zoom
    polygons.forEach((polygon) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
      ctx.lineWidth = 2 * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      polygon.points.forEach((point: any, index: any) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Desenhar pontos com tamanho proporcional ao zoom
      polygon.points.forEach((point: any, index: any) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 * zoom, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(34, 197, 94, 1)";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Numeração dos pontos com tamanho proporcional
        ctx.fillStyle = "white";
        ctx.font = `bold ${10 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText((index + 1).toString(), point.x, point.y + 3 * zoom);
      });
    });

    // Desenhar polígono atual sendo desenhado com espessura proporcional
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.lineWidth = 2 * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

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

      // Desenhar pontos do polígono atual com tamanho proporcional
      currentPolygon.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 * zoom, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(59, 130, 246, 1)";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Numeração dos pontos com tamanho proporcional
        ctx.fillStyle = "white";
        ctx.font = `bold ${10 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText((index + 1).toString(), point.x, point.y + 3 * zoom);
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

    setCurrentPolygon((prev) => [...prev, { x, y }]);
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
            ${isDrawing ? "cursor-crosshair" : "cursor-default"}
          `}
          onClick={handleOverlayClick}
          style={{ pointerEvents: isDrawing ? "auto" : "none" }}
        />

        {/* Page Number Badge */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {pageNumber}
        </div>

        {/* Polygon Count Badge */}
        {polygons.length > 0 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {polygons.length}
          </div>
        )}

        {/* Status do Texto Badge */}
        <div
          className={`absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-medium shadow-lg flex items-center ${
            hasTextContent
              ? "bg-green-500 bg-opacity-90 text-white"
              : "bg-yellow-500 bg-opacity-90 text-white"
          }`}
        >
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {hasTextContent ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            )}
          </svg>
          {hasTextContent ? "Texto OK" : "Sem texto"}
        </div>

        {/* Alert de Texto Não Identificado */}
        {showTextAlert && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs z-50 animate-pulse">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <div className="font-semibold text-sm">
                  Texto não identificado!
                </div>
                <div className="text-xs mt-1 opacity-90">
                  O sistema não conseguiu identificar o texto selecionado nesta
                  página.
                </div>
                {selectedText && (
                  <div className="text-xs mt-1 bg-red-400 bg-opacity-50 p-1 rounded">
                    "{selectedText.substring(0, 30)}..."
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowTextAlert(false)}
                className="ml-2 text-white hover:text-red-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};