import React from "react";
import JourneyModal from "../JourneyModal";
import { useJourneyStore } from "../../store/journeyStore";

const HomepageJourney: React.FC = () => {
  const { homepage, nextStep, completeJourney } = useJourneyStore();

  const handleSkipAll = () => completeJourney("homepage");
  const handleNext = () => nextStep("homepage");

  // Step 1: Welcome
  if (homepage.currentStep === 1 && !homepage.completed) {
    return (
      <JourneyModal
        show={true}
        onSkipAll={handleSkipAll}
        onSkip={handleNext}
        position={{ top: "50%", left: "50%" }}
      >
        <h3 className="font-bold text-lg mb-2">به میکسین سلام خوش آمدید!</h3>
        <p>
          اینجا مرکز فرماندهی شما برای مدیریت یکپارچه محصولاتتان در پلتفرم‌های
          میکسین و باسلام است. در چند مرحله کوتاه، بخش‌های اصلی را به شما معرفی
          می‌کنیم.
        </p>
      </JourneyModal>
    );
  }

  // Step 2: Statistics Introducer
  if (homepage.currentStep === 2 && !homepage.completed) {
    return (
      <JourneyModal
        show={true}
        onSkipAll={handleSkipAll}
        onSkip={handleNext}
        position={{ top: "220px", left: "50%" }}
        arrowPosition="top"
      >
        <h3 className="font-bold text-lg mb-2">آمار کلی در یک نگاه</h3>
        <p>
          در این سه بخش می‌توانید به سرعت تعداد کل محصولات خود در هر پلتفرم،
          تعداد محصولات مشترک و تعداد محصولات منحصر به فرد را مشاهده کنید.
        </p>
      </JourneyModal>
    );
  }

  // Step 3: Product Info Guide
  if (homepage.currentStep === 3 && !homepage.completed) {
    // For this step, the user must click a product. The `onSkip` is handled by the parent component.
    // The modal will point between the two lists.
    return (
      <JourneyModal
        show={true}
        onSkipAll={handleSkipAll}
        // No `onSkip` here, as progress is triggered by a user action (clicking a product)
        position={{ top: "450px", left: "50%" }}
        arrowPosition="top"
      >
        <h3 className="font-bold text-lg mb-2">مشاهده جزئیات محصول</h3>
        <p>
          با کلیک روی هر محصول در لیست‌های مختلف (مشترک یا منحصر به فرد)،
          می‌توانید جزئیات کامل آن را ببینید، آن را ویرایش کرده و یا همگام‌سازی
          کنید.
        </p>
        <p className="mt-2 font-semibold">
          برای ادامه، روی یکی از محصولات کلیک کنید.
        </p>
      </JourneyModal>
    );
  }

  return null;
};

export default HomepageJourney;
