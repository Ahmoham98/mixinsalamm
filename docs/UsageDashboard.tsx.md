# UsageDashboard Component

The `UsageDashboard` component provides a comprehensive and visually engaging overview of the user's consumption of different service quotas. It's composed of a main dashboard and a reusable `UsageBar` sub-component.

## Main Component: `UsageDashboard`

### Props

- **`migrationsUsed: number`**: The number of product migrations the user has consumed.
- **`migrationsQuota: number`**: The total product migration quota for the user's plan.
- **`realtimeUsed: number`**: The number of real-time updates the user has consumed.
- **`realtimeQuota: number`**: The total real-time update quota for the user's plan.

### Functionality

- **Layout**: It serves as a container for the individual `UsageBar` components, arranging them vertically.
- **Header**: It includes a main title "داشبورد مصرف" (Usage Dashboard) with an icon.
- **Summary Section**: At the bottom, it provides a "خلاصه مصرف" (Usage Summary) that shows the total combined usage and quota for all services.
- **Styling**: It's styled as a large, visually appealing card with gradients and shadows.

---

## Sub-Component: `UsageBar`

This is a reusable component designed to display the usage statistics for a single type of quota.

### Props

- **`used: number`**: The amount of the quota that has been used.
- **`quota: number`**: The total available quota.
- **`label: string`**: The name of the quota being displayed (e.g., "مهاجرت محصول").
- **`icon: React.ReactNode`**: An icon to represent the quota type.
- **`color: string`**: A Tailwind CSS class for the background color of the icon.

### Functionality

- **Status Calculation**: It calculates the usage percentage and determines the status (e.g., "Over limit", "Nearing limit", "Within limit") based on the usage ratio.
- **Dynamic Icons and Colors**:
  - It displays a status icon (`AlertTriangle` or `CheckCircle`) based on whether the usage is within limits, nearing the limit (over 80%), or has exceeded the limit.
  - The progress bar and percentage text change color (green, yellow/orange, or red) to reflect the usage status, providing an immediate visual cue.
- **Detailed Stats**: It breaks down the usage into three clear numbers: "مصرف شده" (Used), "باقی‌مانده" (Remaining), and "کل سهمیه" (Total Quota).
- **Progress Bar**: A visually clear progress bar shows the consumption percentage.
- **Styling**: Each `UsageBar` is a self-contained card with a clean layout, making it easy to understand the data at a glance.

## Usage

The `UsageDashboard` is intended for a user's dashboard or account page, where they can monitor their resource consumption.

```jsx
import UsageDashboard from "./UsageDashboard";

function DashboardPage() {
  const usageData = {
    migrationsUsed: 50,
    migrationsQuota: 100,
    realtimeUsed: 900,
    realtimeQuota: 1000,
  };

  return (
    <div>
      <UsageDashboard {...usageData} />
    </div>
  );
}
```

## How It Works

1. The `UsageDashboard` component receives the usage data as props.
2. It renders a header and then two instances of the `UsageBar` component, one for "مهاجرت محصول" (Product Migration) and one for "آپدیت لحظه‌ای" (Real-time Update).
3. Each `UsageBar` component takes its specific `used` and `quota` values.
4. Inside `UsageBar`, it calculates the usage percentage and determines the status (normal, warning, or over limit).
5. It then uses these calculations to conditionally apply styles (colors) and display the correct status icons and text.
6. The progress bar's width is set dynamically using an inline style based on the calculated percentage.
7. Finally, the `UsageDashboard` renders a summary section with the total combined usage.

This component is an excellent example of breaking down a complex UI into smaller, reusable parts (`UsageBar`) and using data to drive a rich, dynamic, and informative user interface.
