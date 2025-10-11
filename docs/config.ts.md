# API Configuration

This file is the central configuration point for all API requests made by the application. It sets up a global `axios` instance and configures interceptors to handle authentication and errors automatically.

## Key Exports

### `BASE_URL`
- **Type**: `string`
- **Description**: A constant holding the base URL for the backend API (`https://mixinsalam-backend.liara.run`). All API requests will be prefixed with this URL.

### `api`
- **Type**: `AxiosInstance`
- **Description**: This is the main export of the file. It's an `axios` instance that has been pre-configured with the `baseURL` and default headers (`Content-Type: application/json`, `Accept: application/json`). All other API service files (like `basalam.ts`, `mixin.ts`) import and use this instance to make requests.

## Interceptors

Interceptors are functions that `axios` runs for every single request or response. This file sets up two powerful interceptors.

### Request Interceptor
- **Purpose**: To automatically add the user's authentication token to every outgoing API request.
- **How it Works**:
  1.  Before a request is sent, this interceptor checks if an `Authorization` header has already been set manually.
  2.  If not, it retrieves the `access_token` from the `useAuthStore` (the Zustand store).
  3.  If a token exists, it adds it to the request headers in the format `Authorization: Bearer {token}`.
  4.  This means that individual API call functions don't need to worry about adding the token themselves; it's handled automatically and globally.
  5.  It includes logging to help debug token issues.

### Response Interceptor
- **Purpose**: To provide global logging for all API responses and to handle authentication errors (HTTP 401) in a centralized way.
- **How it Works**:
  1.  **On Success**: If a response is successful (e.g., status 200), it simply logs the details of the response (URL, status, data) for debugging purposes and then passes the response along.
  2.  **On Error**: If a response is an error, it logs the error details.
  3.  **Global 401 Handling**: It specifically checks if the error status is `401 Unauthorized`. If it is, this indicates that the user's token is invalid or has expired. The interceptor then:
      a.  Calls `setShowTokenExpiredModal(true)` from the `useGlobalUiStore` to display a modal informing the user their session has ended.
      b.  Calls `clearCredentials()` from the `useAuthStore` to remove the invalid token from the application's state and storage.
      c.  After a 4-second delay (to allow the user to read the modal), it redirects the user to the `/login` page.
      d.  This is extremely powerful because it means no other part of the application needs to write its own logic for handling expired tokens. It's all handled here.

### `handleApiError`
- **Description**: A simple utility function that takes an error of unknown type, extracts a message from it, and re-throws it as a standard `Error` object. This can be used to normalize error handling in other parts of the code.

## Summary

This configuration file is a cornerstone of the application's architecture. By centralizing API setup and using interceptors, it makes the rest of the data-fetching code cleaner, more consistent, and more robust. The automatic handling of authentication tokens and 401 errors significantly reduces boilerplate code and improves the user experience.
