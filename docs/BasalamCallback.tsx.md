# BasalamCallback Page

The `BasalamCallback` page is a crucial part of the OAuth 2.0 authentication flow with the "Basalam" service. This page is not meant to be visited directly by the user; instead, the user is redirected here by Basalam after they have authorized the application.

## Functionality

- **OAuth Callback Handling**: This page's primary responsibility is to handle the redirect from the Basalam authentication server.
- **Parameter Extraction**:
  - In a `useEffect` hook, it parses the URL of the current window (`window.location.search`) to extract the `code` and `state` query parameters. These are standard parameters sent by an OAuth 2.0 provider after a user grants consent.
- **Inter-window Communication**:
  - This page is designed to work as a popup or a new tab that is opened by the main application window.
  - It sets up an event listener for `message` events (`window.addEventListener('message', messageHandler)`). This is a secure way for different windows (even from different origins, if configured correctly) to communicate.
  - It waits for the main application window (which is expected to be the one that opened this popup) to send a message containing the `access_token` and `refresh_token`. The main window is responsible for exchanging the `code` for these tokens with the backend.
- **Credential Storage**:
  - Once it receives the tokens via the `message` event, it uses the `setBasalamCredentials` function from the `useAuthStore` (a Zustand store) to securely store the Basalam access and refresh tokens in the application's state.
- **User Feedback and Navigation**:
  - It displays a "Connecting to Basalam..." message to the user so they know what's happening.
  - Upon successful receipt of the tokens, it shows a success alert (`'Successfully connected to Basalam!'`).
  - If there's an error (e.g., missing `code`, no `access_token` in the message), it shows an error alert.
  - In either case (success or failure), it cleans up the event listener and navigates the user back to the main page (`'/'`) using the `useNavigate` hook from `react-router-dom`.

## Usage

This page is part of a larger authentication flow:

1. The user clicks a "Connect to Basalam" button in the main application.
2. The application opens a popup window pointing to the Basalam authorization URL.
3. The user logs in to Basalam and approves the application's request for access.
4. Basalam redirects the user's browser (within the popup) to this `/basalam/callback` page, including a `code` in the URL.
5. The main application window's backend exchanges this `code` for an `access_token`.
6. The main window then sends this `access_token` to this popup window using `window.postMessage`.
7. This `BasalamCallback` page receives the message, stores the token, and closes itself (by navigating away or being closed by the parent window).

## How It Works

1. The component mounts, and the `useEffect` hook runs.
2. It immediately parses the URL for the `code` and `state`.
3. It sets up a listener for `message` events.
4. It waits. The user sees a "Connecting..." screen.
5. The parent window does its work and eventually sends a `postMessage` event to this window.
6. The `messageHandler` function is triggered. It checks the received data for an `access_token`.
7. If a token is found, it calls `setBasalamCredentials` to save it, removes the event listener to prevent memory leaks, alerts the user of success, and navigates away.
8. If no token is found or an error occurs, it alerts the user of the failure and navigates away.

This component is a good example of how to handle a client-side OAuth 2.0 redirect and communicate between a popup and the main application window.
