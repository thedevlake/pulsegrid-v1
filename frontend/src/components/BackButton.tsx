import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
}

export default function BackButton({ className = "", onClick }: BackButtonProps) {
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group ${
        theme === "dark"
          ? "text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
          : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
      } ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft 
        className={`w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1 ${
          theme === "dark" ? "text-slate-300 group-hover:text-white" : "text-blue-300 group-hover:text-white"
        }`}
      />
    </button>
  );
}

