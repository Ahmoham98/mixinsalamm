import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuotaBannerProps {
  open: boolean;
  type: 'migration' | 'realtime' | null;
  onClose: () => void;
}

const QuotaBanner: React.FC<QuotaBannerProps> = ({ open, type, onClose }) => {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
    if (open) {
      const t = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 10000); // 10 seconds
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  if (!visible || !type) return null;

  const title = type === 'migration' ? 'سقف انتقال محصولات شما پر شده است' : 'سقف بروزرسانی لحظه‌ای شما پر شده است';
  const desc = type === 'migration'
    ? 'برای ادامه انتقال گروهی محصولات، لازم است پلن اشتراک خود را ارتقا دهید.'
    : 'برای ادامه استفاده از بروزرسانی لحظه‌ای، لازم است پلن اشتراک خود را ارتقا دهید.';

  return (
    <div dir="rtl" className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-2 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 shadow-sm">
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-bold text-orange-700 mb-1">{title}</h3>
              <p className="text-xs sm:text-sm text-orange-700/90">{desc} می‌توانید از طریق دکمه زیر به صفحه قیمت‌گذاری بروید و پلن مناسب را انتخاب کنید.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/pricing"
                className="px-3 sm:px-4 py-2 rounded-lg bg-white text-orange-700 border border-orange-300 hover:bg-orange-100 transition-colors text-xs sm:text-sm shadow"
              >
                ارتقای پلن
              </Link>
              <button
                onClick={onClose}
                className="p-2 text-orange-700/80 hover:text-orange-900 hover:bg-orange-100 rounded-lg transition-colors"
                aria-label="بستن"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaBanner;
