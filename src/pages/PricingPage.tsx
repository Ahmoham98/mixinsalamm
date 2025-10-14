import React, { useEffect, useState, useRef, Suspense } from "react";
import PricingTable, { Plan } from "../components/PricingTable";
import UsageDashboard from "../components/UsageDashboard";
import SubscriptionCard from "../components/SubscriptionCard";
import {
  getCurrentSubscription,
  createPayment,
  getPlans,
  getUsage,
  getPlanById,
} from "../services/api/pricing";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import BackHomeButton from "../components/BackHomeButton";
import { useTourStore } from "../store/tourStore";

// Lazy load tour component for better performance
const PricingPageTour = React.lazy(() => import("../components/tour/PricingPageTour"));

// Preload tour modal for better performance
const preloadPricingPageTour = () => import("../components/tour/PricingPageTour");

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [currentSubId, setCurrentSubId] = useState<number | null>(null);
  const [plansById, setPlansById] = useState<Record<number, any>>({});
  const [usage, setUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<Plan | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("");
  const [renewalDate, setRenewalDate] = useState<string | undefined>(undefined);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const { basalamCredentials, clearCredentials } = useAuthStore();
  const navigate = useNavigate();
  const pricingTableRef = useRef<HTMLDivElement>(null);

  const handleTokenExpired = () => {
    setShowTokenExpiredModal(true);
    setTimeout(() => {
      clearCredentials();
      localStorage.removeItem("auth-storage");
      sessionStorage.clear();
      navigate("/login");
    }, 4000);
  };

  useEffect(() => {
    Promise.all([getPlans(), getCurrentSubscription()])
      .then(async ([plansData, sub]) => {
        // Keep only active plans; backend may send boolean or string
        const activePlans = (plansData || []).filter(
          (p: any) =>
            p?.is_active === true ||
            p?.is_active === "TRUE" ||
            p?.is_active === "true",
        );
        setPlans(activePlans);
        const map: Record<number, any> = {};
        activePlans.forEach((p: any) => (map[p.id] = p));
        setPlansById(map);

        if (sub?.plan_id) {
          setCurrentPlanId(sub.plan_id);
          setCurrentSubId(sub.id);

          // Set subscription data
          setSubscriptionStatus(sub.status || "");
          setRenewalDate(sub.renewal_date);
          setCancelAtPeriodEnd(
            Boolean(
              sub.cancel_at_period_end === true ||
                sub.cancel_at_period_end === "TRUE" ||
                sub.cancel_at_period_end === "true",
            ),
          );

          // Set subscription plan
          if (sub.plan) {
            setSubscriptionPlan(sub.plan as Plan);
          } else if (sub.plan_id) {
            try {
              const plan = await getPlanById(Number(sub.plan_id));
              setSubscriptionPlan(plan as Plan);
            } catch (error) {
              console.error("Error fetching plan details:", error);
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching plans or subscription:", error);
        // Check for 401 unauthorized error
        if (error?.response?.status === 401 || error?.status === 401) {
          console.log("401 error detected: showing token expired modal");
          handleTokenExpired();
        }
      })
      .finally(() => {
        setLoading(false);
        setSubscriptionLoading(false);
      });
  }, [clearCredentials, navigate]);

  // Fetch usage data
  useEffect(() => {
    const token = basalamCredentials?.access_token;
    if (token) {
      getUsage()
        .then((usageData) => {
          // Handle array response - get first element
          const usageRecord = Array.isArray(usageData)
            ? usageData[0]
            : usageData;

          setUsage(usageRecord);
          setUsageLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching usage data:", error);
          // Check for 401 unauthorized error
          if (error?.response?.status === 401 || error?.status === 401) {
            console.log(
              "401 error detected in usage fetch: showing token expired modal",
            );
            handleTokenExpired();
          }
          setUsageLoading(false);
        });
    } else {
      setUsageLoading(false);
    }
  }, [basalamCredentials?.access_token, clearCredentials, navigate]);

  const handleSelectPlan = (planId: number) => {
    const plan = plans.find((p) => (p as any).id === planId) || null;
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const getPaymentUrl = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
      case "starter":
        return "https://karbalad.basalam.com/kar/22077";
      case "pro":
        return "https://karbalad.basalam.com/kar/22078";
      case "enterprise":
        return "https://karbalad.basalam.com/kar/22079";
      default:
        return "https://karbalad.basalam.com/kar/22077"; // Default to starter
    }
  };

  const validatePaymentId = (value: string) => {
    const v = (value || "").trim();
    if (!v) return "کد پیگیری پرداخت الزامی است";
    if (!/^\d+$/.test(v)) return "کد پیگیری باید فقط عدد باشد";
    if (v.length < 3) return "حداقل طول کد پیگیری 3 رقم است";
    if (v.length > 25) return "حداکثر طول کد پیگیری 25 رقم است";
    return "";
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !currentSubId) return;
    const err = validatePaymentId(paymentId);
    if (err) {
      setPaymentError(err);
      return;
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}/${pad(now.getHours())}:${pad(now.getMinutes())}`;

    await createPayment({
      subscription_id: currentSubId,
      amount: (plansById as any)[(selectedPlan as any).id]?.price_monthly ?? 0,
      currency: "toman",
      status: "in_process",
      payment_provider: "Basalam",
      provider_payment_id: paymentId,
      invoice_url: "No invoice_url provided for now",
      created_at: fmt,
      updated_at: fmt,
    });
    setShowModal(false);
    setPaymentId("");
    setPaymentError("");
  };

  

  if (loading)
    return (
      <div className="p-16 text-center text-gray-600">در حال بارگذاری...</div>
    );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f6ffe8] to-blue-50 py-12 px-4"
      dir="rtl"
    >
      <Suspense fallback={<div className="text-center p-4">در حال بارگذاری راهنما...</div>}>
        <PricingPageTour />
      </Suspense>
      <div className="max-w-6xl mx-auto" style={{position: 'relative'}}>
        {/* Site Guide Button - move to top left */}
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 2000 }}>
          <button
            className="text-sm text-blue-600 bg-white/80 px-4 py-2 rounded-full shadow hover:bg-blue-50 transition"
            onMouseEnter={preloadPricingPageTour}
            onFocus={preloadPricingPageTour}
            onClick={() => { 
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const st = useTourStore.getState(); 
              st.setStep("pricing", 0); 
            }}
          >
            راهنمای استفاده از سایت
          </button>
        </div>
        {/* Back to home header */}
        <BackHomeButton />
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#95ed2f] to-[#30cfb7] bg-clip-text text-transparent">
            مصرف فعلی شما
          </h1>
          <p className="text-gray-600 mt-2">
            شما می توانید وضعیت مصرف خود را در این بخش بررسی کنید.
          </p>
        </div>

        {/* Usage Dashboard and Subscription Section */}
        {usage && !usageLoading && currentPlanId && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-[#f6ffe8] backdrop-blur-md rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Card - left Side */}
                {subscriptionPlan && !subscriptionLoading && (
                  <div
                    className="transition-transform duration-300 lg:hover:scale-105"
                    id="subscription-card"
                  >
                    <SubscriptionCard
                      plan={subscriptionPlan}
                      status={subscriptionStatus}
                      renewalDate={renewalDate}
                      cancelAtPeriodEnd={cancelAtPeriodEnd}
                      onUpgradePlan={() => {
                        pricingTableRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }}
                    />
                  </div>
                )}

                {/* Usage Dashboard - right Side */}
                <div
                  className="transition-transform duration-300 lg:hover:scale-105"
                  id="usage-dashboard"
                >
                  <UsageDashboard
                    migrationsUsed={
                      usage?.migration_used ||
                      usage?.migrations_used ||
                      usage?.migrationUsed ||
                      0
                    }
                    migrationsQuota={(() => {
                      const currentPlan = plansById[currentPlanId];
                      const quota =
                        currentPlan?.quota_migration ??
                        currentPlan?.quota_migrations ??
                        0;
                      console.log(
                        "Current plan migration quota:",
                        quota,
                        "from plan:",
                        currentPlan,
                      );
                      return quota;
                    })()}
                    realtimeUsed={
                      usage?.realtime_used ||
                      usage?.realtimeUsed ||
                      usage?.realtime_updates_used ||
                      0
                    }
                    realtimeQuota={(() => {
                      const currentPlan = plansById[currentPlanId];
                      const quota = currentPlan?.quota_realtime_updates ?? 0;
                      console.log(
                        "Current plan realtime quota:",
                        quota,
                        "from plan:",
                        currentPlan,
                      );
                      return quota;
                    })()}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#95ed2f] to-[#30cfb7] bg-clip-text text-transparent">
            پلن‌های قیمت‌گذاری
          </h1>
          <p className="text-gray-600 mt-2">
            پلن مناسب کسب‌وکار خود را انتخاب کنید. امکان ارتقا در هر زمان وجود
            دارد.
          </p>
        </div>
        <div
          ref={pricingTableRef}
          className="bg-gradient-to-br from-[#f6ffe8] backdrop-blur-md rounded-2xl shadow-xl p-6"
          id="pricing-table-starter-plan"
        >
          <PricingTable
            plans={plans}
            currentPlanId={currentPlanId}
            onSelectPlan={handleSelectPlan}
          />
        </div>
      </div>

      {showModal && selectedPlan && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">
              ارتقای پلن به: {(selectedPlan as any).name}
            </h3>
            <div className="text-sm text-gray-700 space-y-2 mb-4">
              <p>برای بروزرسانی پلن، مراحل زیر را انجام دهید:</p>
              <ol className="list-decimal pr-5 space-y-1">
                <li>روی دکمه پرداخت کلیک کنید.</li>
                <li>پلن مربوطه را از فروشگاه باسلام خریداری کنید.</li>
                <li>
                  کد پیگیری پرداخت (payment_id) را در فیلد زیر وارد کرده و روی
                  ارسال بزنید.
                </li>
                <li>
                  سپس با پشتیبانی تماس بگیرید و کد پیگیری و اسکرین‌شات پرداخت
                  موفق را ارسال کنید.
                </li>
                <li>
                  بین ۳۰ دقیقه تا ۵ ساعت (ساعات کاری) منتظر بمانید تا اشتراک شما
                  به‌روزرسانی شود.
                </li>
                <li>
                  تبریک! دسترسی کامل برای انتقال یا بروزرسانی لحظه‌ای محصولات
                  فعال می‌شود.
                </li>
              </ol>
            </div>
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <input
                  value={paymentId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentId(v);
                    setPaymentError(validatePaymentId(v));
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={25}
                  className={`w-full border rounded px-3 py-2 ${paymentError ? "border-red-400" : ""}`}
                  placeholder="کد پیگیری پرداخت (فقط عدد)"
                />
                {paymentError && (
                  <div className="mt-1 text-xs text-red-600" dir="rtl">
                    {paymentError}
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmitPayment}
                disabled={!!paymentError || !paymentId}
                className={`px-4 py-2 rounded text-white ${!!paymentError || !paymentId ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#95ed2f] to-[#30cfb7] hover:from-[#84d628] hover:to-[#26b9a3]"}`}
              >
                ارسال
              </button>
            </div>
            <div className="flex justify-between">
              <a
                href={getPaymentUrl((selectedPlan as any).name)}
                target="_blank"
                className="px-4 py-2 bg-gradient-to-r from-[#95ed2f] to-[#30cfb7] text-white rounded hover:from-[#84d628] hover:to-[#26b9a3]"
              >
                پرداخت
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Expired Modal */}
      {showTokenExpiredModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                توکن شما منقضی شده است
              </h3>
              <p className="text-gray-600 mb-4">
                برای ادامه استفاده از خدمات، لطفاً دوباره وارد شوید.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>در حال انتقال به صفحه ورود...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
