import BackHomeButton from '../components/BackHomeButton'
import React, { useEffect, useState } from "react";
import PaymentHistory, { Payment } from "../components/PaymentHistory";
import { api } from "../services/api/config";

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/payments/").then((res) => {
      setPayments(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <BackHomeButton />
      </div>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <PaymentHistory payments={payments} />
      </div>
    </div>
  );
};

export default PaymentsPage;
