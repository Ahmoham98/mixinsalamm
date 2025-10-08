# SupportPage

The `SupportPage` is a static informational page that provides users with contact details for customer support.

## Functionality

- **Information Display**:
  - The primary function of this page is to display contact information for support.
  - It clearly lists the support phone number and email address.
  - It also includes a helpful "Guide" section that advises users on what information to prepare before contacting support (e.g., a description of the problem, screenshots, username) to expedite the resolution process.
- **Navigation**:
  - Like other pages in the application, it features a persistent, collapsible sidebar for easy navigation to all major sections of the app (Dashboard, Settings, Pricing, etc.).
  - A `BackHomeButton` is also present for a quick return to the main dashboard.
- **Layout**:
  - The page uses a clean, two-column layout to present the contact methods (phone and email) in distinct cards.
  - The overall styling is consistent with the rest of the application, using the same color scheme, fonts, and gradient backgrounds.
- **Future-Proofing**:
  - The text "تا زمان آماده‌شدن سامانه تیکتینگ..." (Until the ticketing system is ready...) indicates that this page is a temporary solution and that a more advanced, integrated support system is planned for the future.

## How It Works

This is a very simple component with no complex state or logic.

1. The user navigates to the `/support` route.
2. The `SupportPage` component renders.
3. The component displays static HTML and text, including the contact details and guidance notes.
4. The navigation sidebar and back button are rendered, allowing the user to move to other parts of the application.

This page serves its purpose effectively by providing essential information in a clear and accessible manner, while also managing user expectations about future support features.
