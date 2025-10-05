import { create } from 'zustand';

interface GlobalUiState {
  showTokenExpiredModal: boolean;
  setShowTokenExpiredModal: (show: boolean) => void;
}

export const useGlobalUiStore = create<GlobalUiState>((set) => ({
  showTokenExpiredModal: false,
  setShowTokenExpiredModal: (show) => set({ showTokenExpiredModal: show }),
}));
