// Representa um ponto com coordenadas normalizadas (valores entre 0 e 1 em relação à largura/altura da página)
export interface Point {
  x: number; // Coordenada X (horizontal)
  y: number; // Coordenada Y (vertical)
}

// Representa um polígono desenhado sobre o PDF
export interface Polygon {
  points: Point[]; // Lista de pontos que compõem o polígono (ordem importa)
  id: string; // Identificador único do polígono
  pageNumber: number; // Número da página do PDF em que o polígono está desenhado
}

// Representa o texto extraído de uma área delimitada por um polígono
export interface ExtractedText {
  pageNumber: number; // Número da página de onde o texto foi extraído
  text: string; // Texto extraído do PDF
  polygonId: string; // ID do polígono associado a essa extração
}

// Props esperadas pelo componente de visualização de PDF
export interface PdfViewerProps {
  file: File | null; // Arquivo PDF carregado (ou null, se nenhum foi selecionado)
}
