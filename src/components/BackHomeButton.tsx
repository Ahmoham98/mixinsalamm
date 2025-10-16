import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackHomeButton() {
  const navigate = useNavigate()
  return (
    <div dir="ltr" className="flex items-center justify-start mb-4">
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 text-xs sm:text-sm"
      >
        <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">بازگشت</span>
      </button>
    </div>
  )
}



