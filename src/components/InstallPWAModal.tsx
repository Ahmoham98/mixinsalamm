import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // optional animation
import icon192 from "../assets/icon-192.png";

const InstallPWAModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const alreadyInstalled = localStorage.getItem("pwaInstalled");
    if (alreadyInstalled === "true") return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowModal(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem("pwaInstalled", "true");
      setShowModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwaInstalled", "true");
    }
    setDeferredPrompt(null);
    setShowModal(false);
  };

  const handleDismiss = () => {
    // Optional: you can set a timeout to re-show later
    setShowModal(false);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {/* App logo */}
            <div className="flex justify-center mb-4">
              <img
                src={icon192}
                alt="Mixinsalam Logo"
                className="w-16 h-16 rounded-lg shadow-md"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              میکسین سلام در صفحه اصلی
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              با اضافه کردن میکسین سلام به صفحه اصلیت، بهش سریعتر دسترسی پیدا کن
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleDismiss}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                شاید بعداً
              </button>
              <button
                onClick={handleInstall}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                آره حتماً 
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWAModal;
