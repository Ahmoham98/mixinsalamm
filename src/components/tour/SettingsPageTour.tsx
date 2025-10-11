import React, { useEffect, useState } from "react";
import { useTourStore } from "../../store/tourStore";
import TourModal from "./TourModal";
import { useAuthStore } from "../../store/authStore";

const SettingsPageTour: React.FC = () => {
  const { steps, setStep, nextStep } = useTourStore();
  const { isAuthenticated } = useAuthStore();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle window resize to recalculate positions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let selector;
    if (steps.settings === 1) selector = "#auto-sync-section";
    if (steps.settings === 2) selector = "#auto-sync-direction";
    if (steps.settings === 3) selector = "#auto-migration-section";
    if (steps.settings === 4) selector = "#save-settings-button";
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    }
  }, [steps.settings]);

  const handleSkipAll = () => {
    setStep("settings", -1);
  };

  const currentStep = steps.settings;

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
          onNext={() => nextStep("settings")}
          showNext={true}
          showSkip={false}
          position={{ right: "18rem", top: "6.5rem" }}
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">به صفحه تنظیمات خوش آمدید!</h3>
          <p>
            در این بخش می‌توانید فرآیندهای خودکار پلتفرم را مطابق با نیاز خود
            سفارشی‌سازی کنید تا مدیریت فروشگاه‌هایتان آسان‌تر شود.
          </p>
        </TourModal>
      );

    case 1:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("settings")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#auto-sync-section")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">همگام‌سازی خودکار</h3>
          <p>
            با فعال کردن این گزینه، هر زمان که محصولی را ویرایش کنید، نیازی به
            همگام‌سازی دستی نیست و سیستم به طور خودکار تغییرات را اعمال می‌کند.
          </p>
        </TourModal>
      );

    case 2:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("settings")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#auto-sync-direction")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">تعیین جهت همگام‌سازی</h3>
          <p>
            شما می‌توانید تعیین کنید که تغییرات از کدام پلتفرم به دیگری منتقل
            شوند. برای مثال، می‌توانید تنظیم کنید که همیشه اطلاعات محصولات در
            باسلام مطابق با میکسین بروزرسانی شوند.
          </p>
        </TourModal>
      );

    case 3:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("settings")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#auto-migration-section")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">انتقال خودکار محصولات</h3>
          <p>
            این گزینه به شما اجازه می‌دهد تا محصولات جدیدی که در میکسین اضافه
            می‌کنید، به صورت خودکار به باسلام نیز منتقل شوند. می‌توانید تعیین
            کنید که این فرآیند پس از افزوده شدن چند محصول جدید فعال شود. در حال
            حاضر، این قابلیت فقط برای انتقال از میکسین به باسلام فعال است.
          </p>
        </TourModal>
      );

    case 4:
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => setStep("settings", -1)} // End of tour
          showNext={true}
          showSkip={false}
          position={getElementPosition("#save-settings-button")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">ذخیره تغییرات</h3>
          <p>
            فراموش نکنید که پس از اعمال تغییرات، حتماً روی این دکمه کلیک کنید تا
            تنظیمات شما ذخیره شود.
          </p>
        </TourModal>
      );

    default:
      return null;
  }
};

export default SettingsPageTour;
