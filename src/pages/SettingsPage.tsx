import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  CheckCircle2,
  Info,
  Save,
  Menu,
  Home,
  Package,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  ChevronDown,
} from "lucide-react";
import { Crown } from "lucide-react";
import { useTourStore } from "../store/tourStore";
import React, { Suspense } from "react";

// Lazy load tour component for better performance
const SettingsPageTour = React.lazy(() => import("../components/tour/SettingsPageTour"));

// Preload tour modal for better performance
const preloadSettingsPageTour = () => import("../components/tour/SettingsPageTour");

function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, clearCredentials } = useAuthStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    isSuccess: boolean;
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      if (!window.confirm("آیا مطمئن هستید که می‌خواهید خروج کنید؟")) {
        return;
      }

      clearCredentials();
      localStorage.removeItem("auth-storage");
      sessionStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("خطا در خروج. لطفا دوباره تلاش کنید.");
    }
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      autoSyncEnabled: enabled,
    }));
  };

  const handlePreferBasalamFromMixin = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      preferBasalamFromMixin: enabled,
      // Ensure mutual exclusivity
      preferMixinFromBasalam: enabled ? false : prev.preferMixinFromBasalam,
    }));
  };

  const handlePreferMixinFromBasalam = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      preferMixinFromBasalam: enabled,
      // Ensure mutual exclusivity
      preferBasalamFromMixin: enabled ? false : prev.preferBasalamFromMixin,
    }));
  };

  const handleAutoMigrationToggle = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      autoMigrationEnabled: enabled,
    }));
  };

  const handleThresholdChange = (threshold: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      autoMigrationThreshold: threshold,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Update the global store
      updateSettings(localSettings);

      setSaveMessage({
        text: "تنظیمات با موفقیت ذخیره شد",
        isSuccess: true,
      });

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage({
        text: "خطا در ذخیره تنظیمات",
        isSuccess: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10">
      <Suspense fallback={<div className="text-center p-4">در حال بارگذاری راهنما...</div>}>
        <SettingsPageTour />
      </Suspense>
      {/* Mobile menu button */}
      <button
        onClick={() => {
          setIsSidebarCollapsed(false);
          setIsSidebarOpen(true);
        }}
        className={`fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isSidebarCollapsed ? "block" : "hidden"}`}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full bg-white/80 backdrop-blur-md shadow-lg transform transition-all duration-300 ease-in-out z-40 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} ${isSidebarCollapsed ? "w-0" : "w-64"}`}
      >
        <div
          className={`p-6 h-full flex flex-col ${isSidebarCollapsed ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        >
          <div className="mb-8 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] bg-clip-text text-transparent">
                میکسین سلام
              </h2>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={handleBackToHome}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors text-right"
            >
              <Home size={20} />
              {!isSidebarCollapsed && <span>داشبورد</span>}
            </button>

            <button
              onClick={() => navigate("/migration")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Package size={20} />
              {!isSidebarCollapsed && <span>انتقال گروهی محصولات</span>}
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Crown size={20} />
              {!isSidebarCollapsed && <span>وضعیت پلن</span>}
            </button>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <BarChart2 size={20} />
              {!isSidebarCollapsed && <span>آمار و گزارشات</span>}
            </a>

            <div className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-[#5b9fdb]/10 rounded-lg">
              <Settings size={20} />
              {!isSidebarCollapsed && <span>تنظیمات</span>}
            </div>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] text-white rounded-lg hover:from-[#ff6040]/90 hover:to-[#5b9fdb]/90 transition-all duration-200 shadow-md hover:shadow-lg ${isSidebarCollapsed ? "px-3" : ""}`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>خروج</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${isSidebarOpen ? (isSidebarCollapsed ? "lg:mr-0" : "lg:mr-64") : "mr-0"}`}
      >
        {/* Header */}
        <header className="sticky top-0 bg-white/60 backdrop-blur-md shadow-lg z-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4 relative">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft size={20} />
                <span>بازگشت به صفحه اصلی</span>
              </button>
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#fa6b23] to-[#fa864b] bg-clip-text text-transparent">
                  تنظیمات
                </h1>
                <p className="text-gray-600 mt-1">
                  مدیریت تنظیمات حساب کاربری شما
                </p>
              </div>
              <div className="w-20"></div> {/* Spacer for centering */}
            </div>
            {/* Site Guide Link - bottom right of header */}
            <div style={{ position: "absolute", bottom: 0, right: 0, zIndex: 2000 }}>
              <button
                className="text-sm text-blue-600 bg-white/80 px-4 py-2 rounded-full shadow hover:bg-blue-50 transition"
                onMouseEnter={preloadSettingsPageTour}
                onFocus={preloadSettingsPageTour}
                onClick={() => { 
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  const st = useTourStore.getState(); 
                  st.setStep("settings", 0); 
                }}
              >
                راهنمای استفاده از سایت
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Auto-sync section */}
            <div
              className="p-6 border-b border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#5b9fdb]/10 to-[#5b9fdb]/20 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-[#5b9fdb]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    همگام‌سازی خودکار
                  </h2>
                  <p className="text-sm text-gray-600">
                    تنظیمات مربوط به به‌روزرسانی خودکار محصولات
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.autoSyncEnabled}
                        onChange={(e) => handleAutoSyncToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800" id="auto-sync-section">
                        فعال‌سازی همگام‌سازی خودکار
                      </h3>
                      {localSettings.autoSyncEnabled && (
                        <CheckCircle2 size={16} className="text-green-600" />
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-3" dir="rtl">
                      با فعال کردن این گزینه، هر زمان که محصولی در میکسین تغییر
                      کند و نیاز به همگام‌سازی با باسلام داشته باشد، سیستم به
                      طور خودکار تغییرات را اعمال خواهد کرد. این باعث می‌شود که
                      شما نیازی به کلیک دستی روی دکمه همگام‌سازی نداشته باشید.
                    </p>

                    <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                      <Info size={14} className="flex-shrink-0 mt-0.5" />
                      <div dir="rtl">
                        <strong>نکته مهم:</strong> این ویژگی فقط برای محصولاتی
                        کار می‌کند که هم در میکسین و هم در باسلام موجود باشند.
                        همگام‌سازی بعد از یک ثانیه از تشخیص تغییر انجام می‌شود.
                      </div>
                    </div>

                    {/* Direction preference checkboxes */}
                    <div
                      className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
                      dir="rtl"
                    >
                      <label className="flex items-center gap-3 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!localSettings.preferBasalamFromMixin}
                          onChange={(e) =>
                            handlePreferBasalamFromMixin(e.target.checked)
                          }
                        />
                        <span className="text-sm text-gray-800" id="auto-sync-direction">
                          به‌روزرسانی باسلام مطابق تغییرات میکسین
                        </span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!localSettings.preferMixinFromBasalam}
                          onChange={(e) =>
                            handlePreferMixinFromBasalam(e.target.checked)
                          }
                        />
                        <span className="text-sm text-gray-800">
                          به‌روزرسانی میکسین مطابق تغییرات باسلام
                        </span>
                      </label>
                      <div className="col-span-1 md:col-span-2 text-xs text-gray-600">
                        اگر هیچ‌کدام انتخاب نشود، رفتار پیش‌فرض فعلی (بر اساس
                        صفحهٔ باز) اعمال می‌شود. انتخاب یکی از گزینه‌ها باعث
                        می‌شود همیشه همان سمت به‌روزرسانی شود.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-migration section */}
            <div
              className="p-6 border-b border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#ff6040]/10 to-[#ff6040]/20 rounded-lg">
                  <Zap className="w-6 h-6 text-[#ff6040]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    انتقال خودکار محصولات
                  </h2>
                  <p className="text-sm text-gray-600">
                    تنظیمات مربوط به انتقال خودکار محصولات از میکسین به باسلام
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.autoMigrationEnabled}
                        onChange={(e) =>
                          handleAutoMigrationToggle(e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">
                        فعال‌سازی انتقال خودکار
                      </h3>
                      <div  id="auto-migration-section"></div>
                      {localSettings.autoMigrationEnabled && (
                        <CheckCircle2 size={16} className="text-green-600" />
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-3" dir="rtl">
                      با فعال کردن این گزینه، سیستم به طور خودکار محصولات جدید
                      میکسین را به باسلام منتقل خواهد کرد. این ویژگی برای
                      کاربران میکسین طراحی شده است که می‌خواهند محصولاتشان به
                      صورت خودکار در باسلام ایجاد شوند.
                    </p>

                    {/* Threshold selection */}
                    {localSettings.autoMigrationEnabled && (
                      <div className="mt-4 p-3 bg-white/60 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-3">
                          <ChevronDown size={16} className="text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">
                            انتخاب آستانه انتقال
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3" dir="rtl">
                          انتخاب کنید که پس از رسیدن به چند محصول منحصر به فرد
                          میکسین، انتقال خودکار شروع شود:
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 3, 5, 7, 9].map((threshold) => (
                            <button
                              key={threshold}
                              onClick={() => handleThresholdChange(threshold)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                localSettings.autoMigrationThreshold ===
                                threshold
                                  ? "bg-orange-600 text-white shadow-md"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                              }`}
                            >
                              {threshold}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500" dir="rtl">
                          انتخاب شده: {localSettings.autoMigrationThreshold}{" "}
                          محصول
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                      <Info size={14} className="flex-shrink-0 mt-0.5" />
                      <div dir="rtl">
                        <strong>نکته مهم:</strong> این ویژگی فقط محصولات منحصر
                        به فرد میکسین را منتقل می‌کند (محصولاتی که در باسلام
                        موجود نیستند). انتقال خودکار هر 30 ثانیه بررسی می‌شود و
                        فقط زمانی اجرا می‌شود که تعداد محصولات منحصر به فرد به
                        آستانه انتخابی برسد.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save button section */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600" id="save-settings-button">
                  تغییرات شما تا زمان کلیک روی دکمه ذخیره اعمال نخواهد شد.
                </div>

                <div className="flex items-center gap-4">
                  {saveMessage && (
                    <div
                      className={`flex items-center gap-2 text-sm ${saveMessage.isSuccess ? "text-green-600" : "text-red-600"}`}
                    >
                      {saveMessage.isSuccess ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Info size={16} />
                      )}
                      <span>{saveMessage.text}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isSaving
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-[#5b9fdb] to-[#ff6040] text-white hover:from-[#5b9fdb]/90 hover:to-[#ff6040]/90 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>ذخیره تنظیمات</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Future sections placeholder */}
          <div className="mt-8 bg-white/60 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center text-gray-500">
              <Settings size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                بخش‌های بیشتر در آینده
              </h3>
              <p className="text-sm">
                بخش‌های تنظیمات بیشتری در نسخه‌های آتی اضافه خواهد شد.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;
