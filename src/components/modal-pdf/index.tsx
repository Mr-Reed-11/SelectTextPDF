// src/components/Modal.tsx
import { type ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function ModalPdf({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-[#000000a1] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-[95vw] w-full max-h-[95vh] overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()} // evita fechar ao clicar dentro
      >
        {/* Header do modal com botão de fechar */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800">
            Visualizador de PDF com Extração de Texto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full p-2 transition-colors"
            aria-label="Fechar modal"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Conteúdo do modal */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        
        {/* Footer opcional com instruções */}
        <div className="p-3 bg-gray-50 border-t text-sm text-gray-600 rounded-b-xl">
          <div className="flex flex-wrap gap-4 text-xs">
            <span>💡 <strong>Dica:</strong> Desenhe polígonos nas áreas que deseja extrair texto</span>
            <span>🔄 Use "Extrair de Todas as Páginas" para aplicar em todo o documento</span>
            <span>🧹 "Limpar Seleções" remove todos os polígonos</span>
          </div>
        </div>
      </div>
    </div>
  );
}