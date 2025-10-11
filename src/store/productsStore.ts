import { create } from "zustand";
import type { MixinProduct, BasalamProduct } from "../types";

type ProductsState = {
  uniqueMixinProducts: MixinProduct[];
  uniqueBasalamProducts: BasalamProduct[];
  lastUpdated: number | null;
  setUniqueLists: (mixin: MixinProduct[], basalam: BasalamProduct[]) => void;
  clear: () => void;
};

export const useProductsStore = create<ProductsState>((set) => ({
  uniqueMixinProducts: [],
  uniqueBasalamProducts: [],
  lastUpdated: null,
  setUniqueLists: (mixin, basalam) =>
    set({
      uniqueMixinProducts: mixin,
      uniqueBasalamProducts: basalam,
      lastUpdated: Date.now(),
    }),
  clear: () =>
    set({
      uniqueMixinProducts: [],
      uniqueBasalamProducts: [],
      lastUpdated: null,
    }),
}));
