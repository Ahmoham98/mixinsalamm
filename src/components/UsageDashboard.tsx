import React from "react";
import {
  Package,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface UsageDashboardProps {
  migrationsUsed: number;
  migrationsQuota: number;
  realtimeUsed: number;
  realtimeQuota: number;
}

const UsageBar = ({
  used,
  quota,
  label,
  icon,
  color,
}: {
  used: number;
  quota: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) => {
  const percent = Math.min((used / quota) * 100, 100);
  const isWarning = used / quota > 0.8;
  const isOver = used > quota;
  const remaining = Math.max(quota - used, 0);

  const getStatusIcon = () => {
    if (isOver) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isWarning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isOver) return "بیش از حد مجاز";
    if (isWarning) return "نزدیک به حد مجاز";
    return "در حد مجاز";
  };

  const getStatusColor = () => {
    if (isOver) return "text-red-600";
    if (isWarning) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{label}</h3>
            <p className="text-xs text-gray-500">{getStatusText()}</p>
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{used}</div>
          <div className="text-xs text-blue-500">مصرف شده</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{remaining}</div>
          <div className="text-xs text-green-500">باقی‌مانده</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-600">{quota}</div>
          <div className="text-xs text-gray-500">کل سهمیه</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">پیشرفت</span>
          <span className={`font-bold ${getStatusColor()}`}>
            {percent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              isOver
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : isWarning
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                  : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Usage Ratio */}
      <div className="text-center">
        <span className="text-sm text-gray-600">
          {used} از {quota} استفاده شده
        </span>
      </div>
    </div>
  );
};

const UsageDashboard: React.FC<UsageDashboardProps> = ({
  migrationsUsed,
  migrationsQuota,
  realtimeUsed,
  realtimeQuota,
}) => (
  <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300">
    {/* Header */}
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-3">
        <TrendingUp className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        داشبورد مصرف
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        وضعیت استفاده از سهمیه‌های شما
      </p>
    </div>

    {/* Usage Bars */}
    <div className="space-y-4">
      <UsageBar
        used={migrationsUsed}
        quota={migrationsQuota}
        label="مهاجرت محصول"
        icon={<Package className="w-5 h-5 text-white" />}
        color="bg-purple-500"
      />
      <UsageBar
        used={realtimeUsed}
        quota={realtimeQuota}
        label="آپدیت لحظه‌ای"
        icon={<Zap className="w-5 h-5 text-white" />}
        color="bg-orange-500"
      />
    </div>

    {/* Summary */}
    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
      <div className="text-center">
        <h4 className="font-semibold text-indigo-700 mb-2">خلاصه مصرف</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-purple-600">
              {migrationsUsed + realtimeUsed}
            </div>
            <div className="text-purple-500">کل استفاده</div>
          </div>
          <div>
            <div className="font-bold text-blue-600">
              {migrationsQuota + realtimeQuota}
            </div>
            <div className="text-blue-500">کل سهمیه</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UsageDashboard;
