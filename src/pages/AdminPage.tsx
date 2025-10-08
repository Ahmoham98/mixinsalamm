import React, { useEffect, useState } from "react";
import { api } from "../services/api/config";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h2 className="text-lg font-bold mb-3">{title}</h2>
    {children}
  </div>
);

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/users"),
      api.get("/api/admin/plans"),
      api.get("/api/admin/subscriptions"),
      api.get("/api/admin/usage"),
      api.get("/api/admin/payments"),
    ])
      .then(([u, p, s, us, pay]) => {
        setUsers(u.data || []);
        setPlans(p.data || []);
        setSubs(s.data || []);
        setUsage(us.data || []);
        setPayments(pay.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <Section title="کاربران">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Active</th>
                <th className="p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{String(u.is_active)}</td>
                  <td className="p-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="پلن‌ها">
        <div className="grid md:grid-cols-2 gap-3">
          {plans.map((p: any) => (
            <div key={p.id} className="border rounded p-3">
              <div className="font-semibold">{p.name}</div>
              <div>قیمت ماهانه: {p.price_monthly}</div>
              <div>سهم مهاجرت: {p.quota_migration}</div>
              <div>سهم آپدیت لحظه‌ای: {p.quota_realtime_updates}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="اشتراک‌ها">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">ID</th>
                <th className="p-2">User</th>
                <th className="p-2">Plan</th>
                <th className="p-2">Status</th>
                <th className="p-2">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.user_id}</td>
                  <td className="p-2">{s.plan_id}</td>
                  <td className="p-2">{s.status}</td>
                  <td className="p-2">{s.renewal_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="مصرف">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">User</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Migration</th>
                <th className="p-2">Realtime</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u: any) => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.user_id}</td>
                  <td className="p-2">{u.period_start}</td>
                  <td className="p-2">{u.period_end}</td>
                  <td className="p-2">{u.migration_used}</td>
                  <td className="p-2">{u.realtime_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="پرداخت‌ها">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">ID</th>
                <th className="p-2">User</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Provider</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.user_id}</td>
                  <td className="p-2">
                    {p.amount} {p.currency}
                  </td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2">{p.payment_provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
};

export default AdminPage;
