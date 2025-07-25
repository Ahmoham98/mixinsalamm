import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Main App component for the landing page
function LandingPage() { // Changed function name from App to LandingPage
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Array of placeholder images - Ensure these paths are correct relative to your public folder
  const images = [
    '/my-image-2.png', // Correct path for image in public/ (This image will be in nth-child(1))
    '/my-image-3.png', // Correct path for image in public/ (This image will be in nth-child(2))
    '/my-image-3.png'  // Correct path for image in public/ (This image will be in nth-child(3))
  ];

  // State to track scroll position and header visibility
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true); // Initially show header

  // Function to handle scroll events
  const handleScroll = () => {
    // Only apply logic if scrolling beyond a small threshold to avoid flicker at top
    if (window.scrollY > 100) { // If scrolled down more than 100px
      if (window.scrollY < lastScrollY) { // Scrolling up
        setShowHeader(true);
      } else if (window.scrollY > lastScrollY) { // Scrolling down
        setShowHeader(false);
      }
    } else { // At the very top of the page (or within 100px), always show header
      setShowHeader(true);
    }
    setLastScrollY(window.scrollY); // Update last scroll position
  };

  // Add and remove scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]); // Dependency on lastScrollY to re-run effect when scroll position changes

  const handleStartClick = () => {
    // Navigate to the HomePage when the "شروع" button is clicked
    navigate('/home'); // Assuming your HomePage is at '/home' as per your App.tsx
  };

  return (
    // Apply Vazirmatn font to the entire app and set text direction to RTL
    // Changed overall background from bg-gray-50 to bg-white to match sections
    <div dir="rtl" className="min-h-screen bg-white text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
      {/* Import Vazirmatn and Roboto fonts */}
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/Vazirmatn-Variable.css');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap'); /* Added Roboto font */

        /* Define CSS variables for orbital radius */
        :root {
          --radius-base: 85px; /* Base radius for smaller screens */
          --radius-sm: 105px;  /* Radius for small screens (sm breakpoint) */
          --radius-lg: 125px;  /* Radius for large screens (lg breakpoint) */
        }

        /* Keyframes for the orbital path rotation */
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        /* Keyframes for counter-rotating the image content to keep it upright */
        @keyframes counterRotateContent {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg); /* Reverse rotation to keep content upright */
          }
        }

        /* The orbital path container that rotates and carries the image items */
        .orbital-path {
          position: absolute;
          width: 100%; /* Occupy full space of parent div */
          height: 100%;
          animation: orbit 60s linear infinite; /* This element rotates */
        }

        /* Individual image item container */
        .image-item {
          position: absolute;
          width: 130px; /* Base size of individual images */
          height: 130px;
          overflow: hidden;
          /* Added rounded-full and shadow for better visual appeal */
          border-radius: 9999px; /* Tailwind's rounded-full */
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Tailwind's shadow-lg */
        }

        /* Image content inside the item, counter-rotates */
        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: counterRotateContent 60s linear infinite; /* Image content counter-rotates */
        }

        /* Positioning for each image - using calculated top/left for a fixed position on the circle */
        /* The orbital-path will rotate these fixed positions */
        /* Values for sin/cos of 0, 120, 240 degrees are used for positioning */
        /* Adjusted top/left to account for the item's own width/height to center it */
        .image-item:nth-child(1) { /* 0 degrees: right side */
          top: calc(50% + (0 * var(--radius-base)) - (130px / 2)); /* sin(0) = 0, subtract half width for centering */
          left: calc(50% + (1 * var(--radius-base)) - (130px / 2)); /* cos(0) = 1, subtract half height for centering */
        }
        .image-item:nth-child(2) { /* 120 degrees */
          top: calc(50% + (0.866 * var(--radius-base)) - (130px / 2)); /* sin(120) = 0.866 */
          left: calc(50% + (-0.5 * var(--radius-base)) - (130px / 2)); /* cos(120) = -0.5 */
        }
        .image-item:nth-child(3) { /* 240 degrees */
          top: calc(50% + (-0.866 * var(--radius-base)) - (130px / 2)); /* sin(240) = -0.866 */
          left: calc(50% + (-0.5 * var(--radius-base)) - (130px / 2)); /* cos(240) = -0.5 */
        }

        /* Responsive adjustments for image positioning and size */
        @media (min-width: 640px) { /* sm breakpoint */
          .image-item {
            width: 160px; /* Increased size for sm breakpoint */
            height: 160px;
          }
          .image-item:nth-child(1) {
            top: calc(50% + (0 * var(--radius-sm)) - (160px / 2));
            left: calc(50% + (1 * var(--radius-sm)) - (160px / 2));
          }
          .image-item:nth-child(2) {
            top: calc(50% + (0.866 * var(--radius-sm)) - (160px / 2));
            left: calc(50% + (-0.5 * var(--radius-sm)) - (160px / 2));
          }
          .image-item:nth-child(3) {
            top: calc(50% + (-0.866 * var(--radius-sm)) - (160px / 2));
            left: calc(50% + (-0.5 * var(--radius-sm)) - (160px / 2));
          }
        }

        @media (min-width: 1024px) { /* lg breakpoint */
          .image-item {
            width: 190px; /* Increased size for lg breakpoint */
            height: 190px;
          }
          .image-item:nth-child(1) {
            top: calc(50% + (0 * var(--radius-lg)) - (190px / 2));
            left: calc(50% + (1 * var(--radius-lg)) - (190px / 2));
          }
          .image-item:nth-child(2) {
            top: calc(50% + (0.866 * var(--radius-lg)) - (190px / 2));
            left: calc(50% + (-0.5 * var(--radius-lg)) - (190px / 2));
          }
          .image-item:nth-child(3) {
            top: calc(50% + (-0.866 * var(--radius-lg)) - (190px / 2));
            left: calc(50% + (-0.5 * var(--radius-lg)) - (190px / 2));
          }
        }
      `}</style>

      {/* Header Section - Apply fixed position and dynamic transform for reveal on scroll up */}
      {/* Changed bg-white to bg-gray-100 to match footer background */}
      {/* Removed max-w-6xl to make it full width */}
      <header className={`w-full flex flex-col sm:flex-row justify-between items-center py-3 px-6 bg-gray-100 fixed top-0 z-50 transition-transform duration-300 ease-out ${showHeader ? 'translate-y-0 shadow-md' : '-translate-y-full'}`}>
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 order-2 sm:order-1" style={{ fontFamily: "'Roboto', sans-serif" }}>
          mixinsalam
        </h1>
        <nav className="flex space-x-2 sm:space-x-3 rtl:space-x-reverse order-1 sm:order-2">
          <button
            onClick={handleStartClick} // Added onClick handler
            className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 w-28 text-center"
          >
            شروع
          </button>
          <a href="#contact-us" className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 w-28 text-center flex items-center justify-center">
            تماس با ما
          </a>
        </nav>
      </header>

      {/* Main Body Section - Add margin-top to push content down below the fixed header */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-2 bg-white p-6 sm:p-8 mt-[80px]"> {/* Added mt-[80px] */}
        {/* Added a very light border to the welcome section */}
        <section className="w-full lg:w-1/2 text-right p-4 order-1 border border-gray-100 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold text-blue-600 mb-4">
            به میکسین سلام خوش آمدید!
          </h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-6">
            مدیریت یکپارچه، فروش بیشتر!
            <br />
            دیگر نگران مدیریت محصولات خود در میکسین و باسلام نباشید. با پلتفرم ما، همه چیز در یک نگاه!
            <a href="#goals" className="text-blue-500 hover:text-blue-700 font-bold mr-2 transition duration-300 ease-in-out">
              ...
            </a>
          </p>
        </section>

        <section className="w-full lg:w-1/2 flex justify-center items-center p-4 order-2">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 flex justify-center items-center">
            <div className="orbital-path">
              {images.map((src, index) => (
                <div key={index} className="image-item">
                  <img src={src} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section id="goals" className="w-full max-w-6xl bg-white p-6 sm:p-8 mt-2 text-right">
        {/* Changed text-gray-900 to text-blue-900 for navy blue color */}
        <h2 className="text-3xl font-bold text-blue-900 mb-4">
          اهداف سایت ما
        </h2>
        <ul className="list-disc pr-6 text-lg leading-relaxed text-gray-700 space-y-4">
          <li>
            <span className="font-semibold text-blue-700">یکپارچه‌سازی کامل فروشگاه‌ها</span>
            <br />
            همه محصولاتت در یک‌جا
            <br />
            بدون نیاز به رفتن به میکسین یا باسلام، همه محصولاتت رو یکجا ببین و مدیریت کن.
          </li>
          <li>
            <span className="font-semibold text-blue-700">مدیریت هوشمند محصولات</span>
            <br />
            بدون محصول تکراری، بدون سردرگمی
            <br />
            می‌فهمی کدوم محصول فقط توی یک سایت هست و با یه کلیک اون رو به سایت دیگه اضافه می‌کنی.
          </li>
          <li>
            <span className="font-semibold text-blue-700">تغییر بده، هم‌زمان بروزرسانی شو</span>
            <br />
            هر ویرایشی که بزنی (قیمت، عکس، توضیح...) فوراً توی هر دو سایت اعمال می‌شه.
          </li>
          <li>
            <span className="font-semibold text-blue-700">کاهش خطا و افزایش سرعت</span>
            <br />
            وقت کمتر برای مدیریت، تمرکز بیشتر برای فروش
            <br />
            با حذف کارهای تکراری و ورود داده تکراری، همه‌چیز سریع‌تر و بدون خطا پیش می‌ره.
          </li>
          <li>
            <span className="font-semibold text-blue-700">تجربه‌ای راحت برای همه</span>
            <br />
            رابط ساده، کارایی بالا
            <br />
            طراحی شده برای اینکه حتی بدون دانش فنی هم بتونی راحت باهاش کار کنی و ازش لذت ببری.
          </li>
        </ul>
      </section>

      {/* Changed bg-gray-100 to bg-white to match the main content sections */}
      {/* Removed max-w-6xl to make it full width */}
      <footer className="w-full flex flex-col sm:flex-row justify-between items-start gap-8 bg-white p-6 sm:p-8 mt-8 text-gray-800 border-t border-gray-200">
        <div className="flex-1 text-right">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">درباره ما</h3>
          <p className="text-md leading-relaxed text-gray-700">
            پلتفرم mixinsalam با هدف ساده‌سازی مدیریت فروش برای کسب‌وکارهای آنلاین طراحی شده است. ما به شما کمک می‌کنیم تا با یکپارچه‌سازی فروشگاه‌های خود در میکسین و باسلام، زمان و انرژی بیشتری برای توسعه کسب‌وکارتان داشته باشید.
          </p>
        </div>

        <div id="contact-us" className="flex-1 text-right">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">تماس با ما</h3>
          <p className="text-md leading-relaxed text-gray-700 mb-2">
            شماره تماس ۱: 0912-123-4567
          </p>
          <p className="text-md leading-relaxed text-gray-700">
            شماره تماس ۲: 0935-987-6543
          </p>
          <p className="text-md leading-relaxed text-gray-700">
            شماره تماس ۳: 0996-227-8508
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage; // Export as LandingPage
