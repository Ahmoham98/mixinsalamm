import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackHomeButton() {
  const navigate = useNavigate();
  return (
    <div dir="ltr" className="flex items-center justify-start mb-6">
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
      >
        <ArrowLeft size={20} />
        <span>بازگشت به صفحه اصلی</span>
      </button>
    </div>
  );
}
