import { useState } from "react";
import { UploadCloud } from "lucide-react";
import Header from "./components/header";
import Footer from "./components/footer";
import PdfViewer from "./components/pdf-viewer";
import ModalPdf from "./components/modal-pdf";

function App() {
  // Estado para armazenar o arquivo PDF selecionado
  const [file, setFile] = useState<File | null>(null);

  // Estado para controlar a exibição do modal
  const [modalOpen, setModalOpen] = useState(false);

  // Manipulador de mudança de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);     // Define o arquivo selecionado
      setModalOpen(true);        // Abre o modal
    }
  };

  // Função para fechar o modal
  const closeModal = () => {
    setModalOpen(false);         // Fecha o modal
    setFile(null);               // Limpa o arquivo selecionado (opcional)
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-white">
      {/* Cabeçalho da aplicação */}
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        {/* Card central com upload */}
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Seleção de Texto por Área
          </h2>
          <p className="text-gray-500 mb-6">
            Faça upload de um PDF e selecione uma região para extrair o texto.
          </p>

          {/* Botão estilizado para seleção de arquivo */}
          <label className="flex flex-col items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition duration-200 shadow-md">
            <UploadCloud size={24} />
            <span>Selecionar PDF</span>
            {/* Input oculto para upload de arquivo */}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Exibe o nome do arquivo selecionado */}
          {file && (
            <p className="mt-4 text-sm text-gray-600">
              Arquivo selecionado: <strong>{file.name}</strong>
            </p>
          )}
        </div>

        {/* Modal que exibe o visualizador de PDF se um arquivo estiver selecionado */}
        {modalOpen && file && (
          <ModalPdf onClose={closeModal}>
            <PdfViewer file={file} />
          </ModalPdf>
        )}
      </main>

      {/* Rodapé da aplicação */}
      <Footer />
    </div>
  );
}

export default App;
