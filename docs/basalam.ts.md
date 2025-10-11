# Basalam API Service

This file exports an object `basalamApi` that encapsulates all the functions for interacting with the Basalam-related endpoints of the application's backend. It uses the pre-configured `api` instance from `./config.ts`.

## Functions

### `getUserData`

- **Description**: Fetches the authenticated user's data from Basalam.
- **Endpoint**: `GET /basalam/client/me`
- **Parameters**: `credentials: BasalamCredentials`
- **Returns**: A `Promise` that resolves to a `BasalamUserData` object or `null` on error.

### `getProducts`

- **Description**: Fetches a paginated list of products from the user's Basalam store.
- **Endpoint**: `GET /products/my-basalam-products/{vendorId}`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `vendorId: number`: The ID of the user's Basalam store (vendor).
  - `page: number` (optional, default: 1): The page number to fetch.
- **Returns**: A `Promise` that resolves to an array of `BasalamProduct` objects. It includes extensive debugging logs and validation to ensure the response is in the expected format.

### `getProductById`

- **Description**: Fetches a single Basalam product by its ID.
- **Endpoint**: `GET /products/basalam/{productId}`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `productId: number`: The ID of the product to fetch.
- **Returns**: A `Promise` that resolves to a `BasalamProduct` object or `null` on error.

### `getProductsByIds`

- **Description**: Fetches multiple Basalam products in a single batch request using a list of product IDs. This is much more efficient than fetching them one by one.
- **Endpoint**: `POST /products/basalam/productids`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `ids: number[]`: An array of product IDs to fetch.
- **Returns**: A `Promise` that resolves to a `Record<number, BasalamProduct>`, which is a map of product ID to the corresponding product object.

### `updateProduct`

- **Description**: Updates an existing product on Basalam.
- **Endpoint**: `PATCH /products/update/basalam/{productId}`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `productId: number`: The ID of the product to update.
  - `productData`: An object containing the fields to update (`name`, `price`, `description`, `stock`, `weight`).
- **Returns**: A `Promise` that resolves to the updated product data from the server. It throws an error if the update fails, preserving the error response for status-specific handling.

### `uploadImage`

- **Description**: Uploads an image to be used for a Basalam product. It uses a backend endpoint that takes an image URL, downloads it on the server, and then uploads it to Basalam, which is more reliable than handling file uploads from the client.
- **Endpoint**: `POST /products/sync-image`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `imageUrl: string`: The URL of the image to upload.
- **Returns**: A `Promise` that resolves to an object containing the new image `id` and `url`.

### `createProduct`

- **Description**: Creates a new product in the user's Basalam store.
- **Endpoint**: `POST /products/create/basalam/{vendorId}`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `vendorId: number`: The ID of the user's store.
  - `productData: any`: A detailed object representing the new product to be created.
- **Returns**: A `Promise` that resolves to the newly created product data. It includes logic to handle "soft errors" where the server responds with a 200 OK status but includes an error message in the response body.

### `getProductsCount`

- **Description**: Calculates the total number of products in a user's Basalam store by iterating through all pages of the product list.
- **Endpoint**: `GET /products/my-basalam-products/{vendorId}` (called repeatedly)
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `vendorId: number`: The ID of the user's store.
- **Returns**: A `Promise` that resolves to the total count of products as a `number`.

### `getCategoryUnitType`

- **Description**: Fetches the appropriate "unit type" (e.g., "عدد" for count, "کیلوگرم" for weight) for a given Basalam category ID. This is needed when creating new products.
- **Endpoint**: `GET /products/category-unit-type`
- **Parameters**:
  - `credentials: BasalamCredentials`
  - `categoryId: number`: The ID of the Basalam category.
- **Returns**: A `Promise` that resolves to an object containing the `unit_type` details or `null` on error.

## Error Handling

Most functions in this service include `try...catch` blocks to handle errors gracefully. They log detailed error information to the console and typically return `null` or an empty array/object to prevent the application from crashing. The `updateProduct` and `createProduct` functions are notable for re-throwing errors, allowing the calling components (like the `ProductModal`) to handle specific API error responses (e.g., showing a validation error message to the user).
