# TokenExpiredModal Component

The `TokenExpiredModal` component is a modal dialog that informs the user that their authentication token has expired. It's a crucial component for handling session timeouts and forcing re-authentication.

## Props

- **`open: boolean`**: A boolean that controls whether the modal is open or closed.

## Functionality

- **Conditional Rendering**: The modal is only rendered if the `open` prop is `true`.
- **Informative Message**: It displays a clear message to the user:
  - **Title**: "توکن شما منقضی شده است" (Your token has expired).
  - **Description**: "برای ادامه استفاده از خدمات، لطفاً دوباره وارد شوید." (To continue using the services, please log in again).
- **Visual Cues**:
  - It uses a prominent warning icon to grab the user's attention.
  - It includes a loading spinner and the text "در حال انتقال به صفحه ورود..." (Redirecting to the login page...) to let the user know that an automatic action is in progress.
- **No User Interaction**: This modal is designed to be purely informational. It does not have any close buttons, as the intended behavior is to automatically redirect the user to the login page. The parent component or a global state handler is responsible for performing the actual redirection.
- **Styling**: The modal is styled with Tailwind CSS to be a full-screen overlay with a centered dialog, effectively blocking interaction with the rest of the page.

## Usage

This component should be triggered by a global mechanism that detects when an API call fails with an authentication error (e.g., a 401 Unauthorized status). This is often handled in a global Axios or Fetch interceptor.

```jsx
// In a global state store (e.g., globalUiStore.ts)
const useGlobalUiStore = create((set) => ({
  showTokenExpiredModal: false,
  setShowTokenExpiredModal: (show) => set({ showTokenExpiredModal: show }),
}));

// In an API interceptor (e.g., api/config.ts)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      useAuthStore.getState().logout(); // Clear user session
      useGlobalUiStore.getState().setShowTokenExpiredModal(true); // Show the modal
      setTimeout(() => {
        window.location.href = "/login"; // Redirect after a delay
      }, 3000);
    }
    return Promise.reject(error);
  },
);

// In the main App component
function App() {
  const showTokenExpiredModal = useGlobalUiStore(
    (state) => state.showTokenExpiredModal,
  );
  return (
    <div>
      <TokenExpiredModal open={showTokenExpiredModal} />
      {/* Rest of the app */}
    </div>
  );
}
```

## How It Works

1. The component's visibility is controlled by the `open` prop.
2. When `open` is `true`, it renders a full-screen overlay that prevents the user from interacting with the page.
3. It displays a message indicating that the session has expired and that a redirection is imminent.
4. The actual redirection logic is handled outside of this component, typically in the same place where the modal's state is managed. This separation of concerns makes the component purely presentational.
5. The spinning loader provides feedback to the user that the application is busy redirecting them.
