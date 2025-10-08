# UsagePage

Similar to the `SubscriptionPage`, the `UsagePage` is a simple placeholder component designed to redirect users.

## Functionality

- **Redirection**:
  - The component renders a message informing the user that usage information has been moved to the pricing page.
  - It provides a direct link to the `/pricing` page, where the `UsageDashboard` component is now located.
- **Navigation**:
  - It includes a `BackHomeButton` component for easy navigation back to the main application dashboard.

## Reason for Existence

This page serves the same purpose as the `SubscriptionPage`:

1.  **Legacy Support**: It prevents "404 Not Found" errors for users who might have bookmarked a previous `/usage` route.
2.  **Logical Evolution**: During development, it's common to start with separate pages for different features (like subscription, pricing, and usage). Over time, it often makes more sense to combine related information into a single, more comprehensive dashboard. This page is a remnant of that evolution, ensuring a smooth transition by guiding users to the new, consolidated `PricingPage`.

Its role is purely to act as a signpost, directing users to the correct and current location for usage statistics.
