import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  steps: {
    home: number;
    settings: number;
    pricing: number;
  };
  setStep: (page: keyof TourState["steps"], step: number) => void;
  nextStep: (page: keyof TourState["steps"]) => void;
  resetTour: (page: keyof TourState["steps"]) => void;
  startTour: (page: keyof TourState["steps"]) => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      steps: {
        home: -1, // -1 means tour is completed/skipped
        settings: -1,
        pricing: -1,
      },
      setStep: (page, step) =>
        set((state) => ({
          steps: { ...state.steps, [page]: step },
        })),
      nextStep: (page) =>
        set((state) => ({
          steps: { ...state.steps, [page]: state.steps[page] + 1 },
        })),
      resetTour: (page) =>
        set((state) => ({
          steps: { ...state.steps, [page]: 0 },
        })),
      startTour: (page) =>
        set((state) => ({
          steps: { ...state.steps, [page]: 0 },
        })),
    }),
    {
      name: "tour-storage",
    }
  )
);
