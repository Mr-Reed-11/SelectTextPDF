// Define as props esperadas pelo componente TopBar
interface TopBarProps {
  sidebarCollapsed: boolean; // Indica se a sidebar está recolhida
  setSidebarCollapsed: (collapsed: boolean) => void; // Função para alternar o estado da sidebar
  currentPage: number; // Página atual do PDF
  numPages: number; // Total de páginas do PDF
  isDrawing: boolean; // Indica se o modo de desenho está ativo
  zoom: number; // Nível de zoom atual
}

// Componente de barra superior que exibe informações e controles de navegação
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
        {/* Lado esquerdo: botão da sidebar e info da página */}
        <div className="flex items-center space-x-4">
          {/* Botão de toggle da sidebar (visível apenas em telas menores) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Ícone de menu (hambúrguer) */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Informação da página atual */}
          <div className="text-lg font-semibold text-gray-800">
            Página {currentPage} de {numPages}
          </div>
        </div>

        {/* Lado direito: status de desenho e zoom (visível em telas médias para cima) */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Indicador de modo de desenho ativo */}
          {isDrawing && (
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              Modo desenho ativo
            </div>
          )}

          {/* Exibição do nível de zoom */}
          <div className="text-sm text-gray-500">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* Dica adicional quando o modo de desenho está ativo */}
      {isDrawing && (
        <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          💡 Clique no PDF para adicionar pontos ao polígono. Use os controles da barra lateral para finalizar.
        </div>
      )}
    </div>
  );
};
