import { api } from "./config";

// Date utilities
export const formatNow = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}/${HH}:${mm}`;
};

export const addDays = (isoLike: string, days: number): string => {
  // isoLike is in format YYYY-MM-DD/HH:mm
  const [datePart, timePart] = isoLike.split("/");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mi] = timePart.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mi);
  dt.setDate(dt.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const HH = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${yyyy}-${MM}-${dd}/${HH}:${mm}`;
};

// Users
export const ensureUser = async (body: any) => {
  const res = await api.post("/googlesheet/user/", body);
  return res.data;
};

// Create initial usage record with period_end (e.g., subscription renewal_date)
// gets periodEnd from response of get createDefaultSubsciption to use for period_end field
export const createInitialUsageRecord = async (periodEnd?: string) => {
  const now = formatNow();
  const body = {
    period_start: now,
    period_end: periodEnd || addDays(now, 31),
    migration_used: 0,
    realtime_used: 0,
    created_at: now,
    updated_at: now,
  };
  const res = await api.post("/api/usage/increment", body);
  return res.data;
};

// Plans
export const getPlans = async () => {
  const res = await api.get("/api/plans/");
  return res.data;
};
export const getPlanById = async (planId: number) => {
  const res = await api.get(`/api/plans/${planId}`);
  return res.data;
};

// Subscriptions
export const getCurrentSubscription = async () => {
  const res = await api.get("/api/subscription/current");
  return res.data;
};
export const createDefaultSubscription = async () => {
  const now = formatNow();
  const renewal = addDays(now, 31);
  const body = {
    plan_id: 1,
    status: "active",
    start_date: now,
    end_date: renewal,
    renewal_date: renewal,
    cancel_at_period_end: true,
    created_at: now,
    updated_at: now,
  };
  const res = await api.post("/api/subscription/", body);
  return res.data;
};

// Usage
export const getUsage = async () => {
  const res = await api.get("/api/usage/");
  return res.data;
};
export const incrementUsage = async (type: "migration" | "realtime") => {
  const now = formatNow();
  const body = {
    period_start: now,
    period_end: addDays(now, 31),
    migration_used: 0,
    realtime_used: 0,
    created_at: now,
    updated_at: now,
  };

  // Debug: Check if token is available
  console.log("incrementUsage called with type:", type);
  console.log("Request body:", body);

  const res = await api.post(`/api/usage/increment`, body, {
    params: { type },
  });
  return res.data;
};

// Payments
export const createPayment = async (body: any) => {
  const res = await api.post("/api/payments/", body);
  return res.data;
};
