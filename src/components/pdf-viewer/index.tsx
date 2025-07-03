import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "../../scripts/pdf-worker";
import type { ExtractedText, PdfViewerProps, Point, Polygon } from "./types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { PageWithOverlay } from "./page-with-overlay";
import { RightSidebar } from "./extrated-text-sidebar";

export default function PdfViewer({ file }: PdfViewerProps) {
  // Estados principais do visualizador
  const [numPages, setNumPages] = useState(0); // Número total de páginas do PDF
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null); // Documento PDF carregado
  const [currentPage, setCurrentPage] = useState(1); // Página atual sendo visualizada
  const [isDrawing, setIsDrawing] = useState(false); // Indica se está no modo de desenho
  const [polygons, setPolygons] = useState<Polygon[]>([]); // Array de polígonos finalizados
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]); // Pontos do polígono sendo desenhado
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]); // Textos extraídos dos polígonos
  const [showExtractedText, setShowExtractedText] = useState(false); // Controla exibição da sidebar de texto
  const [zoom, setZoom] = useState(1.2); // Nível de zoom atual
  const [isLoading, setIsLoading] = useState(false); // Indicador de carregamento
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Estado da sidebar esquerda

  // Referências para elementos DOM
  const containerRef = useRef<HTMLDivElement>(null); // Container principal de scroll
  const pageRefs = useRef<(HTMLCanvasElement | null)[]>([]); // Array de referências para canvas das páginas
  const overlayRefs = useRef<(HTMLCanvasElement | null)[]>([]); // Array de referências para canvas de overlay

  // Níveis de zoom disponíveis
  const zoomLevels = [0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3];

  // Effect para carregar o PDF quando o arquivo é fornecido
  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        // Cria URL temporária para o arquivo
        const fileUrl = URL.createObjectURL(file);
        // Carrega o documento PDF
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        // Limpa a URL temporária para evitar vazamentos de memória
        URL.revokeObjectURL(fileUrl);
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file]);

  // Effect para detectar a página atual baseada na posição do scroll
  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;

      const containerTop = containerRef.current.getBoundingClientRect().top;
      let minDistance = Infinity;
      let activePage = currentPage;

      // Verifica qual página está mais próxima do topo do container
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

  // Função para aumentar o zoom
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  // Função para diminuir o zoom
  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  // Função para resetar o zoom ao valor padrão
  const handleZoomReset = () => {
    setZoom(1.2);
  };

  // Função para iniciar o modo de desenho
  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
  };

  // Função para finalizar o desenho do polígono
  const stopDrawing = () => {
    // Só finaliza se o polígono tem pelo menos 3 pontos
    if (currentPolygon.length >= 3) {
      const newPolygon: Polygon = {
        points: currentPolygon,
        id: `polygon_${Date.now()}`, // ID único baseado no timestamp
        pageNumber: currentPage,
      };
      setPolygons((prev) => [...prev, newPolygon]);
    }
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  // Função para limpar todos os polígonos
  const clearPolygons = () => {
    setPolygons([]);
    setExtractedTexts([]);
    setShowExtractedText(false);
    // Limpa todos os canvas de overlay
    overlayRefs.current.forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  // Função para extrair texto apenas dos polígonos desenhados
  const extractTextFromPolygons = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    setIsLoading(true);
    const extractedResults: ExtractedText[] = [];

    // Processa cada polígono individualmente
    for (const polygon of polygons) {
      try {
        const page = await pdfDoc.getPage(polygon.pageNumber);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: zoom });

        const textsInPolygon: string[] = [];

        // Verifica cada item de texto da página
        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            // Calcula a posição do texto no canvas
            const x = item.transform[4] * zoom;
            const y = viewport.height - item.transform[5] * zoom;

            // Verifica se o texto está dentro do polígono
            if (isPointInPolygon({ x, y }, polygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        // Adiciona o texto extraído se houver conteúdo
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

  // Função para extrair texto de todas as páginas usando o primeiro polígono como referência
  const extractTextFromAllPages = async () => {
    if (!pdfDoc || polygons.length === 0) return;

    setIsLoading(true);
    const extractedResults: ExtractedText[] = [];
    const referencePolygon = polygons[0]; // Usa o primeiro polígono como referência

    // Processa todas as páginas do documento
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: zoom });

        const textsInPolygon: string[] = [];

        // Verifica cada item de texto da página
        textContent.items.forEach((item: any) => {
          if (item.transform && item.str) {
            // Calcula a posição do texto no canvas
            const x = item.transform[4] * zoom;
            const y = viewport.height - item.transform[5] * zoom;

            // Verifica se o texto está dentro da área do polígono de referência
            if (isPointInPolygon({ x, y }, referencePolygon.points)) {
              textsInPolygon.push(item.str);
            }
          }
        });

        // Adiciona o texto extraído se houver conteúdo
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

  // Função para navegar até uma página específica
  const scrollToPage = (pageNumber: number) => {
    const pageCanvas = pageRefs.current[pageNumber - 1];
    if (pageCanvas && containerRef.current) {
      pageCanvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Algoritmo para verificar se um ponto está dentro de um polígono (Ray Casting)
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

  // Não renderiza nada se não há arquivo
  if (!file) return null;

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Overlay de carregamento */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Processando...</p>
          </div>
        </div>
      )}

      {/* Barra superior com controles */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        numPages={numPages}
        isDrawing={isDrawing}
        zoom={zoom}
      />

      {/* Conteúdo principal com sidebars */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Sidebar esquerda - Controles e navegação */}
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

        {/* Área central - Visualizador do PDF */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gradient-to-b from-gray-100 to-gray-200 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Renderiza todas as páginas do PDF */}
            {Array.from({ length: numPages }, (_, i) => (
              <PageWithOverlay
                key={`page_${i + 1}`}
                setPolygons={setPolygons} 
                pdf={pdfDoc}
                pageNumber={i + 1}
                zoom={zoom}
                isDrawing={isDrawing}
                currentPolygon={currentPolygon}
                setCurrentPolygon={setCurrentPolygon}
                // Filtra polígonos para mostrar apenas os da página atual
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

        {/* Sidebar direita - Texto extraído */}
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