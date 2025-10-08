# Products Store

This file defines `useProductsStore`, a simple Zustand store for managing state related to the products from both Mixin and Basalam platforms. Its primary role is to hold the lists of products that are unique to each platform.

## State (`ProductsState`)

- **`uniqueMixinProducts`**: An array of `MixinProduct` objects. This list contains products that exist in the user's Mixin store but do not have a corresponding product in their Basalam store.
- **`uniqueBasalamProducts`**: An array of `BasalamProduct` objects. This list contains products that exist in the user's Basalam store but do not have a corresponding product in their Mixin store.
- **`lastUpdated`**: A timestamp (or `null`) indicating when the unique lists were last calculated and set. This can be useful for debugging or for components that need to know the age of the data.

## Actions

- **`setUniqueLists(mixin, basalam)`**: This is the main action for this store. It takes two arrays as arguments: the list of unique Mixin products and the list of unique Basalam products. It updates the state with these new lists and sets the `lastUpdated` timestamp to the current time.
- **`clear()`**: Resets the store to its initial empty state. This is typically called when the user logs out.

## Usage

This store acts as a cache for the results of the product comparison logic. Instead of every component that needs this information having to fetch all products and perform the comparison itself, one central component (like `HomePage` or `MigrationPage`) can do the calculation and then update this global store.

1.  A component (e.g., `MigrationPage`) fetches all products from both Mixin and Basalam.
2.  It then compares the two lists to find the products that are unique to each.
3.  It calls `setUniqueLists(uniqueMixin, uniqueBasalam)`.
4.  Now, any other component in the application can subscribe to this store to get the lists of unique products without needing to perform any expensive computations.

```jsx
// Example of a component subscribing to the store
import { useProductsStore } from "./productsStore";

function UniqueProductsDisplay() {
  const uniqueMixinCount = useProductsStore(
    (state) => state.uniqueMixinProducts.length,
  );
  const uniqueBasalamCount = useProductsStore(
    (state) => state.uniqueBasalamProducts.length,
  );

  return (
    <div>
      <p>Products only in Mixin: {uniqueMixinCount}</p>
      <p>Products only in Basalam: {uniqueBasalamCount}</p>
    </div>
  );
}
```

This separation of concerns (fetching vs. storing vs. displaying) makes the application more modular and efficient. The `productsStore` is a simple but effective way to share the derived state (the unique product lists) across different parts of the UI.
