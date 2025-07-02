import { FolderGit2 } from "lucide-react";
import logo from "../../assets/SelectTextPDF-logo.svg";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src={logo} alt="SelectTextPDF Logo" className="w-10 h-10" />
        <h1 className="text-xl font-semibold text-blue-600">Select Text PDF</h1>
      </div>
      <a
        href="https://github.com/Mr-Reed-11/SelectTextPDF"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
      >
        <FolderGit2 size={20} />
        <span className="text-sm">Ver no GitHub</span>
      </a>
    </header>
  );
}
