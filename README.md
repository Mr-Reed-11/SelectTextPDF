# SelectTextPDF

Projeto para visualização e seleção interativa de áreas em arquivos PDF, permitindo extrair texto de regiões específicas através de polígonos.

---

## Tecnologias utilizadas

- React com TypeScript  
- Vite  
- Tailwind CSS  
- PDF.js  
- Canvas API  
- pnpm (gerenciador de pacotes)  
- GitHub (repositório)  
- Vercel (hospedagem de demonstração)

---

## Pré-requisitos

- Node.js (recomendado v16 ou superior)  
- pnpm instalado globalmente:  
npm install -g pnpm

---

## Como rodar o projeto localmente
- Clone o repositório:
- Acesse a pasta do projeto:
- Instale as dependências:
- pnpm install
- Inicie o servidor de desenvolvimento:
- pnpm run dev
- Abra o navegador no endereço indicado no terminal (geralmente http://localhost:5173).

---

## Como usar
- Faça upload de um arquivo PDF.
- Navegue pelas páginas com a barra de navegação.
- Utilize o modo desenho para criar polígonos clicando no PDF.
- Finalize o desenho usando os controles na barra lateral.
- As áreas selecionadas podem ser usadas para extração ou outras funcionalidades.

## Deploy
- O projeto está hospedado no Vercel para demonstração:
- [Link para o deploy](https://select-text-pdf.vercel.app)