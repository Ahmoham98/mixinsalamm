import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the state for each page's tour
interface TourSteps {
  home: number;
  settings: number;
  pricing: number;
}

// Define the overall tour state
interface TourState {
  steps: TourSteps;
  isTourActive: boolean;
  setStep: (page: keyof TourSteps, step: number) => void;
  nextStep: (page: keyof TourSteps) => void;
  startTour: () => void;
  endTour: () => void;
  resetTours: () => void;
}

// Check if tours have been completed before
const getInitialState = (): TourSteps => {
  try {
    const completedTours = JSON.parse(
      localStorage.getItem("completed-tours") || "{}",
    );
    return {
      home: completedTours.home ? -1 : 0,
      settings: completedTours.settings ? -1 : 0,
      pricing: completedTours.pricing ? -1 : 0,
    };
  } catch (error) {
    return { home: 0, settings: 0, pricing: 0 };
  }
};

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      steps: getInitialState(),
      isTourActive: true, // The tour is active by default

      setStep: (page, step) => {
        set((state) => ({
          steps: { ...state.steps, [page]: step },
        }));

        // If a tour is completed (step set to -1), mark it in localStorage
        if (step === -1) {
          try {
            const completedTours = JSON.parse(
              localStorage.getItem("completed-tours") || "{}",
            );
            completedTours[page] = true;
            localStorage.setItem(
              "completed-tours",
              JSON.stringify(completedTours),
            );
          } catch (error) {
            console.error(
              "Failed to update completed tours in localStorage",
              error,
            );
          }
        }
      },

      nextStep: (page) => {
        set((state) => ({
          steps: { ...state.steps, [page]: state.steps[page] + 1 },
        }));
      },

      startTour: () => set({ isTourActive: true }),
      endTour: () => set({ isTourActive: false }),

      resetTours: () => {
        try {
          localStorage.removeItem("completed-tours");
        } catch (error) {
          console.error(
            "Failed to clear completed tours from localStorage",
            error,
          );
        }
        set({ steps: { home: 0, settings: 0, pricing: 0 } });
      },
    }),
    {
      name: "tour-storage", // Name for the persisted state in localStorage
      // Only persist the 'steps' part of the state
      partialize: (state) => ({ steps: state.steps }),
    },
  ),
);
