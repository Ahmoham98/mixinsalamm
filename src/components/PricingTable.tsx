import React from "react";
import { CheckCircle, Crown, Zap, Package, Star, ArrowRight } from "lucide-react";

export interface Plan {
  id: number;
  name: string;
  price_monthly: number;
  // Backend field names can vary; support both
  quota_migration?: number;
  quota_migrations?: number;
  quota_realtime_updates: number;
  features?: string[];
}

interface PricingTableProps {
  plans: Plan[];
  currentPlanId?: number;
  onSelectPlan: (planId: number) => void;
}

const PricingTable: React.FC<PricingTableProps> = ({ plans, currentPlanId, onSelectPlan }) => {
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Package className="w-6 h-6" />;
      case 'basic': return <Star className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      case 'premium': return <Crown className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  const getPlanGradient = (planName: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-gradient-to-br from-blue-500 to-purple-600';
    }
    
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-gradient-to-br from-[#95ed2f] to-[#30cfb7]';
      case 'basic': return 'bg-gradient-to-br from-[#95ed2f] to-[#30cfb7]';
      case 'pro': return 'bg-gradient-to-br from-[#95ed2f] to-[#30cfb7]';
      case 'premium': return 'bg-gradient-to-br from-[#95ed2f] to-[#30cfb7]';
      default: return 'bg-gradient-to-br from-[#95ed2f] to-[#30cfb7]';
    }
  };

  const getPlanBorderColor = (planName: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'border-blue-200';
    }
    
    switch (planName.toLowerCase()) {
      case 'free': return 'border-gray-200';
      case 'basic': return 'border-green-200';
      case 'pro': return 'border-blue-200';
      case 'premium': return 'border-purple-200';
      default: return 'border-blue-200';
    }
  };

  const getPlanBgColor = (planName: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-gradient-to-br from-blue-50 to-purple-50';
    }
    
    switch (planName.toLowerCase()) {
      case 'free': return 'bg-gradient-to-br from-gray-50 to-slate-50';
      case 'basic': return 'bg-gradient-to-br from-green-50 to-emerald-50';
      case 'pro': return 'bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'premium': return 'bg-gradient-to-br from-purple-50 to-pink-50';
      default: return 'bg-gradient-to-br from-blue-50 to-indigo-50';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const migrationQuota = (plan as any).quota_migration ?? plan.quota_migrations ?? 0;
        
        return (
          <div
            key={plan.id}
            className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
              isCurrent ? 'shadow-2xl ring-2 bg-gradient-to-r from-[#95ed2f] to-[#30cfb7] ring-opacity-50' : 'shadow-lg hover:shadow-xl'
            }`}
          >
            {/* Background */}
            <div className={`absolute inset-0 ${getPlanBgColor(plan.name, isCurrent)} `} />
            
            {/* Content */}
            <div className="relative p-6 flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getPlanGradient(plan.name, isCurrent)}`}>
                  <div className="text-white">
                    {getPlanIcon(plan.name)}
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold capitalize text-gray-800">{plan.name}</h3>
                  {isCurrent && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">فعلی</span>
                    </div>
                  )}
                </div>
                
                <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  {plan.price_monthly === 0 ? "رایگان" : `${plan.price_monthly.toLocaleString()}`}
                </div>
                {plan.price_monthly > 0 && (
                  <div className="text-sm text-gray-500">تومان / ماه</div>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 space-y-3 mb-6">
                {/* Migration Quota */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${getPlanBorderColor(plan.name, isCurrent)} bg-white/50 backdrop-blur-sm`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">مهاجرت محصول</span>
                  </div>
                  <span className="font-bold text-purple-600">{migrationQuota}</span>
                </div>

                {/* Realtime Updates */}
                <div className={`flex items-center justify-between p-3 rounded-xl border ${getPlanBorderColor(plan.name, isCurrent)} bg-white/50 backdrop-blur-sm`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">آپدیت لحظه‌ای</span>
                  </div>
                  <span className="font-bold text-orange-600">{plan.quota_realtime_updates}</span>
                </div>

                {/* Additional Features */}
                {plan.features && plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : `text-white hover:shadow-lg hover:scale-105 ${getPlanGradient(plan.name, isCurrent)}`
                }`}
                disabled={isCurrent}
                onClick={() => onSelectPlan(plan.id)}
              >
                {isCurrent ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    پلن فعلی
                  </>
                ) : (
                  <>
                    انتخاب پلن
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PricingTable;
