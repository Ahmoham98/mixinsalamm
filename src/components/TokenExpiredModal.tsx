import React from "react";

interface TokenExpiredModalProps {
  open: boolean;
}

const TokenExpiredModal: React.FC<TokenExpiredModalProps> = ({ open }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            توکن شما منقضی شده است
          </h3>
          <p className="text-gray-600 mb-4">
            برای ادامه استفاده از خدمات، لطفاً دوباره وارد شوید.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span>در حال انتقال به صفحه ورود...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExpiredModal;
