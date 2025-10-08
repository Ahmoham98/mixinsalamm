# SubscriptionCard Component

The `SubscriptionCard` component is a detailed card that displays the user's current subscription plan, its status, and key details. It also provides a call to action to upgrade the plan.

## Interface Definition

- **`Plan`**: This component reuses the `Plan` interface from `PricingTable.tsx`, which defines the structure of a subscription plan.

## Props

- **`plan: Plan | null`**: The user's current plan object. If `null`, it means the user has no active plan.
- **`status: string`**: The current status of the subscription (e.g., 'active', 'cancelled', 'expired').
- **`renewalDate?: string`**: An optional date string indicating when the plan will renew.
- **`cancelAtPeriodEnd?: boolean`**: An optional boolean indicating if the subscription is set to be canceled at the end of the current billing period.
- **`onUpgradePlan?: () => void`**: An optional callback function to be called when the "Upgrade Plan" button is clicked.

## Functionality

- **No Active Plan State**: If the `plan` prop is `null`, the component renders a special state indicating that no plan is active, prompting the user to select one.
- **Dynamic Status Display**:
  - The component uses helper functions (`getStatusColor` and `getStatusIcon`) to display the subscription status with a corresponding color and icon, providing a quick visual reference.
- **Detailed Plan Information**: The card clearly displays the key aspects of the user's plan:
  - Monthly price.
  - Migration quota.
  - Real-time update quota.
- **Renewal and Cancellation Info**:
  - If a `renewalDate` is provided, it's displayed in a formatted way.
  - If `cancelAtPeriodEnd` is `true`, a notice is shown to inform the user that their subscription will not renew.
- **Upgrade Button**: If the `onUpgradePlan` callback is provided, an "ارتقاء پلن" (Upgrade Plan) button is rendered, allowing the user to initiate the upgrade process.
- **Styling**: The component is heavily styled with Tailwind CSS, using gradients, shadows, and custom icons to create a premium and visually appealing card.

## Usage

This component is ideal for a user's account or subscription management page, where they can see the details of their current plan.

```jsx
import SubscriptionCard from './SubscriptionCard';
import { Plan } from './PricingTable';

function SubscriptionPage() {
  const userPlan: Plan | null = {
    // ... plan object from API
  };
  const subscriptionStatus = 'active';
  const renewalDate = '2024-12-31';

  const handleUpgrade = () => {
    // navigate to pricing page
  };

  return (
    <div>
      <SubscriptionCard
        plan={userPlan}
        status={subscriptionStatus}
        renewalDate={renewalDate}
        onUpgradePlan={handleUpgrade}
      />
    </div>
  );
}
```

## How It Works

1. The component first checks if a `plan` object exists. If not, it shows the "no active plan" message and stops.
2. If a plan exists, it renders a detailed card.
3. Helper functions `getStatusColor` and `getStatusIcon` are used to dynamically style the status badge based on the `status` prop.
4. It displays all the important details of the plan in separate, styled sections.
5. It conditionally renders the renewal date and cancellation notice based on whether the corresponding props are provided.
6. It conditionally renders the "Upgrade Plan" button. If the `onUpgradePlan` prop is not passed, the button will not be shown.
7. The entire card is wrapped in a container with hover effects to make the UI more interactive.
