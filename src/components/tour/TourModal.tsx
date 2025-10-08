import React, { ReactNode } from "react";

interface TourModalProps {
  children: ReactNode;
  onSkipAll: () => void;
  onNext?: () => void;
  showNext: boolean;
  showSkip: boolean;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  arrow?: "top" | "bottom" | "left" | "right";
}

const TourModal: React.FC<TourModalProps> = ({
  children,
  onSkipAll,
  onNext,
  showNext,
  showSkip,
  position = {},
  arrow,
}) => {
  const modalStyle: React.CSSProperties = {
    position: "absolute",
    ...position,
    backgroundColor: "rgba(255, 253, 248, 0.9)", // Cream color with low opacity
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    padding: "20px",
    width: "350px",
    maxWidth: "90vw",
    zIndex: 1001, // Ensure modal is above the overlay
    direction: "rtl",
  };

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid",
    ...getArrowPosition(arrow),
  };

  function getArrowPosition(direction?: "top" | "bottom" | "left" | "right") {
    const arrowSize = 10;
    switch (direction) {
      case "top":
        return {
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent rgba(255, 253, 248, 0.9) transparent`,
        };
      case "bottom":
        return {
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: `rgba(255, 253, f248, 0.9) transparent transparent transparent`,
        };
      case "left":
        return {
          top: "50%",
          right: "100%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: `transparent rgba(255, 253, 248, 0.9) transparent transparent`,
        };
      case "right":
        return {
          top: "50%",
          left: "100%",
          transform: "translateY(-50%)",
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent transparent rgba(255, 253, 248, 0.9)`,
        };
      default:
        return {};
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black z-1000"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={onNext} // Allow clicking background to go to next step
      />
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {arrow && <div style={arrowStyle} />}
        <div className="text-right text-gray-800">{children}</div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={onSkipAll}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            رد کردن همه
          </button>
          <div>
            {showSkip && (
              <button
                onClick={onNext}
                className="text-sm text-blue-500 hover:text-blue-700 ml-4 transition-colors"
              >
                رد کردن
              </button>
            )}
            {showNext && (
              <button
                onClick={onNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                بعدی
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TourModal;
