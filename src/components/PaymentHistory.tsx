import React from "react";

export interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  invoice_url?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => (
  <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
    <h2 className="text-xl font-bold mb-6 text-center">تاریخچه پرداخت‌ها</h2>
    {payments.length === 0 ? (
      <div className="text-center text-gray-500">هیچ پرداختی ثبت نشده است.</div>
    ) : (
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3">تاریخ</th>
            <th className="py-2 px-3">مبلغ</th>
            <th className="py-2 px-3">وضعیت</th>
            <th className="py-2 px-3">فاکتور</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2 px-3">
                {new Date(p.created_at).toLocaleDateString("fa-IR")}
              </td>
              <td className="py-2 px-3">
                {p.amount} {p.currency.toUpperCase()}
              </td>
              <td
                className={`py-2 px-3 font-bold ${p.status === "paid" ? "text-green-600" : "text-red-600"}`}
              >
                {p.status === "paid" ? "پرداخت شده" : "ناموفق"}
              </td>
              <td className="py-2 px-3">
                {p.invoice_url ? (
                  <a
                    href={p.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    دانلود
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default PaymentHistory;
