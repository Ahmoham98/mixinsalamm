import React from "react";
import { useTourStore } from "../../store/tourStore";
import TourModal from "./TourModal";
import { useAuthStore } from "../../store/authStore";

const PricingPageTour: React.FC = () => {
  const { steps, setStep, nextStep } = useTourStore();
  const { isAuthenticated } = useAuthStore();

  const handleSkipAll = () => {
    setStep("pricing", -1);
  };

  const currentStep = steps.pricing;

  if (!isAuthenticated() || currentStep === -1) {
    return null;
  }

  const getElementPosition = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element)
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const rect = element.getBoundingClientRect();
    return {
      top: `${rect.bottom + 15}px`,
      left: `${rect.left + rect.width / 2}px`,
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
        >
          <h3 className="font-bold text-lg mb-2">صفحه پلن‌ها و مصرف</h3>
          <p>
            ��ر این صفحه می‌توانید جزئیات پلن اشتراک فعلی خود را مشاهده کنید،
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
