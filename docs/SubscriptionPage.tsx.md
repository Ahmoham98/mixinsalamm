# SubscriptionPage

The `SubscriptionPage` is a simple placeholder component. Its primary purpose is to redirect users to the `PricingPage`.

## Functionality

- **Redirection**:
  - The component doesn't contain any complex logic. It simply renders a message informing the user that the subscription information has been moved.
  - It provides a link to the `/pricing` page, where the user can find all the details about their subscription and available plans.
- **Navigation**:
  - It includes a `BackHomeButton` component, allowing the user to easily return to the main dashboard.

## Reason for Existence

This page likely exists for one of two reasons:

1.  **Legacy Support**: There might have been a dedicated `/subscription` route in a previous version of the application. This page ensures that any old bookmarks or links to that route don't result in a "404 Not Found" error. Instead, users are gracefully redirected to the correct location.
2.  **Code Organization**: It might have been created as a placeholder during development before the decision was made to merge the subscription and pricing information onto a single page.

In either case, its current role is purely informational and navigational. It directs traffic to the more comprehensive `PricingPage`.
