// src/App.jsx
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import Header from "./components/header";
import Footer from "./components/footer";

function App() {
  const [fileName, setFileName] = useState(null);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-white">
      {/* Header */}
      <Header />

      {/* Conteúdo principal */}
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Seleção de Texto por Área</h2>
          <p className="text-gray-500 mb-6">
            Faça upload de um PDF e selecione uma região para extrair o texto.
          </p>

          <label className="flex flex-col items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition duration-200 shadow-md">
            <UploadCloud size={24} />
            <span>Selecionar PDF</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {fileName && (
            <p className="mt-4 text-sm text-gray-600">
              Arquivo selecionado: <strong>{fileName}</strong>
            </p>
          )}

          <p className="mt-8 text-sm text-gray-400">
            Em breve: visualização das páginas e seleção da área para extração.
          </p>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
