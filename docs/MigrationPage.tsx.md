# MigrationPage

The `MigrationPage` is a dedicated page for providing an overview of the products that are unique to either the Mixin store or the Basalam store. It's designed to give the user a quick summary before they initiate a bulk migration.

## Functionality

- **Data Fetching**:
  - The component fetches all products from both the user's Mixin store and their Basalam store.
  - It uses the `useEffect` hook to trigger the fetch when the component mounts and credentials are available.
  - The fetching is done via two API calls to the backend:
    - `/products/my-mixin-products/all`: Fetches all products from Mixin.
    - `/products/my-basalam-products/{vendorId}/all`: Fetches all products from Basalam.
  - To keep the data fresh, the component refetches the product lists every 30 seconds using `setInterval`.
- **State Management**:
  - It uses the `useAuthStore` to get the necessary credentials for the API calls.
  - It uses the `useProductsStore` to access the pre-calculated lists of unique products (`uniqueMixinProducts` and `uniqueBasalamProducts`). The actual calculation of which products are unique is handled within the `productsStore`, keeping this component clean and focused on presentation.
  - It maintains local state for loading (`isLoading`) and error (`error`) handling during the data fetching process.
- **Displaying Unique Products**:
  - The main purpose of this page is to display two lists:
    1.  **Unique Mixin Products**: Products that exist in the user's Mixin store but not in their Basalam store.
    2.  **Unique Basalam Products**: Products that exist in their Basalam store but not in their Mixin store.
  - The lists show the product names and a count of the total unique products found.
  - To avoid overwhelming the UI, the lists are capped at displaying the first 100 products. If there are more, a message like "... and X more products" is shown.
- **User Experience**:
  - A loading spinner is displayed while the initial product lists are being fetched.
  - An error message is shown if either of the API calls fails.
  - A `BackHomeButton` component is included for easy navigation back to the main dashboard.
- **Styling**:
  - The page has a clean, modern design with a gradient background and styled cards for the product lists.
  - The header is sticky, so it remains visible as the user scrolls.

## How It Works

1. The user navigates to the `/migration` route.
2. The `MigrationPage` component mounts.
3. The `useEffect` hook checks for Mixin and Basalam credentials. If they exist, it sets `isLoading` to `true` and makes parallel `fetch` requests to get all products.
4. While loading, a spinner is shown. If an error occurs, an error message is displayed.
5. Once the data is successfully fetched, the component stores the full product lists in its local state (`globalMixinProducts`, `globalBasalamProducts`).
6. The `productsStore` (which is not directly shown in this file but is a central part of the app's architecture) would typically be updated with these full lists. The store would then perform the logic to compare the two lists and determine the `uniqueMixinProducts` and `uniqueBasalamProducts`.
7. The `MigrationPage` component subscribes to these unique product lists from the `productsStore`.
8. The component then renders the two lists of unique products, showing their names and the total counts.
9. The `setInterval` in the `useEffect` hook ensures that the product data is periodically refreshed, so the user sees a reasonably up-to-date view of their stores.

This page acts as a "staging area" or informational dashboard. The actual bulk migration logic (the process of creating products in batches) is handled by the `BulkMigrationPanel` component, which is located on the `HomePage`. This page simply gives the user the high-level numbers and lists they need to make an informed decision about migration.
