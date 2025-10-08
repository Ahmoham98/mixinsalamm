import { create } from "zustand";
import { persist } from "zustand/middleware";

type JourneyPage = "homepage" | "settings" | "pricing";

interface JourneyState {
  homepage: {
    currentStep: number;
    completed: boolean;
  };
  settings: {
    currentStep: number;
    completed: boolean;
  };
  pricing: {
    currentStep: number;
    completed: boolean;
  };
  nextStep: (page: JourneyPage) => void;
  setStep: (page: JourneyPage, step: number) => void;
  completeJourney: (page: JourneyPage) => void;
  resetJourney: (page: JourneyPage) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      homepage: { currentStep: 1, completed: false },
      settings: { currentStep: 1, completed: false },
      pricing: { currentStep: 1, completed: false },

      nextStep: (page) =>
        set((state) => ({
          [page]: { ...state[page], currentStep: state[page].currentStep + 1 },
        })),

      setStep: (page, step) =>
        set((state) => ({
          [page]: { ...state[page], currentStep: step },
        })),

      completeJourney: (page) =>
        set((state) => ({
          [page]: { ...state[page], completed: true, currentStep: 999 }, // Set step high to prevent re-triggering
        })),

      resetJourney: (page) =>
        set({
          [page]: { currentStep: 1, completed: false },
        }),
    }),
    {
      name: "journey-storage", // Name for localStorage key
    },
  ),
);
