import { X, AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuotaExceededModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'migration' | 'realtime'
}

export function QuotaExceededModal({ isOpen, onClose, type }: QuotaExceededModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const isMigration = type === 'migration'
  const title = isMigration ? 'حد مجاز مهاجرت محصولات تمام شده' : 'حد مجاز به‌روزرسانی لحظه‌ای تمام شده'
  const description = isMigration 
    ? 'شما به حد مجاز مهاجرت محصولات خود رسیده‌اید. برای ادامه مهاجرت محصولات، لطفاً پلن خود را ارتقا دهید.'
    : 'شما به حد مجاز به‌روزرسانی لحظه‌ای محصولات خود رسیده‌اید. برای ادامه به‌روزرسانی محصولات، لطفاً پلن خود را ارتقا دهید.'

  const handleUpgradePlan = () => {
    onClose()
    navigate('/pricing')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Animated Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-red-200 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
          {title}
        </h2>

        <p className="text-gray-700 text-sm mb-6 text-right leading-relaxed">
          {description}
        </p>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2 text-right">
            راه‌حل پیشنهادی:
          </h3>
          <ul className="text-blue-700 text-sm space-y-1 text-right">
            <li>• به صفحه تعرفه‌ها بروید</li>
            <li>• پلن مناسب خود را انتخاب کنید</li>
            <li>• پرداخت را انجام دهید</li>
            <li>• از دسترسی کامل به خدمات استفاده کنید</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpgradePlan}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
          >
            <span>ارتقا پلن</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            بستن
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          برای راهنمایی بیشتر با پشتیبانی تماس بگیرید
        </p>
      </div>
    </div>
  )
}
