import { useEffect, useRef, useState } from "react";
import type { Point, Polygon } from "./types";
import * as pdfjsLib from "pdfjs-dist";

// Definição das propriedades do componente
type PageWithOverlayProps = {
  pdf: pdfjsLib.PDFDocumentProxy | null; // Documento PDF carregado
  pageNumber: number; // Número da página atual
  zoom: number; // Nível de zoom da página
  isDrawing: boolean; // Indica se está no modo de desenho
  currentPolygon: Point[]; // Pontos do polígono sendo desenhado atualmente
  setCurrentPolygon: React.Dispatch<React.SetStateAction<Point[]>>; // Função para atualizar o polígono atual
  polygons: Polygon[]; // Array de polígonos já finalizados
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>; // Função para atualizar os polígonos
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void; // Callback para referência do canvas principal
  onOverlayRef: (canvas: HTMLCanvasElement | null) => void; // Callback para referência do canvas de overlay
};

export const PageWithOverlay: React.FC<PageWithOverlayProps> = ({
  pdf,
  pageNumber,
  zoom,
  isDrawing,
  currentPolygon,
  setCurrentPolygon,
  polygons,
  setPolygons,
  onCanvasRef,
  onOverlayRef,
}) => {
  // Referências para os elementos canvas
  const canvasRef = useRef<HTMLCanvasElement>(null); // Canvas principal onde o PDF é renderizado
  const overlayRef = useRef<HTMLCanvasElement>(null); // Canvas de overlay para desenhos

  // Estados para controle de texto
  const [hasTextContent, setHasTextContent] = useState<boolean>(false); // Indica se a página tem conteúdo de texto
  const [showTextAlert, setShowTextAlert] = useState<boolean>(false); // Controla exibição do alerta de texto
  const [selectedText, setSelectedText] = useState<string>(""); // Texto selecionado pelo usuário
  const prevZoomRef = useRef<number>(zoom); // Referência para o zoom anterior (detecção de mudanças)

  // Referência para controle de tarefas de renderização
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Effect para limpar polígonos quando o zoom mudar
  useEffect(() => {
    if (prevZoomRef.current !== zoom) {
      // Limpa polígonos existentes quando o zoom muda
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
      // Obtém o conteúdo de texto da página
      const textContent = await page.getTextContent();

      // Verifica se há texto válido (não vazio) na página
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

  // Função para detectar seleção de texto pelo usuário
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

  // Effect principal para renderização da página PDF
  useEffect(() => {
    if (!pdf) return;

    let isUnmounted = false; // Flag para evitar atualizações após desmontagem

    const renderPage = async () => {
      try {
        // Obtém a página especificada do PDF
        const page = await pdf.getPage(pageNumber);
        // Calcula o viewport com o zoom atual
        const viewport = page.getViewport({ scale: zoom });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Ajusta as dimensões do canvas para corresponder ao viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Cancela render anterior se existir (evita sobreposição)
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Inicia a renderização da página
        const renderTask = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = renderTask;

        // Aguarda a conclusão da renderização
        await renderTask.promise;

        if (isUnmounted) return;

        // Verifica se há conteúdo de texto na página
        await checkTextContent(page);

        // Ajusta o overlay (canvas da camada superior) para as mesmas dimensões
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = viewport.width;
          overlay.height = viewport.height;
        }

        // Desenha os polígonos sobre a página
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

    // Cleanup: cancela renderização em andamento quando o componente desmonta
    return () => {
      isUnmounted = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, zoom]);

  // Effect para fornecer referências dos canvas aos componentes pais
  useEffect(() => {
    onCanvasRef(canvasRef.current);
    onOverlayRef(overlayRef.current);
  }, [onCanvasRef, onOverlayRef]);

  // Effect para adicionar listeners de seleção de texto
  useEffect(() => {
    const handleSelectionChange = () => handleTextSelection();

    // Adiciona listeners para detectar seleção de texto
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);

    // Cleanup: remove listeners quando o componente desmonta
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, [hasTextContent]);

  // Função para desenhar polígonos no canvas de overlay
  const drawPolygons = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    // Limpa o canvas antes de desenhar
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Desenha polígonos finalizados
    polygons.forEach((polygon) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)"; // Verde semi-transparente
      ctx.fillStyle = "rgba(34, 197, 94, 0.15)"; // Preenchimento verde claro
      ctx.lineWidth = 2 * zoom; // Espessura proporcional ao zoom
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Desenha as linhas do polígono
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

      // Desenha os pontos do polígono
      polygon.points.forEach((point: any, index: any) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 * zoom, 0, 2 * Math.PI); // Raio proporcional ao zoom
        ctx.fillStyle = "rgba(34, 197, 94, 1)"; // Verde sólido
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Numeração dos pontos
        ctx.fillStyle = "white";
        ctx.font = `bold ${10 * zoom}px sans-serif`; // Tamanho da fonte proporcional ao zoom
        ctx.textAlign = "center";
        ctx.fillText((index + 1).toString(), point.x, point.y + 3 * zoom);
      });
    });

    // Desenha o polígono atual sendo desenhado
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.9)"; // Azul semi-transparente
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)"; // Preenchimento azul claro
      ctx.lineWidth = 2 * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Desenha as linhas do polígono atual
      currentPolygon.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      // Fecha o polígono se há mais de 2 pontos
      if (currentPolygon.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Desenha os pontos do polígono atual
      currentPolygon.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5 * zoom, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(59, 130, 246, 1)"; // Azul sólido
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Numeração dos pontos
        ctx.fillStyle = "white";
        ctx.font = `bold ${10 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText((index + 1).toString(), point.x, point.y + 3 * zoom);
      });
    }
  };

  // Effect para redesenhar polígonos quando há mudanças
  useEffect(() => {
    drawPolygons();
  }, [currentPolygon, polygons]);

  // Handler para cliques no canvas de overlay (adição de pontos ao polígono)
  const handleOverlayClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !overlayRef.current) return;

    // Calcula a posição do clique relativa ao canvas
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Adiciona o novo ponto ao polígono atual
    setCurrentPolygon((prev) => [...prev, { x, y }]);
  };

  return (
    <div className="relative flex justify-center">
      <div className="relative group">
        {/* Canvas principal para renderização do PDF */}
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-lg border border-gray-300 bg-white transition-transform duration-200 group-hover:shadow-xl"
          aria-label={`Página ${pageNumber}`}
        />
        
        {/* Canvas de overlay para desenhos e interações */}
        <canvas
          ref={overlayRef}
          className={`
            absolute top-0 left-0 rounded-xl transition-all duration-200
            ${isDrawing ? "cursor-crosshair" : "cursor-default"}
          `}
          onClick={handleOverlayClick}
          style={{ pointerEvents: isDrawing ? "auto" : "none" }}
        />

        {/* Badge com o número da página */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {pageNumber}
        </div>

        {/* Badge com a contagem de polígonos */}
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

        {/* Badge de status do conteúdo de texto */}
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

        {/* Alerta para texto não identificado */}
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
                {/* Mostra preview do texto selecionado */}
                {selectedText && (
                  <div className="text-xs mt-1 bg-red-400 bg-opacity-50 p-1 rounded">
                    "{selectedText.substring(0, 30)}..."
                  </div>
                )}
              </div>
              {/* Botão para fechar o alerta */}
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