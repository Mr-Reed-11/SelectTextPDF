interface TopBarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: number;
  numPages: number;
  isDrawing: boolean;
  zoom: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  currentPage,
  numPages,
  isDrawing,
  zoom,
}) => {
  return (
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
  );
};