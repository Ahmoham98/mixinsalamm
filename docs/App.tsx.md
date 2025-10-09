# App Component and Routing

This file (`src/App.tsx`) is the main component of the React application. It's responsible for setting up the application's routing, providing global context (like React Query), and managing global UI elements like modals and banners.

## Key Components

### `QueryClientProvider`
- **`<QueryClientProvider client={queryClient}>`**: This component from `@tanstack/react-query` provides the React Query client to all the components in the application. This allows any component to use React Query's hooks for data fetching, caching, and state management.

### `Router`, `Routes`, and `Route`
- **`<Router>` (as `BrowserRouter`)**: This component from `react-router-dom` provides the routing functionality for the application, using the browser's history API to keep the UI in sync with the URL.
- **`<Routes>`**: This component is used to define the different routes in the application. It will render the first `<Route>` that matches the current URL.
- **`<Route>`**: Each `<Route>` component defines a mapping between a URL path and a React component. For example, `<Route path="/home" element={<HomePage />} />` means that when the URL is `/home`, the `HomePage` component will be rendered.

### `PrivateRoute`
- **`function PrivateRoute({ children })`**: This is a custom component that acts as a guard for protected routes.
  - It uses the `useAuthStore` to check if the user is authenticated.
  - If the user is authenticated, it renders the `children` components (the actual page).
  - If the user is not authenticated, it redirects them to the `/login` page using the `<Navigate>` component from `react-router-dom`.
- This is a common pattern for handling authentication in React applications, ensuring that only logged-in users can access certain pages.

### `WithGlobalOverlays`
- **`function WithGlobalOverlays({ children })`**: This is a custom component that wraps the main content of the application and is responsible for displaying global UI elements like modals and banners.
  - It uses the `useGlobalUiStore` to get the state of global UI elements, such as `showTokenExpiredModal` and `showQuotaBanner`.
  - It conditionally renders the `TokenExpiredModal` and `QuotaBanner` components based on the state from the store.
  - It also contains logic to only show the `QuotaBanner` on specific pages (`/home` and `/migration`).
- This component is a good way to centralize the logic for global UI elements, keeping the main `App` component cleaner.

### `App` Component
- **`function App()`**: This is the main functional component that brings everything together.
  - It wraps the entire application in `QueryClientProvider` and `Router`.
  - It uses the `WithGlobalOverlays` component to handle global modals and banners.
  - It defines all the application's routes inside the `<Routes>` component, using the `PrivateRoute` component to protect routes that require authentication.

## Application Routes

The `App` component defines the following routes:
- **`/`**: The landing page (`LandingPage`).
- **`/login`**: The credentials/login page (`CredentialsPage`).
- **`/pricing`**: The pricing page (`PricingPage`).
- **`/usage`**: The usage dashboard, a protected route (`UsagePage`).
- **`/subscription`**: The subscription management page, a protected route (`SubscriptionPage`).
- **`/payments`**: The payments history page, a protected route (`PaymentsPage`).
- **`/migration`**: The migration page, a protected route (`MigrationPage`).
- **`/admin`**: The admin page, a protected route (`AdminPage`).
- **`/basalam/callback`**: The callback URL for the Basalam integration (`BasalamCallback`).
- **`/home`**: The main home page, a protected route (`HomePage`).
- **`/support`**: The support page, a protected route (`SupportPage`).
- **`/settings`**: The settings page, a protected route (`SettingsPage`).

## How It Works

When the application starts, the `App` component is rendered. It sets up the React Query client and the router. The router then looks at the current URL and renders the appropriate component based on the defined routes. If the route is protected by `PrivateRoute`, it first checks for authentication before rendering the page. The `WithGlobalOverlays` component ensures that any global modals or banners can be displayed on top of the current page, based on the state in the `globalUiStore`. This structure provides a clear and organized way to manage the application's layout, routing, and global state.
