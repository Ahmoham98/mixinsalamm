import { create } from 'zustand';

interface GlobalUiState {
  showTokenExpiredModal: boolean;
  setShowTokenExpiredModal: (show: boolean) => void;
  // Quota banner
  showQuotaBanner: boolean;
  quotaBannerType: 'migration' | 'realtime' | null;
  setQuotaBanner: (open: boolean, type?: 'migration' | 'realtime' | null) => void;
  // Log banner and 404/blocklist
  logs: import('../components/LogBanner').LogEntry[];
  appendLog: (entry: import('../components/LogBanner').LogEntry) => void;
  // Notifications inbox
  notifications: Array<{ id: string; ts: number; title: string; message: string }>;
  pushNotification: (n: { id?: string; ts?: number; title: string; message: string }) => void;
  product404: Record<string, { id: number; title: string; count: number }>;
  productBlockList: Record<string, { id: number; title: string; blockedAt: number }>;
  register404: (key: string, id: number, title: string) => void;
  isBlocked: (key: string) => boolean;
  clearBlockIfExpired: (key: string) => void;
}

export const useGlobalUiStore = create<GlobalUiState>((set) => ({
  showTokenExpiredModal: false,
  setShowTokenExpiredModal: (show) => set({ showTokenExpiredModal: show }),
  showQuotaBanner: false,
  quotaBannerType: null,
  setQuotaBanner: (open, type = null) => set({ showQuotaBanner: open, quotaBannerType: type ?? null }),
  logs: [],
  appendLog: (entry) => set((s) => ({ logs: [entry, ...s.logs].slice(0, 10) })),
  notifications: [],
  pushNotification: (n) => set((s) => {
    const id = n.id || `${Date.now()}-${Math.random()}`
    const ts = n.ts || Date.now()
    const next = [{ id, ts, title: n.title, message: n.message }, ...s.notifications].slice(0, 50)
    return { notifications: next } as any
  }),
  product404: {},
  productBlockList: {},
  register404: (key, id, title) => set((s) => {
    const current = s.product404[key] || { id, title, count: 0 };
    const updated = { ...s.product404, [key]: { id, title, count: current.count + 1 } };
    const blockList = { ...s.productBlockList };
    let notifications = (s as any).notifications || [];
    if (updated[key].count >= 3 && !blockList[key]) {
      blockList[key] = { id, title, blockedAt: Date.now() };
      // Push an inbox notification instructing user to review the product
      const notify = {
        id: `${Date.now()}-${Math.random()}`,
        ts: Date.now(),
        title: 'بررسی محصول در پلتفرم مقصد',
        message: `درخواست‌های به‌روزرسانی برای «${title}» به مدت ۳۰ دقیقه متوقف شد. لطفاً محصول را در پلتفرم مقصد بررسی کنید و جزئیات کامل آن را بازبینی نمایید.`
      };
      notifications = [notify, ...notifications].slice(0, 50);
    }
    return { product404: updated, productBlockList: blockList, notifications } as any;
  }),
  isBlocked: (key) => {
    const { productBlockList } = useGlobalUiStore.getState() as any;
    const item = productBlockList[key];
    if (!item) return false;
    const THIRTY_MIN = 30 * 60 * 1000;
    if (item.blockedAt + THIRTY_MIN < Date.now()) {
      const { clearBlockIfExpired } = useGlobalUiStore.getState() as any;
      clearBlockIfExpired(key);
      return false;
    }
    return true;
  },
  clearBlockIfExpired: (key) => set((s) => {
    const item = (s as any).productBlockList[key];
    if (!item) return {} as any;
    const THIRTY_MIN = 30 * 60 * 1000;
    if (item.blockedAt + THIRTY_MIN < Date.now()) {
      const next = { ...(s as any).productBlockList };
      delete next[key];
      return { productBlockList: next } as any;
    }
    return {} as any;
  }),
}));
