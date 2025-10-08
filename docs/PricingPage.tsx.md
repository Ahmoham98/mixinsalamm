# PricingPage

The `PricingPage` is a comprehensive component that serves as the hub for all subscription and usage-related information. It allows users to view pricing plans, see their current usage, and manage their subscription.

## Functionality

- **Data Fetching**:
  - The component fetches a wide range of data on mount using `Promise.all` for efficiency:
    - `getPlans()`: Retrieves all available pricing plans.
    - `getCurrentSubscription()`: Gets the user's current subscription details.
    - `getUsage()`: Fetches the user's current usage statistics (e.g., how many migrations they've used).
  - It handles potential 401 (Unauthorized) errors from these API calls. If a 401 is detected, it triggers the `handleTokenExpired` function.
- **State Management**:
  - It uses a significant amount of local state (`useState`) to manage:
    - `plans`: The list of available pricing plans.
    - `currentPlanId`: The ID of the user's currently active plan.
    - `usage`: The user's usage data.
    - `subscriptionPlan`, `subscriptionStatus`, `renewalDate`: Details about the current subscription.
    - State for modals (`showModal`, `showTokenExpiredModal`), selected plans, and payment details.
  - It uses the `useAuthStore` to get credentials and to clear them upon token expiration.
- **Components**:
  - **`PricingTable`**: Displays the different pricing plans (e.g., Starter, Pro, Enterprise) and their features. It highlights the user's current plan and provides buttons to select a new plan.
  - **`UsageDashboard`**: Shows the user how much of their quota they have consumed for different features (e.g., "Migrations Used: 50/100").
  - **`SubscriptionCard`**: Displays a summary of the user's current subscription, including the plan name, status (e.g., "active"), and renewal date. It also provides a button to scroll down to the upgrade options.
  - **`BackHomeButton`**: For easy navigation.
- **Subscription Management**:
  - **Upgrade Plan**: When a user selects a new plan from the `PricingTable`, a modal appears.
  - **Payment Modal**: This modal guides the user through the manual payment process:
    1.  It provides a link to a Basalam product page where the user can purchase the new plan.
    2.  It has an input field where the user must enter the payment confirmation ID from Basalam.
    3.  It validates the payment ID to ensure it's a number of a reasonable length.
    4.  Upon submission, it calls the `createPayment` API to log the payment attempt in the backend.
  - **Cancel Subscription**: Although commented out in the provided code, there is a `handleCancelSubscription` function that shows how a user could cancel their subscription. It would send a DELETE request to the `/api/subscription/{id}` endpoint.
- **Authentication Handling**:
  - The `handleTokenExpired` function provides a smooth user experience when an authentication token expires.
  - It shows a modal informing the user that their session has expired.
  - It then automatically clears all credentials from the state and local storage and redirects the user to the login page after a short delay.

## How It Works

1. The user navigates to the pricing page.
2. The component fetches plans, subscription details, and usage data simultaneously. A loading indicator is shown.
3. If any API call returns a 401 error, the token expiration flow is triggered.
4. Once the data is loaded, the component renders three main sections:
   - The `SubscriptionCard` showing the current plan.
   - The `UsageDashboard` showing quota consumption.
   - The `PricingTable` showing all available plans.
5. If the user decides to upgrade, they click a "Select Plan" button in the `PricingTable`.
6. This opens the payment modal. The user is instructed to complete the purchase on Basalam and return with a payment ID.
7. The user enters the payment ID and submits. The `createPayment` API is called.
8. The backend would then have a process (likely manual or semi-automated) to verify this payment and upgrade the user's subscription.
9. The page provides a complete, self-contained experience for users to understand their current standing and how to upgrade their service level.

This page is a critical part of the application's monetization strategy, and it's built to be robust, handling API errors and providing clear instructions for the manual payment process.
