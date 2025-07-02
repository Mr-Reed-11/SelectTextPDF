import { type ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function ModalPdf({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-[#0000008f] backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden relative flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do modal */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <svg 
                className="w-6 h-6 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                Visualizador de PDF
              </h2>
              <p className="text-sm text-gray-600 hidden sm:block">
                Extraia texto de áreas específicas do documento
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all duration-200 hover:rotate-90 group"
            aria-label="Fechar modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:scale-110"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
                
        {/* Conteúdo do modal */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {children}
        </div>
                
        {/* Footer com instruções */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Desenhe polígonos</span>
              <span className="hidden sm:inline">nas áreas de interesse</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Use zoom</span>
              <span className="hidden sm:inline">para maior precisão</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Extraia texto</span>
              <span className="hidden sm:inline">de todas as páginas</span>
            </div>
          </div>
          
          {/* Keyboard shortcuts - apenas em telas maiores */}
          <div className="hidden lg:flex items-center justify-center mt-3 pt-3 border-t border-gray-300">
            <div className="flex items-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>
                <span>Fechar</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">+</kbd>
                <span>Zoom in</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">-</kbd>
                <span>Zoom out</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}