# QuotaBanner Component

The `QuotaBanner` component is a notification banner that appears at the top of the page to inform the user that they have reached a usage quota limit. It provides a clear message and a call to action to upgrade their plan.

## Props

- **`open: boolean`**: A boolean that controls whether the banner should be displayed.
- **`type: 'migration' | 'realtime' | null`**: Specifies the type of quota that has been exceeded. This determines the text content of the banner. It can be for `'migration'` (product migration) or `'realtime'` (real-time updates).
- **`onClose: () => void`**: A callback function that is called when the banner is closed, either by clicking the close button or after a timeout.

## Functionality

- **Visibility Control**: The banner's visibility is controlled by the `open` prop. It uses an internal `visible` state to handle the display, which allows for a timeout effect.
- **Auto-Close Timer**: When the banner becomes visible, it automatically closes itself after 10 seconds. This is handled by a `setTimeout` in a `useEffect` hook. The timer is cleared if the component unmounts or if the `open` prop changes.
- **Dynamic Content**: The title and description of the banner are dynamically set based on the `type` prop. This allows the component to be reused for different types of quota limits.
- **Call to Action**: The banner includes a prominent "ارتقای پلن" (Upgrade Plan) button that links to the `/pricing` page, guiding the user on how to resolve the quota issue.
- **Manual Close**: A close button with an "X" icon is provided for the user to dismiss the banner manually. Clicking this button calls the `onClose` prop.
- **Styling**: The component is styled with Tailwind CSS to be a "sticky" banner at the top of the page (`sticky top-0`). It has a distinct orange/red gradient to signify a warning.

## Usage

This component should be used in conjunction with a global state management solution (like Zustand or Redux) that tracks whether a quota has been exceeded. The parent component would then render this banner based on that global state.

```jsx
import QuotaBanner from "./QuotaBanner";
import { useGlobalUiStore } from "../store/globalUiStore";

function App() {
  const { showQuotaBanner, quotaBannerType, setQuotaBanner } =
    useGlobalUiStore();

  return (
    <div>
      <QuotaBanner
        open={showQuotaBanner}
        type={quotaBannerType}
        onClose={() => setQuotaBanner(false, null)}
      />
      {/* The rest of the application */}
    </div>
  );
}
```

## How It Works

1. The component's visibility is initially determined by the `open` prop.
2. A `useEffect` hook listens for changes to the `open` prop. When `open` becomes `true`, it sets the internal `visible` state to `true` and starts a 10-second timer.
3. After 10 seconds, the timer fires, setting `visible` to `false` and calling the `onClose` function to update the global state.
4. If the user clicks the close button, the `onClose` function is called immediately.
5. The content of the banner (title and description) is determined by the `type` prop.
6. A `Link` component from `react-router-dom` is used for the "Upgrade Plan" button to ensure smooth client-side navigation.
7. If `visible` is `false` or `type` is `null`, the component renders `null`, so it doesn't take up any space in the DOM.
