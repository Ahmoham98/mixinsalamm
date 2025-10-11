# CredentialsPage and Connection Modals

This file contains the `CredentialsPage` and the associated `Modal` components, which together manage the process of connecting the user's Mixin and Basalam accounts. This is a critical step for the user to start using the application.

## Main Component: `CredentialsPage`

This page serves as the central hub for the user to initiate connections to the external services (Mixin and Basalam).

### Functionality

- **State Management**:
  - It uses the `useAuthStore` (a Zustand store) to get and set credentials for both Mixin and Basalam (`mixinCredentials`, `basalamCredentials`).
  - It also uses the `isAuthenticated` function from the store to check if the user is fully authenticated (i.e., both accounts are connected).
- **UI State**:
  - The main buttons ("اتصال به میکسین" and "اتصال به باسلام") change their appearance (color and text) based on whether the respective service is already connected, providing clear visual feedback.
  - A "Go to Home Page" button appears once at least one service is connected.
- **Connection Handling**:
  - **Mixin**:
    - Clicking the "Connect to Mixin" button opens a modal (`Modal` component).
    - The `handleMixinConnect` function is passed to the modal. This function calls the Mixin API to validate the credentials entered by the user. On success, it stores the credentials in the Zustand store, closes the modal, shows a success message, and navigates to the home page.
  - **Basalam**:
    - The `handleBasalamConnect` function handles the Basalam OAuth flow. It opens the Basalam SSO URL in a new tab (`window.open`).
    - It sets up a `message` event listener to receive the access token from the backend via the callback window.
    - It includes a fallback mechanism (`setInterval`) to check if the popup window has been closed, in case the message event fails.
- **User Bootstrapping (`callBootstrapIfReady`)**:
  - This crucial function is called after either Mixin or Basalam successfully connects.
  - It checks if _both_ Mixin and Basalam tokens are now present in the state.
  - If both are present, it performs a one-time "bootstrap" process:
    1. It calls `ensureUser` to create or verify the user's record in the application's own database.
    2. It calls `createDefaultSubscription` and `createInitialUsageRecord` to set up the user's initial subscription and usage data.
    3. It sets a `sessionStorage` flag (`bootstrap_done`) to prevent this process from running again in the same session.
- **Redirection**:
  - A `useEffect` hook checks if the user is fully authenticated and the bootstrap process is done. If so, it automatically navigates them to the `/home` page, preventing them from staying on the login page unnecessarily.
- **URL Parameter Handling**: It checks for URL parameters like `basalam_connected=true` or `error=...` to display appropriate alerts to the user after they return from the Basalam authentication flow.

---

## Sub-Component: `Modal`

This is a reusable modal component used for entering credentials, currently configured for Mixin.

### Props

- `isOpen`, `onClose`: Standard modal control props.
- `onSubmit`: A callback function that is called with the entered URL and token when the user clicks the "Connect" button.
- `type`: Specifies the type of modal ('mixin' or 'basalam'), which determines the title and fields.

### Functionality

- **Input Fields**: It provides input fields for the Mixin store URL and access token.
- **Guide Modals**:
  - It includes "راهنما" (Guide) buttons next to each input field.
  - Clicking these buttons opens _another_ modal that provides specific instructions on how to find the required information.
  - The token guide modal even includes an embedded video tutorial for clarity.
- **Styling**: It's a well-styled modal that appears as an overlay, with clear inputs and buttons. The nested guide modals provide an excellent user experience by offering help directly where it's needed.

## How It Works

1. The user lands on the `CredentialsPage`.
2. They click "Connect to Mixin". The `Modal` opens.
3. The user enters their Mixin URL and token and clicks "Connect".
4. The `handleMixinConnect` function is called, which validates the credentials with the backend.
5. On success, the credentials are saved, and `callBootstrapIfReady` is triggered.
6. The user then clicks "Connect to Basalam". A new tab opens for Basalam login.
7. After the user authorizes on Basalam, the backend redirects to a page that sends a `postMessage` with the tokens back to the main `CredentialsPage`.
8. The `messageHandler` on the `CredentialsPage` catches these tokens, saves them, and triggers `callBootstrapIfReady` again.
9. Now that both tokens are present, the bootstrap process runs, creating the user record and subscription in the database.
10. The user is then automatically redirected to the `/home` page.
