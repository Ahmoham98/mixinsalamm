# SettingsPage

The `SettingsPage` is a crucial component that allows users to customize the application's behavior to fit their workflow. It provides a centralized location for managing synchronization and migration preferences.

## Functionality

- **State Management**:
  - It uses the `useAuthStore` (a Zustand store) as the single source of truth for settings.
  - It maintains a `localSettings` state using `useState`. This local state is a temporary copy of the settings that the user can modify. This is a good practice as it prevents every minor UI change (like toggling a checkbox) from immediately triggering a global state update.
  - The `updateSettings` function from the store is only called when the user explicitly clicks the "Save Settings" button.
- **Settings Options**:
  - **Auto-Sync**:
    - A toggle switch to enable or disable automatic synchronization.
    - When enabled, the application will automatically sync changes between platforms for products that exist on both.
    - **Directional Preference**: Two checkboxes allow the user to specify the direction of the sync:
      - "Update Basalam from Mixin changes"
      - "Update Mixin from Basalam changes"
      - The logic ensures these are mutually exclusive; a user can't select both. This prevents potential infinite update loops.
  - **Auto-Migration**:
    - A toggle switch to enable or disable the automatic migration of new products from Mixin to Basalam.
    - **Migration Threshold**: If auto-migration is enabled, the user can select a threshold (1, 3, 5, 7, or 9 products). The automatic migration will only trigger once the number of unique, unsynced Mixin products reaches this threshold. This is a smart feature to prevent the system from firing off API calls for every single new product, allowing for batching.
- **Saving and Feedback**:
  - The "Save Settings" button becomes the trigger to persist the changes.
  - When clicked, it calls `handleSaveSettings`, which:
    - Sets an `isSaving` state to provide visual feedback (e.g., showing a spinner on the button).
    - Calls `updateSettings(localSettings)` to update the global Zustand store.
    - Displays a success or error message to the user for a few seconds.
- **Navigation and Layout**:
  - The page features a persistent sidebar for navigation to other key areas of the application (Dashboard, Migration, Pricing, etc.).
  - The sidebar is responsive and collapsible, providing a good user experience on both large and small screens.
  - A `handleLogout` function is included, which clears all user credentials from the state and local storage before redirecting to the landing page.
- **UI/UX**:
  - The settings are grouped into logical sections (Auto-sync, Auto-migration) with clear headings and descriptive text.
  - Informational tooltips (`<Info>` icon) are used to explain the nuances of each setting, ensuring the user understands the implications of their choices.
  - The UI provides clear visual feedback for saving actions and toggle states.

## How It Works

1. The user navigates to the `/settings` route.
2. The `SettingsPage` component mounts and initializes its `localSettings` state with the current settings from the `useAuthStore`.
3. The user interacts with the UI, toggling switches and selecting options. All these changes are applied only to the `localSettings` state. The global state remains unchanged.
4. For example, when `handleAutoSyncToggle` is called, it updates `localSettings.autoSyncEnabled`.
5. When the user is satisfied with their changes, they click "Save Settings".
6. `handleSaveSettings` is executed. It sets `isSaving` to true, calls `updateSettings(localSettings)` to commit the changes to the global Zustand store (which in turn persists them to local storage), and then shows a confirmation message.
7. Other parts of the application that subscribe to `useAuthStore` will now have access to the updated settings and can adjust their behavior accordingly (e.g., the `HomePage` might start auto-syncing products based on the new settings).

This component demonstrates a robust pattern for handling user settings: load from a central store, edit in local state, and save back to the central store on explicit user action. This makes the application predictable and performant.
