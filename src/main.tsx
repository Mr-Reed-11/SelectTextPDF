// Importa o StrictMode do React para detectar problemas potenciais na aplicação
import { StrictMode } from 'react'

// Importa a função para criar a raiz de renderização
import { createRoot } from 'react-dom/client'

// Importa o arquivo global de estilos (Tailwind ou CSS customizado)
import './index.css'

// Importa o componente principal da aplicação
import App from './App.tsx'

// Cria a raiz React no elemento HTML com id "root" e renderiza o App dentro do StrictMode
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
