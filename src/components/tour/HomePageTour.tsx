import React, { useEffect } from "react";
import { useTourStore } from "../../store/tourStore";
import TourModal from "./TourModal";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const HomePageTour: React.FC = () => {
  const { steps, setStep, nextStep } = useTourStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  

  useEffect(() => {
    // This effect can be used to find elements on the page if needed
    // For now, we assume they can be found with selectors or passed in
  }, []);

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
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const rect = element.getBoundingClientRect();
    return {
      top: `${rect.bottom + 15}px`,
      left: `${rect.left + rect.width / 2}px`,
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
        >
          <h3 className="font-bold text-lg mb-2">آمار کلی محصولا��</h3>
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
          showNext={false}
          showSkip={true}
          position={getElementPosition("#product-list")}
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
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#product-modal-fields")}
          arrow="top"
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
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={false}
          position={getElementPosition("#product-modal-update-button")}
          arrow="top"
        >
          <h3 className="font-bold text-lg mb-2">همگام‌سازی تغییرات</h3>
          <p>
            با کلیک بر روی دکمه "بروزرسانی"، تغییرات شما در پلتفرم‌های انتخاب
            شده اعمال می‌شود. شما می‌توانید این فرآیند را در صفحه تنظیمات خودکار
            کنید.
          </p>
        </TourModal>
      );

    case 5: // Migration Panel
      return (
        <TourModal
          onSkipAll={handleSkipAll}
          showNext={false}
          showSkip={true}
          position={getElementPosition("#migration-panel-start-button")}
          arrow="top"
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
          onNext={() => nextStep("home")}
          showNext={true}
          showSkip={true}
          position={getElementPosition("#migration-modal-content")}
          arrow="top"
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
          showSkip={true}
          position={getElementPosition("#realtime-automation-banner")}
          arrow="top"
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
