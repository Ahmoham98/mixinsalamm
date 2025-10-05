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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <PaymentHistory payments={payments} />
    </div>
  );
};

export default PaymentsPage;
