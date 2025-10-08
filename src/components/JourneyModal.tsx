import React from "react";
import { X } from "lucide-react";

interface JourneyModalProps {
  children: React.ReactNode;
  onSkipAll: () => void;
  onSkip?: () => void; // Optional skip for a single step
  show: boolean;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  arrowPosition?: "top" | "bottom" | "left" | "right";
}

const JourneyModal: React.FC<JourneyModalProps> = ({
  children,
  onSkipAll,
  onSkip,
  show,
  position = {},
  arrowPosition,
}) => {
  if (!show) return null;

  const modalStyle: React.CSSProperties = {
    position: "fixed",
    ...position,
    transform: "translate(-50%, -50%)", // Default centering
  };

  // Adjust transform based on position to keep it on screen
  if (position.top) modalStyle.transform = "translate(-50%, 0)";
  if (position.left) modalStyle.transform = "translate(0, -50%)";
  if (position.right) modalStyle.transform = "translate(0, -50%)";
  if (position.bottom) modalStyle.transform = "translate(-50%, 0)";

  if (position.top && position.left) modalStyle.transform = "translate(0,0)";
  if (position.top && position.right) modalStyle.transform = "translate(0,0)";
  if (position.bottom && position.left) modalStyle.transform = "translate(0,0)";
  if (position.bottom && position.right)
    modalStyle.transform = "translate(0,0)";

  const arrowClasses = {
    top: "absolute bottom-full left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-cream-100",
    bottom:
      "absolute top-full left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-cream-100",
    left: "absolute right-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8 border-r-cream-100",
    right:
      "absolute left-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-l-8 border-l-cream-100",
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onSkip}></div>

      {/* Modal */}
      <div
        style={modalStyle}
        className="z-[101] bg-cream-100/90 backdrop-blur-md text-gray-800 p-6 rounded-lg shadow-2xl w-96 max-w-[90vw] border border-cream-200"
        dir="rtl"
      >
        {arrowPosition && <div className={arrowClasses[arrowPosition]}></div>}

        <div className="text-sm leading-relaxed">{children}</div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-200">
          <button
            onClick={onSkipAll}
            className="text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            رد کردن همه
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              بعدی
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default JourneyModal;
