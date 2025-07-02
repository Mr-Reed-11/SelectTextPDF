import type { ExtractedText, Polygon } from "./types";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  zoom: number;
  zoomLevels: number[];
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
  isDrawing: boolean;
  startDrawing: () => void;
  stopDrawing: () => void;
  clearPolygons: () => void;
  polygons: Polygon[];
  extractTextFromPolygons: () => void;
  extractTextFromAllPages: () => void;
  currentPage: number;
  numPages: number;
  extractedTexts: ExtractedText[];
  showExtractedText: boolean;
  setShowExtractedText: (show: boolean) => void;
  scrollToPage: (pageNumber: number) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  zoom,
  zoomLevels,
  handleZoomIn,
  handleZoomOut,
  handleZoomReset,
  isDrawing,
  startDrawing,
  stopDrawing,
  clearPolygons,
  polygons,
  extractTextFromPolygons,
  extractTextFromAllPages,
  currentPage,
  numPages,
  extractedTexts,
  showExtractedText,
  setShowExtractedText,
  scrollToPage,
  isLoading,
}) => {
  return (
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
  );
};