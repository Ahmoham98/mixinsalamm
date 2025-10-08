# Auth Store

This file defines the `useAuthStore`, a global state management store created using Zustand. This store is responsible for handling all authentication-related data, including user credentials and application settings.

## Key Features

- **Zustand**: It uses Zustand for state management, which is a small, fast, and scalable state management solution for React.
- **Persistence**: It uses the `persist` middleware from `zustand/middleware`. This is a crucial feature that automatically saves the entire state of the store to `localStorage` (or another specified storage). When the user reloads the page, the store is automatically rehydrated with the saved data, allowing the user to stay logged in across sessions. The data is stored under the key `'auth-storage'`.

## State (`AuthState`)

The store manages the following pieces of state:

- **`mixinCredentials`**: An object of type `MixinCredentials` or `null`. It holds the user's Mixin store URL and access token.
- **`basalamCredentials`**: An object of type `BasalamCredentials` or `null`. It holds the user's Basalam access token and other related data.
- **`settings`**: An object of type `UserSettings` that stores the user's preferences for application behavior. This includes:
  - `autoSyncEnabled`: Whether to automatically sync products.
  - `autoMigrationEnabled`: Whether to automatically migrate products.
  - `autoMigrationThreshold`: The number of products to queue before auto-migration starts.
  - `preferBasalamFromMixin`: A directional preference for syncing.
  - `preferMixinFromBasalam`: The other directional preference for syncing.

## Actions

The store provides the following actions (functions) to modify the state:

- **`setMixinCredentials(credentials)`**: Updates the `mixinCredentials` in the store.
- **`setBasalamCredentials(credentials)`**: Updates the `basalamCredentials` in the store.
- **`updateSettings(newSettings)`**: Merges a partial `UserSettings` object with the existing settings. This allows updating one setting without having to provide the entire settings object.
- **`clearCredentials()`**: Resets the store to its initial state, effectively logging the user out. It clears both `mixinCredentials` and `basalamCredentials` and resets all settings to their default values.
- **`isAuthenticated()`**: A convenience function that returns `true` only if both `mixinCredentials` and `basalamCredentials` are present, and `false` otherwise. This is used throughout the application to protect routes and conditionally render UI elements.

## Usage

This store is used as a single source of truth for authentication and settings throughout the application.

```jsx
// Example of using the store in a component
import { useAuthStore } from "./authStore";

function MyComponent() {
  // Select specific pieces of state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const settings = useAuthStore((state) => state.settings);

  // Get an action to call
  const clearCredentials = useAuthStore((state) => state.clearCredentials);

  if (!isAuthenticated) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      <p>Auto-sync is {settings.autoSyncEnabled ? "enabled" : "disabled"}.</p>
      <button onClick={clearCredentials}>Log Out</button>
    </div>
  );
}
```

By centralizing this state, the application ensures that all components have a consistent and up-to-date view of the user's authentication status and preferences. The persistence middleware greatly enhances the user experience by eliminating the need to log in every time the app is opened.
