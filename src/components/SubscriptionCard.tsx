import React from "react";
import { Plan } from "./PricingTable";
import { CheckCircle, Calendar, Package, Zap, Crown } from "lucide-react";

interface SubscriptionCardProps {
  plan: Plan | null;
  status: string;
  renewalDate?: string;
  cancelAtPeriodEnd?: boolean;
  onUpgradePlan?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  status,
  renewalDate,
  cancelAtPeriodEnd,
  onUpgradePlan,
}) => {
  if (!plan) return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl border border-red-200">
      <div className="text-center text-red-600">
        <Package className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <h3 className="text-lg font-semibold">پلنی فعال نیست</h3>
        <p className="text-sm text-red-500 mt-1">لطفا یک پلن انتخاب کنید</p>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'expired': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <Package className="w-4 h-4" />;
      case 'expired': return <Calendar className="w-4 h-4" />;
      default: return <Crown className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-3">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          پلن فعلی شما
        </h2>
      </div>

      {/* Plan Name */}
      <div className="text-center mb-6">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
          <span className="text-xl font-bold text-blue-700 capitalize">{plan.name}</span>
        </div>
      </div>

      {/* Plan Details */}
      <div className="space-y-4 mb-6">
        {/* Price */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">$</span>
            </div>
            <span className="font-medium text-gray-700">قیمت ماهانه</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {plan.price_monthly === 0 ? "رایگان" : `${plan.price_monthly.toLocaleString()} تومان`}
          </span>
        </div>

        {/* Migration Quota */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-100 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-700">مهاجرت محصول</span>
          </div>
          <span className="text-lg font-bold text-purple-500">
            {plan.quota_migration ?? plan.quota_migrations ?? 0} عدد
          </span>
        </div>

        {/* Realtime Updates */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-100 rounded-xl border border-orange-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-700">آپدیت لحظه‌ای</span>
          </div>
          <span className="text-lg font-bold text-orange-500">
            {plan.quota_realtime_updates} عدد
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-200 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              {getStatusIcon(status)}
            </div>
            <span className="font-medium text-gray-700">وضعیت</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>

        {/* Renewal Date */}
        {renewalDate && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-100 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-700">تاریخ تمدید</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">
              {new Date(renewalDate).toLocaleDateString("fa-IR")}
            </span>
          </div>
        )}

        {/* Cancellation Notice */}
        {cancelAtPeriodEnd && (
          <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-sm font-medium text-yellow-700">
                این اشتراک در پایان دوره لغو خواهد شد
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Upgrade Plan Button */}
      {onUpgradePlan && (
        <button
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
          onClick={onUpgradePlan}
        >
          <Crown className="w-5 h-5 text-white" />
          ارتقاء پلن
        </button>
      )}
    </div>
  );
};

export default SubscriptionCard;
