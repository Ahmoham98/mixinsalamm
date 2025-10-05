import React from 'react';

const UsagePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">صفحه استفاده</h1>
        <p className="text-gray-600">این صفحه به صفحه قیمت‌گذاری منتقل شده است.</p>
        <p className="text-sm text-gray-500 mt-2">
          برای مشاهده اطلاعات استفاده، به صفحه <a href="/pricing" className="text-blue-600 hover:underline">قیمت‌گذاری</a> مراجعه کنید.
        </p>
      </div>
    </div>
  );
};

export default UsagePage;
