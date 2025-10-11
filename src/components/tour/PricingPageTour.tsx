import React, { useEffect, useState } from "react";
import { useTourStore } from "../../store/tourStore";
import TourModal from "./TourModal";
import { useAuthStore } from "../../store/authStore";

const PricingPageTour: React.FC = () => {
  const { steps, setStep, nextStep } = useTourStore();
  const { isAuthenticated } = useAuthStore();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const handleSkipAll = () => {
    setStep("pricing", -1);
  };

  const currentStep = steps.pricing;

  // Handle window resize to recalculate positions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let selector: string | undefined;
    if (currentStep === 1) selector = "#subscription-card";
    if (currentStep === 2) selector = "#usage-dashboard";
    if (currentStep === 3) selector = "#pricing-table-starter-plan";
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    }
  }, [currentStep]);

  if (!isAuthenticated() || currentStep === -1) {
    return null;
  }

  const getElementPosition = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element)
      return { top: "50vh", left: "50vw", transform: "translate(-50%, -50%)" };
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = windowSize.width;
    const viewportHeight = windowSize.height;
    
    // Calculate position relative to viewport
    let top = rect.bottom + 15;
    let left = rect.left + rect.width / 2;
    
    // Ensure modal stays within viewport bounds
    const modalWidth = 350; // TourModal width
    const modalHeight = 200; // Approximate TourModal height
    
    if (left < modalWidth / 2) {
      left = modalWidth / 2;
    } else if (left > viewportWidth - modalWidth / 2) {
      left = viewportWidth - modalWidth / 2;
    }
    
    if (top + modalHeight > viewportHeight) {
      // If modal would go off bottom, position above element
      top = rect.top - modalHeight - 15;
    }
    
    return {
      top: `${Math.max(20, top)}px`,
      left: `${left}px`,
      transform: "translateX(-50%)",
    };
  };

  switch (currentStep) {
    case 0:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("pricing")}
          showNext={true}
          showSkip={false}
          position={{ right: "10rem", top: "6.5rem" }}
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">صفحه پلن‌ها و مصرف</h3>
          <p>
            در این صفحه می‌توانید جزئیات پلن اشتراک فعلی خود را مشاهده کنید،
            میزان مصرف خود از قابلیت‌های پلتفرم را بسنجید و در صورت نیاز پلن خود
            را ارتقا دهید.
          </p>
        </TourModal>
      );

    case 1:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("pricing")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#subscription-card")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">جزئیات اشتراک فعلی</h3>
          <p>
            این بخش اطلاعات پلن فعلی شما، وضعیت آن و میزان مصرف شما از
            قابلیت‌های انتقال گروهی و بروزرسانی لحظه‌ای را نمایش می‌دهد. توجه
            داشته باشید که پلن‌ها محدودیت زمانی ندارند و بر اساس میزان مصرف شما
            هستند.
          </p>
        </TourModal>
      );

    case 2:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("pricing")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#usage-dashboard")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">داشبورد مصرف</h3>
          <p>
            در این قسمت می‌توانید به تفکیک ببینید که چه میزان از سهمیه انتقال
            محصول و بروزرسانی لحظه‌ای خود را استفاده کرده‌اید.
          </p>
        </TourModal>
      );

    case 3:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => setStep("pricing", -1)} // End of tour
          showNext={true}
          showSkip={false}
          position={getElementPosition("#pricing-table-starter-plan")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">انتخاب و ارتقا پلن</h3>
          <p>
            در این جدول می‌توانید پلن‌های مختلف را مقایسه و بر اساس نیاز
            کسب‌وکار خود، پلن مناسب را انتخاب و خریداری کنید.
          </p>
        </TourModal>
      );

    default:
      return null;
  }
};

export default PricingPageTour;
