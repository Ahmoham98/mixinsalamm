# Type Definitions

This file is the central repository for all custom TypeScript type definitions and interfaces used throughout the application. Centralizing type definitions in this way is a best practice that promotes consistency, reusability, and maintainability.

## Purpose

- **Single Source of Truth**: Provides a single, authoritative source for the shape of data objects like products, credentials, and API responses.
- **Type Safety**: Enables TypeScript's static analysis to catch bugs and prevent errors related to incorrect data types.
- **Developer Experience**: Offers autocompletion and type checking in code editors, making development faster and more reliable.

## Interfaces

### Credential Types

- **`MixinCredentials`**: Defines the shape of the credentials object for the Mixin platform, requiring a `url` and an `access_token`.
- **`BasalamCredentials`**: Defines the shape for Basalam credentials, requiring an `access_token` and a `refresh_token`.

### Product and Related Types

- **`MixinProduct`**: Describes the structure of a product object as it comes from the Mixin platform. Includes core fields like `id`, `name`, `price`, `description`, `stock`, etc.
- **`BasalamPhoto`**: Defines the structure of a photo object from Basalam, which includes URLs for different image sizes (original, xs, sm, md, lg).
- **`BasalamStatus`**, **`BasalamShippingData`**, **`BasalamUnitType`**: These are sub-interfaces that define the shape of nested objects within a `BasalamProduct`.
- **`BasalamProduct`**: A comprehensive interface describing the structure of a product from the Basalam platform. It's more complex than `MixinProduct` and includes nested objects for `photo`, `status`, `shipping_data`, etc.

### API Response Types

- **`BasalamProductsResponse`**: Defines the shape of the response when fetching a list of products from Basalam. It includes the `data` array (the products themselves) and pagination metadata (`total_count`, `total_page`, `page`, etc.).
- **`BasalamVendor`**: Describes the structure of the `vendor` object, which is part of the `BasalamUserData`.
- **`BasalamUserData`**: A detailed interface for the user data object returned by the Basalam API. It includes personal information, contact details, and the nested `vendor` object.
- **`MixinValidationResponse`**: Defines the shape of the successful response from the Mixin credential validation endpoint.

## How It's Used

These interfaces are imported and used throughout the application wherever data of a specific type is handled.

- **State Management (Zustand)**: The stores (`authStore`, `productsStore`) use these types to define the shape of their state.
  ```typescript
  // In authStore.ts
  import type { MixinCredentials, BasalamCredentials } from '../types';
  interface AuthState {
    mixinCredentials: MixinCredentials | null;
    basalamCredentials: BasalamCredentials | null;
    // ...
  }
  ```
- **API Services**: The API service files use these types to define the return types of their functions, ensuring that the data they fetch and return conforms to the expected structure.
  ```typescript
  // In basalam.ts
  import type { BasalamProduct, BasalamUserData } from '../../types';
  export const basalamApi = {
    getUserData: async (...): Promise<BasalamUserData | null> => { /* ... */ },
    getProducts: async (...): Promise<BasalamProduct[]> => { /* ... */ },
  };
  ```
- **Components**: React components use these types for their props and internal state, ensuring that they receive and manage data correctly.
  ```typescript
  // In a component
  import type { MixinProduct } from '../types';
  interface ProductCardProps {
    product: MixinProduct;
  }
  ```

By maintaining this central `index.ts` file, the project ensures that there is a clear and consistent contract for how data flows through the different layers of the application.
