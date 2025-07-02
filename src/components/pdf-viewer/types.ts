export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  points: Point[];
  id: string;
  pageNumber: number;
}

export interface ExtractedText {
  pageNumber: number;
  text: string;
  polygonId: string;
}

export interface PdfViewerProps {
  file: File | null;
}