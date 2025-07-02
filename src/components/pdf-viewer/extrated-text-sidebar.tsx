import type { ExtractedText } from "./types";

interface RightSidebarProps {
  showExtractedText: boolean;
  setShowExtractedText: (show: boolean) => void;
  extractedTexts: ExtractedText[];
  scrollToPage: (pageNumber: number) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  showExtractedText,
  setShowExtractedText,
  extractedTexts,
  scrollToPage,
}) => {
  if (!showExtractedText || extractedTexts.length === 0) return null;

  return (
    <div className="
      w-full lg:w-80
      transition-all duration-300 ease-in-out
      bg-white border-l border-gray-200 shadow-sm flex flex-col
    ">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Texto Extraído
          </h2>
          <button
            onClick={() => setShowExtractedText(false)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Fechar painel texto extraído"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Textos extraídos:</span>
            <span className="font-medium text-green-600">{extractedTexts.length}</span>
          </div>
        </div>
      </div>

      {/* Extracted Texts */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Resultados
          </h3>
          
          <div className="space-y-3">
            {extractedTexts.map((result, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 shadow-sm">
                {/* Page Header */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Página {result.pageNumber}
                    </span>
                    <button
                      onClick={() => scrollToPage(result.pageNumber)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-xs flex items-center"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Ir para página
                    </button>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="p-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {result.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};