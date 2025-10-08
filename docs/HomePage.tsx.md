# HomePage and Product Management

This file contains the `HomePage` component, which is the main dashboard of the application. It's a complex component responsible for fetching, displaying, and managing products from both Mixin and Basalam. It also includes several sub-components and modals for a rich user experience.

Due to its size and complexity, this documentation is broken down into several sections.

## Core Component: `HomePage`

This is the main component for the home page.

### Functionality

- **Data Fetching with React Query**:
  - It uses `useQuery` from `@tanstack/react-query` to fetch product lists from both Mixin and Basalam.
  - `mixinProducts`: Fetches all products from the user's Mixin store.
  - `basalamProducts`: Fetches all products from the user's Basalam store.
  - The queries are enabled only when the respective credentials (`mixinCredentials`, `basalamCredentials`) are available.
  - React Query handles caching, refetching, and loading/error states, which simplifies the component's logic.
- **State Management**:
  - It uses a combination of local state (`useState`) and global state from Zustand stores (`useAuthStore`, `useProductsStore`, `useGlobalUiStore`).
  - **Local State**: Manages UI state like which product list is currently active (`activeList`), search terms, pagination, and which modals are open.
  - **Global State**:
    - `useAuthStore`: Accesses credentials and settings.
    - `useProductsStore`: Stores the fetched product lists globally so they can be accessed by other components (like the `ProductModal`) without re-fetching.
    - `useGlobalUiStore`: Manages global UI elements like the quota exceeded banner and logs.
- **Product Display and Filtering**:
  - It displays products in a paginated list.
  - Users can switch between viewing "All," "Synced," "Unsynced," and "Mismatched" products.
  - A search bar allows users to filter products by name.
  - The logic for filtering and pagination is handled by memoized calculations (`useMemo`) for performance.
- **Modals for Interaction**:
  - **`ProductModal`**: A detailed modal that opens when a user clicks on a product. It shows product details and allows for editing and syncing.
  - **`CreateBasalamProductModal`**: A modal for creating a new product in Basalam based on an existing Mixin product.
  - **`QuotaExceededModal`**: A modal that appears if a user hits a usage quota.
- **Bulk Migration**:
  - It includes a `BulkMigrationPanel` component that allows users to migrate all their unsynced Mixin products to Basalam in a single operation.
- **Sidebar Navigation**:
  - A responsive sidebar provides navigation to other pages like Settings, Usage, Pricing, etc.
- **Logout**: A logout button is provided, which clears the user's credentials and navigates them back to the login page.

---

## Key Sub-Components and Modals

### `ProductModal`

- **Functionality**:
  - Displays detailed information for a selected product, including its image, name, price, description, weight, and stock.
  - Allows editing of these fields.
  - **"Check" (`handleCheck`)**: Compares the product with its counterpart on the other platform to check for discrepancies in price, description, etc.
  - **"Edit/Sync" (`handleEdit`)**: Updates the product on one or both platforms based on the user's settings and the detected discrepancies. It also handles auto-syncing if enabled.
  - **"Create in Basalam"**: If a Mixin product doesn't exist in Basalam, this modal provides a button to open the `CreateBasalamProductModal`.
  - It displays logs related to the product using the `LogBanner` component.
- **Multi-Image Support**: It can fetch and display multiple images for a single product, with navigation buttons to cycle through them.

### `CreateBasalamProductModal`

- **Functionality**:
  - A form pre-filled with data from a Mixin product.
  - **Category Detection**: It automatically suggests a Basalam category based on the product's name by calling a dedicated API endpoint.
  - **Image Upload**: It automatically fetches all images from the Mixin product and uploads them to Basalam.
  - **SKU Generation**: It auto-generates a unique SKU for the new product.
  - **Submission**: It constructs a detailed payload and calls the Basalam API to create the new product.

### `BulkMigrationPanel`

- **Functionality**:
  - Provides a UI for starting, pausing, and resuming a bulk migration process.
  - **Batch Processing**: It processes the products in batches with a configurable concurrency level to avoid overwhelming the APIs.
  - **Rate Limiting**: It includes a pause mechanism to respect API rate limits.
  - **Retries**: It automatically retries failed requests a set number of times.
  - **Progress Tracking**: It shows real-time progress of the migration (e.g., "10 of 100 processed").
  - **Logging and Export**: It keeps a log of all successful and failed migrations and allows the user to export the results as a CSV file.

---

## Utility Functions

This file also contains several important utility functions:

- **`tomanToRial`, `rialToToman`**: For currency conversion.
- **`generateUniqueSKU`**: To create unique product identifiers.
- **`cleanHtmlText`**: A sophisticated function to strip HTML tags from text while preserving line breaks and structure, and correctly handling emojis.
- **`getUnitQuantity`**: A helper to determine the quantity for a given unit type ID from Basalam.

## How It Works

1. The `HomePage` mounts and fetches product data from Mixin and Basalam using React Query.
2. The fetched data is stored in the global `productsStore`.
3. The user can view the products, search, and filter them.
4. Clicking a product opens the `ProductModal`.
5. Inside the modal, the user can check for differences, edit details, and sync the products. The sync logic respects user preferences for the direction of the sync (Mixin -> Basalam or vice-versa).
6. If a product is missing on Basalam, the user can open the `CreateBasalamProductModal` to create it.
7. The `BulkMigrationPanel` provides a powerful tool for migrating many products at once, with robust error handling and progress tracking.
8. All actions that consume a quota (like creating or updating a product) call the `incrementUsage` function to update the user's usage record. If a quota is exceeded, the appropriate banner or modal is displayed.
