# AdminPage

The `AdminPage` is a comprehensive dashboard designed for administrators to view key data across the entire application. It fetches and displays information about users, plans, subscriptions, usage, and payments in a structured and easy-to-read format.

## Key Components

- **`Section`**: A reusable presentational component that wraps each distinct data table (like Users, Plans, etc.). It provides a consistent look with a title and a shadowed background.
- **`AdminPage`**: The main functional component for the page.

## Functionality

- **Data Fetching**:
  - When the component mounts, a `useEffect` hook is triggered.
  - It uses `Promise.all` to make five concurrent API calls to the admin endpoints:
    - `/api/admin/users`
    - `/api/admin/plans`
    - `/api/admin/subscriptions`
    - `/api/admin/usage`
    - `/api/admin/payments`
  - This parallel fetching is efficient, as it doesn't wait for one request to finish before starting the next.
- **State Management**:
  - The component uses multiple `useState` hooks to manage the data for each section (`users`, `plans`, `subs`, `usage`, `payments`).
  - A `loading` state is used to show a "در حال بارگذاری..." (Loading...) message while the data is being fetched. The `finally` block of the promise ensures that `setLoading(false)` is called whether the requests succeed or fail.
- **Data Display**:
  - **Users**: A table showing user ID, email, active status, and role.
  - **Plans**: A grid displaying the details of each subscription plan, including name, price, and quotas.
  - **Subscriptions**: A table listing all user subscriptions, including user ID, plan ID, status, and renewal date.
  - **Usage**: A table showing the quota usage for each user, including the billing period start/end and the amount of migration/real-time updates used.
  - **Payments**: A table of all payment transactions, showing user ID, amount, status, and payment provider.
- **Styling**: The page is styled with Tailwind CSS for a clean, professional look. The use of tables with `overflow-auto` ensures that the page is usable even on smaller screens, as the tables will become scrollable if they are too wide.

## Usage

This page is intended to be a protected route, accessible only to users with an 'admin' role. The routing in `App.tsx` would typically wrap this page in a `PrivateRoute` that also checks for the user's role.

```jsx
// Example of a role-based private route
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated() && user.role === 'admin') {
    return children;
  }
  return <Navigate to="/home" />;
}

// In App.tsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  }
/>
```

## How It Works

1. The user navigates to the `/admin` route.
2. The `AdminPage` component mounts, and the `loading` state is `true`.
3. The `useEffect` hook runs, firing off five API requests in parallel.
4. While waiting for the requests, the user sees a "Loading..." message.
5. Once all promises resolve, the `then` block is executed. The component's state is updated with the data returned from the APIs.
6. The `finally` block sets the `loading` state to `false`.
7. The component re-renders, and since `loading` is now `false`, it displays the main content.
8. The data from the state arrays is mapped over to render the tables and grids for each section.

This page is a classic example of a data-driven administrative dashboard, providing a high-level overview of the application's state.
