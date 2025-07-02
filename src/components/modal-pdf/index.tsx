// src/components/Modal.tsx
import { type ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function ModalPdf({ children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-[#000000a1] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto relativ"
        onClick={(e) => e.stopPropagation()} // evita fechar ao clicar dentro
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Fechar modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
