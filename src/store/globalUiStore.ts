import { create } from 'zustand';

interface GlobalUiState {
  showTokenExpiredModal: boolean;
  setShowTokenExpiredModal: (show: boolean) => void;
  // Quota banner
  showQuotaBanner: boolean;
  quotaBannerType: 'migration' | 'realtime' | null;
  setQuotaBanner: (open: boolean, type?: 'migration' | 'realtime' | null) => void;
}

export const useGlobalUiStore = create<GlobalUiState>((set) => ({
  showTokenExpiredModal: false,
  setShowTokenExpiredModal: (show) => set({ showTokenExpiredModal: show }),
  showQuotaBanner: false,
  quotaBannerType: null,
  setQuotaBanner: (open, type = null) => set({ showQuotaBanner: open, quotaBannerType: type ?? null }),
}));
