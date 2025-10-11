import React, { useEffect, useState } from "react";
import { useTourStore } from "../../store/tourStore";
import TourModal from "./TourModal";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const HomePageTour: React.FC = () => {
  const { steps, setStep, nextStep } = useTourStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
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
    if (steps.home === 1) selector = "#statistic-section";
    if (steps.home === 2) selector = "#product-list";
    if (steps.home === 3) selector = "#product-modal-fields";
    if (steps.home === 4) selector = "#product-modal-update-button";
    if (steps.home === 5) selector = "#homepage-migration-panel";
    if (steps.home === 6) selector = "#migration-modal-controls";
    if (steps.home === 7) selector = "#migration-modal-content";
    if (steps.home === 8) selector = "#realtime-automation-banner";
    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
    }
  }, [steps.home]);

  const handleSkipAll = () => {
    setStep("home", -1); // -1 signifies the tour is completed/skipped
  };

  const currentStep = steps.home;

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

  const getRealtimeBannerPosition = () => {
    const element = document.querySelector("#realtime-automation-banner");
    if (!element)
      return { top: "50vh", left: "50vw", transform: "translate(-50%, -50%)" };
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = windowSize.width;
    const viewportHeight = windowSize.height;
    
    // Calculate position relative to viewport for left side of banner
    let top = rect.bottom + 15;
    let left = rect.left + 100; // Offset to the left side
    
    // Ensure modal stays within viewport bounds
    const modalWidth = 350;
    const modalHeight = 200;
    
    if (left < modalWidth / 2) {
      left = modalWidth / 2;
    } else if (left > viewportWidth - modalWidth / 2) {
      left = viewportWidth - modalWidth / 2;
    }
    
    if (top + modalHeight > viewportHeight) {
      top = rect.top - modalHeight - 15;
    }
    
    return {
      top: `${Math.max(20, top)}px`,
      left: `${left}px`,
      transform: "translateX(-50%)",
    };
  };

  switch (currentStep) {
    case 0: // Welcome
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={false}
          position={{ right: "18rem", top: "6.5rem" }} // place next to sidebar in rtl layout
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">به میکسین سلام خوش آمدید!</h3>
          <p>
            این یک راهنمای سریع برای آشنایی شما با قابلیت‌های اصلی پلتفرم است.
            شما می‌توانید با دنبال کردن این راهنما، با بخش‌های مختلف و نحوه کار
            با آن‌ها آشنا شوید.
          </p>
        </TourModal>
      );

    case 1: // Statistic Introducer
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#statistic-section")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">آمار کلی محصولات</h3>
          <p>
            در این بخش می‌توانید نگاهی سریع به تعداد کل محصولات، محصولات مشترک
            بین دو پلتفرم و محصولات منحصر به فرد هر یک داشته باشید.
          </p>
        </TourModal>
      );

    case 2: // Product Info Guide
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            const mixin = document.querySelector("#first-common-mixin") as HTMLElement | null;
            const basalam = document.querySelector("#first-common-basalam") as HTMLElement | null;
            if (mixin) mixin.click(); else if (basalam) basalam.click();
            nextStep("home");
          }}
          showNext={true}
          showSkip={false}
          fixedPosition={true}
          position={{ top: "50vh", left: "50vw", transform: "translate(-50%, -50%)" }}
          arrow="top"
        >
          <h3 className="font-bold text-lg mb-2">مشاهده جزئیات محصول</h3>
          <p>
            با کلیک بر روی هر محصول در لیست‌ها، می‌توانید جزئیات آن را مشاهده،
            ویرایش و همگام‌سازی کنید. لطفاً برای ادامه راهنما، روی یکی از
            محصولات کلیک کنید.
          </p>
        </TourModal>
      );

    case 3: // Point to field images and update button
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            // Scroll to product modal fields to show the update button
            const fieldsElement = document.querySelector("#product-modal-fields");
            if (fieldsElement) {
              fieldsElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            nextStep("home");
          }}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#product-modal-fields")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">ویرایش اطلاعات محصول</h3>
          <p>
            در این مدال می‌توانید اطلاعات محصول مانند نام، قیمت، توضیحات و
            موجودی را تغییر دهید. برای دیدن دکمه بروزرسانی، به پایین اسکرول
            کنید.
          </p>
        </TourModal>
      );

    case 4: // Point to update button
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            // Scroll to update button first to show it properly
            const updateButton = document.querySelector("#product-modal-update-button");
            if (updateButton) {
              updateButton.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            
            // Close product modal by dispatching custom event
            const modalCloseBtn = document.querySelector('#product-modal-close-button') as HTMLElement || null;
            if (modalCloseBtn) {
              modalCloseBtn.click()
            }
            
            nextStep("home");
          }}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#product-modal-update-button")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">همگام‌سازی تغییرات</h3>
          <p>
            با کلیک بر روی دکمه "ویرایش"، تغییرات شما در پلتفرم‌های انتخاب
            شده اعمال می‌شود. شما می‌توانید این فرآیند را در صفحه تنظیمات خودکار
            کنید.
          </p>
        </TourModal>
      );

    case 5: // Migration Panel
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            // Open migration panel and scroll to start transfer button
            const startBtn = document.querySelector("#migration-panel-start-button") as HTMLElement | null;
            if (startBtn) {
              startBtn.click(); // Open migration modal
              setTimeout(() => {
                startBtn.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }
            nextStep("home");
          }}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#homepage-migration-panel")}
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">انتقال گروهی محصولات</h3>
          <p>
            با استفاده از این دکمه می‌توانید تمام محصولات خود را از میکسین به
            باسلام منتقل کنید. برای ادامه، روی دکمه "شروع انتقال" کلیک کنید.
          </p>
        </TourModal>
      );

    case 6: // Migration Panel - Pause and Concurrency
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#migration-modal-controls")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">مدیریت فرآیند انتقال</h3>
          <p>
            شما می‌توانید تعداد درخواست‌های همزمان را برای کنترل سرعت تنظیم کرده
            و یا فرآیند را در هر زمان متوقف و دوباره از سر بگیرید.
          </p>
        </TourModal>
      );

    case 7: // Migration Panel - Sections
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            // Close migration modal by dispatching custom event
            const closeBtn = document.querySelector("#migration-panel-close-button") as HTMLElement || null;
            if (closeBtn) {
              closeBtn.click();
            }
            nextStep("home");
          }}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#product-migration-list")}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">بخش‌های مختلف پنل انتقال</h3>
          <p>
            در بالا، محصولات قابل انتقال را می‌بینید. در وسط، دکمه شروع قرار
            دارد و در پایین، گزارش لحظه‌ای از محصولات ایجاد شده یا ناموفق را
            مشاهده می‌کنید. سیستم در صورت بروز خطا، تا ۳ بار برای ایجاد محصول
            تلاش می‌کند.
          </p>
        </TourModal>
      );

    case 8: // Realtime Automation Banner
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          onNext={() => {
            navigate("/settings");
            setStep("home", -1); // End home tour
            setStep("settings", 0); // Start settings tour
          }}
          showNext={true}
          showSkip={false}
          position={getRealtimeBannerPosition()}
          arrow="top"
          fixedPosition={true}
        >
          <h3 className="font-bold text-lg mb-2">
            اتوماسیون بروزرسانی لحظه‌ای
          </h3>
          <p>
            با کلیک بر روی این دکمه و فعال‌سازی در صفحه تنظیمات، دیگر نیازی به
            بروزرسانی دستی محصولات نخواهید داشت و همه چیز خودکار انجام می‌شود.
          </p>
        </TourModal>
      );

    default:
      return null;
  }
};

export default HomePageTour;
