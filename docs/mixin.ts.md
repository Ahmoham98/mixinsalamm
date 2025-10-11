# Mixin API Service

This file exports an object `mixinApi` that encapsulates all the functions for interacting with the Mixin-related endpoints of the application's backend. It uses the pre-configured `api` instance from `./config.ts`.

## Functions

### `validateCredentials`

- **Description**: Validates a user's Mixin URL and access token by making a request to the backend.
- **Endpoint**: `POST /mixin/client/`
- **Parameters**:
  - `url: string`: The user's Mixin store URL.
  - `token: string`: The user's Mixin access token.
- **Returns**: A `Promise` that resolves to a `MixinValidationResponse` object, which contains the validated credentials if successful. It throws specific errors for different failure statuses (403, 404, 500).

### `getProducts`

- **Description**: Fetches a paginated list of products from the user's Mixin store.
- **Endpoint**: `GET /products/my-mixin-products`
- **Parameters**:
  - `credentials: MixinCredentials`
  - `page: number` (optional, default: 1): The page number to fetch.
- **Returns**: A `Promise` that resolves to an array of `MixinProduct` objects. It can handle multiple response formats from the backend.

### `getProductById`

- **Description**: Fetches a single Mixin product by its ID.
- **Endpoint**: `GET /products/mixin/{productId}`
- **Parameters**:
  - `credentials: MixinCredentials`
  - `productId: number`: The ID of the product to fetch.
- **Returns**: A `Promise` that resolves to a `MixinProduct` object or `null` on error.

### `getProductsByIds`

- **Description**: Fetches multiple Mixin products in a single batch request using a list of product IDs.
- **Endpoint**: `POST /products/mixin/productids`
- **Parameters**:
  - `credentials: MixinCredentials`
  - `ids: number[]`: An array of product IDs.
- **Returns**: A `Promise` that resolves to a `Record<number, MixinProduct>`, which is a map of product ID to the product object.

### `updateProduct`

- **Description**: Updates an existing product in the Mixin store.
- **Endpoint**: `PUT /products/update/mixin/{productId}`
- **Implementation Detail**: This function first fetches the original product data using `getProductById`. It then merges the new `productData` with the original data before sending the `PUT` request. This is often necessary for APIs that require the full object to be sent on update, not just the changed fields. It also ensures `extra_fields` is always an empty array.
- **Parameters**:
  - `credentials: MixinCredentials`
  - `productId: number`
  - `productData`: An object with the fields to update.
- **Returns**: A `Promise` that resolves to the updated product data.

### `createProduct`

- **Description**: Creates a new product in the Mixin store.
- **Endpoint**: `POST /products/create/mixin`
- **Parameters**:
  - `credentials: MixinCredentials`
  - `productData`: A detailed object representing the new product.
- **Returns**: A `Promise` that resolves to the newly created product data.

### `getProductImage`

- **Description**: Fetches the main (default) image for a specific Mixin product.
- **Endpoint**: `GET /images/my-mixin_image`
- **Parameters**:
  - `credentials: MixinCredentials`
  - `productId: number`
- **Returns**: A `Promise` that resolves to the image URL as a `string`, or `null` if no image is found.

### `getProductImages`

- **Description**: Fetches all images for a specific Mixin product.
- **Endpoint**: `GET /images/my-mixin_image`
- **Implementation Detail**: It sorts the results to ensure the default image is the first one in the returned array.
- **Parameters**:
  - `credentials: MixinCredentials`
  - `productId: number`
- **Returns**: A `Promise` that resolves to an array of image URL `string`s.

### `getProductsCount`

- **Description**: Calculates the total number of products in a user's Mixin store by iterating through all pages of the product list.
- **Endpoint**: `GET /products/my-mixin-products` (called repeatedly)
- **Parameters**: `credentials: MixinCredentials`
- **Returns**: A `Promise` that resolves to the total count as a `number`. It includes a safety cap of 100 pages to prevent infinite loops.

## Error Handling

Similar to the Basalam service, this file includes `try...catch` blocks for robust error handling. It logs errors and, in many cases, re-throws them to be handled by the calling UI components. This allows for a more interactive error-handling experience for the end-user. The `validateCredentials` function is a good example of providing specific, user-friendly error messages based on HTTP status codes.
