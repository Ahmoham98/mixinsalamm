# PaymentsPage

The `PaymentsPage` is a straightforward component responsible for displaying a user's payment history.

## Functionality

- **Data Fetching**:
  - When the component mounts, it uses a `useEffect` hook to make a GET request to the `/api/payments/` endpoint.
  - This API call is made using the pre-configured `api` instance from `../services/api/config`, which likely includes base URL and authentication headers.
- **State Management**:
  - It uses local state to manage the list of payments (`payments`) and the loading status (`loading`).
  - `loading` is initially `true`. Once the API call completes, the fetched payment data is stored in the `payments` state, and `loading` is set to `false`.
- **Display**:
  - While the data is being fetched, it displays a simple "در حال بارگذاری..." (Loading...) message.
  - Once the data is loaded, it renders the `PaymentHistory` component, passing the fetched `payments` array as a prop. The `PaymentHistory` component is responsible for the actual rendering of the payment list.
  - It also includes a `BackHomeButton` for easy navigation back to the main dashboard.

## How It Works

1. The user navigates to the route that renders `PaymentsPage` (e.g., `/payments`).
2. The `PaymentsPage` component mounts, and the `loading` state is `true`. A loading message is displayed.
3. The `useEffect` hook fires, calling the `api.get("/api/payments/")`.
4. The API returns a list of payment objects.
5. The `.then()` block of the promise is executed. The response data is saved to the `payments` state, and `loading` is set to `false`.
6. The component re-renders. This time, `loading` is `false`, so it renders the `PaymentHistory` component, which then displays the list of payments.

This component follows a common and effective pattern for fetching and displaying data in React:
1.  Initialize with a loading state.
2.  Fetch data in `useEffect`.
3.  Update state with the fetched data and set loading to false.
4.  Render the data (or a loading/error message) based on the current state.
