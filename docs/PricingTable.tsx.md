# PricingTable Component

The `PricingTable` component is a responsive UI element designed to display different subscription plans in a visually appealing and comparable format. It highlights the user's current plan and provides a way to select a new one.

## Interface Definition

- **`Plan`**: This interface defines the structure of a single pricing plan object.
  - `id`: A unique identifier for the plan.
  - `name`: The name of the plan (e.g., 'Free', 'Basic', 'Pro').
  - `price_monthly`: The monthly price of the plan.
  - `quota_migration` / `quota_migrations`: The number of product migrations allowed. The component is designed to handle both `quota_migration` and `quota_migrations` as possible field names from the backend.
  - `quota_realtime_updates`: The number of real-time product updates allowed.
  - `features`: An optional array of strings, listing additional features of the plan.

## Props

- **`plans: Plan[]`**: An array of `Plan` objects to be displayed.
- **`currentPlanId?: number`**: An optional ID of the user's currently active plan. This is used to highlight the current plan.
- **`onSelectPlan: (planId: number) => void`**: A callback function that is triggered when a user clicks the "Select Plan" button. It receives the ID of the selected plan.

## Functionality

- **Dynamic Rendering**: The component maps over the `plans` array to render a card for each plan.
- **Responsive Layout**: It uses a responsive grid that adjusts the number of columns based on the screen size (1 on small screens, 2 on medium, 4 on large).
- **Current Plan Highlighting**: If a `currentPlanId` is provided and matches a plan's ID, that plan's card is visually distinguished with a different style, a "فعلی" (Current) badge, and a disabled action button.
- **Dynamic Styling**: The component uses several helper functions (`getPlanIcon`, `getPlanGradient`, `getPlanBorderColor`, `getPlanBgColor`) to apply different icons, colors, and gradients to each plan card based on its name and whether it's the current plan. This makes the pricing table more visually engaging.
- **Plan Selection**: For plans that are not the current one, a button is displayed to "انتخاب پلن" (Select Plan). Clicking this button calls the `onSelectPlan` prop with the plan's ID.

## Usage

This component is meant to be used on a pricing or subscription page where users can compare and choose a plan.

```jsx
import PricingTable, { Plan } from './PricingTable';

function PricingPage() {
  const availablePlans: Plan[] = [
    // ... array of plan objects fetched from an API
  ];
  const userCurrentPlanId = 1; // Example current plan ID

  const handlePlanSelection = (planId: number) => {
    console.log(`User selected plan with ID: ${planId}`);
    // Logic to handle plan change
  };

  return (
    <div>
      <h1 className="text-center">Choose Your Plan</h1>
      <PricingTable
        plans={availablePlans}
        currentPlanId={userCurrentPlanId}
        onSelectPlan={handlePlanSelection}
      />
    </div>
  );
}
```

## How It Works

1. The component receives the `plans`, `currentPlanId`, and `onSelectPlan` props.
2. It iterates through the `plans` array using `.map()`.
3. For each `plan`, it first checks if it is the current plan by comparing `plan.id` with `currentPlanId`.
4. Based on the plan's name and whether it's the current plan, helper functions determine the appropriate CSS classes for backgrounds, borders, and gradients, and select the correct icon.
5. It renders a card with all the plan's details: name, price, quotas, and features.
6. The action button at the bottom of the card is conditionally rendered. If it's the current plan, the button is disabled and shows a "Current Plan" message. Otherwise, it's an active button that triggers the `onSelectPlan` callback when clicked.
