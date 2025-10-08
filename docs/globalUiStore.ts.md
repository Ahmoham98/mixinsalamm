# Global UI Store

This file defines the `useGlobalUiStore`, a Zustand store dedicated to managing global UI state that isn't directly related to authentication or product data. This includes modals, banners, logs, and a mechanism for temporarily blocking repeated failed API calls.

## State (`GlobalUiState`)

- **`showTokenExpiredModal`**: A boolean that controls the visibility of the "Token Expired" modal. This is set to `true` by the API interceptor in `config.ts` when a 401 error occurs.
- **`showQuotaBanner`**: A boolean to control the visibility of the quota exceeded banner.
- **`quotaBannerType`**: A string (`'migration'` or `'realtime'`) or `null` to specify which quota was exceeded.
- **`logs`**: An array of `LogEntry` objects. This is used to display a running log of actions (like "Syncing product X...") in the `LogBanner` component. It's capped at the 10 most recent entries.
- **`product404`**: A record object that acts as a counter. It tracks how many times a "404 Not Found" error has occurred for a specific product. The key is typically a unique identifier for the product (e.g., `mixin-123`).
- **`productBlockList`**: A record object that acts as a temporary blocklist. If a product hits the 404 error threshold (3 times), it gets added to this list with a timestamp.

## Actions

- **`setShowTokenExpiredModal(show)`**: Sets the visibility of the token expired modal.
- **`setQuotaBanner(open, type)`**: Sets the visibility and type of the quota banner.
- **`appendLog(entry)`**: Adds a new log entry to the beginning of the `logs` array.
- **`register404(key, id, title)`**: This is a key action for the blocklist feature. When called:
  1.  It increments the 404 counter for the given `key` in the `product404` state.
  2.  It checks if the count has reached a threshold (currently 3).
  3.  If the threshold is met, it adds the product to the `productBlockList` with the current timestamp.
- **`isBlocked(key)`**: A function that checks if a product `key` is currently on the blocklist.
  - It retrieves the item from `productBlockList`.
  - If the item exists, it checks if the block has expired (the block duration is 30 minutes).
  - If the block has expired, it calls `clearBlockIfExpired` to remove it and returns `false`.
  - If the block is still active, it returns `true`.
- **`clearBlockIfExpired(key)`**: An internal action that removes an item from the blocklist if its 30-minute block has passed.

## How the Blocklist Works

The blocklist is a clever mechanism to prevent the application from repeatedly making API calls that are known to be failing. This is particularly useful for background or automated processes.

1.  A component tries to fetch a product (e.g., `getProductById(123)`).
2.  The API returns a 404 error.
3.  The component's error handling logic calls `register404('mixin-123', 123, 'Product Name')`.
4.  The `register404` action increments the counter for `'mixin-123'`.
5.  This happens two more times. On the third call, `register404` sees the count is now 3 and adds `'mixin-123'` to the `productBlockList`.
6.  The next time the component wants to fetch product 123, it first calls `isBlocked('mixin-123')`.
7.  `isBlocked` returns `true`, so the component can skip making the API call altogether, saving network resources and preventing unnecessary errors.
8.  After 30 minutes, the next call to `isBlocked('mixin-123')` will find that the block has expired, remove it, and return `false`, allowing the application to try the API call again.

## Summary

The `useGlobalUiStore` is a utility store that decouples various global UI concerns from the main data stores. It provides a centralized place to manage transient UI states like modals and banners. Its most sophisticated feature is the 404-tracking and temporary blocklist, which adds a layer of resilience and efficiency to the application's data-fetching logic.
