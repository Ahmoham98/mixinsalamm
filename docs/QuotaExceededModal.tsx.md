# QuotaExceededModal Component

The `QuotaExceededModal` component is a modal dialog that appears to inform the user that they have reached a specific usage quota. It's designed to be more intrusive than the `QuotaBanner` to ensure the user acknowledges the limitation. It provides a clear explanation and a strong call to action.

## Props

- **`isOpen: boolean`**: A boolean that controls whether the modal is open or closed.
- **`onClose: () => void`**: A callback function that is called when the modal should be closed (e.g., by clicking the close button or the "Close" button).
- **`type: 'migration' | 'realtime'`**: Specifies the type of quota that has been exceeded, which determines the text content of the modal. It can be for `'migration'` (product migration) or `'realtime'` (real-time updates).

## Functionality

- **Conditional Rendering**: The modal is only rendered if the `isOpen` prop is `true`.
- **Dynamic Content**: The title and description of the modal are dynamically set based on the `type` prop, making the component reusable for different quota types.
- **Navigation**: It uses the `useNavigate` hook from `react-router-dom` to programmatically navigate the user to the pricing page when they click the "Upgrade Plan" button.
- **Call to Action**:
  - The primary call to action is a prominent "ارتقا پلن" (Upgrade Plan) button with a gradient background. Clicking it first closes the modal (by calling `onClose`) and then redirects the user to the `/pricing` page.
  - A secondary "بستن" (Close) button is also provided for the user to simply dismiss the modal.
- **Informative Content**: The modal includes a "راه‌حل پیشنهادی" (Suggested Solution) section that outlines the steps the user should take to upgrade their plan.
- **Animated Icon**: It features an animated `AlertTriangle` icon to visually draw attention to the warning.
- **Styling**: The modal is styled using Tailwind CSS to appear as an overlay on top of the page content, with a backdrop to dim the background. It has a modern, rounded design with clear typography and color coding (red for the warning, blue for the informational section).

## Usage

This component is typically used in response to a user action that fails due to a quota limit. For example, if a user tries to migrate a product and the API returns a "quota exceeded" error, the application can trigger this modal.

```jsx
import { QuotaExceededModal } from './QuotaExceededModal';
import { useState } from 'react';

function ProductMigrationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'migration' | 'realtime'>('migration');

  const handleMigrate = async () => {
    try {
      // API call to migrate product
    } catch (error) {
      if (error.isQuotaError) {
        setModalType('migration');
        setIsModalOpen(true);
      }
    }
  };

  return (
    <div>
      <button onClick={handleMigrate}>Migrate Products</button>
      <QuotaExceededModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
      />
    </div>
  );
}
```

## How It Works

1. The component's visibility is controlled by the `isOpen` prop.
2. When `isOpen` is `true`, it renders a full-screen overlay with a centered modal dialog.
3. The content of the modal is determined by the `type` prop.
4. The "Upgrade Plan" button has an `onClick` handler that first calls `onClose` to dismiss the modal and then uses the `navigate` function to redirect the user.
5. The "Close" button and the "X" icon in the corner both call the `onClose` function to dismiss the modal without any further action.
6. The component uses a combination of `fixed` positioning, a backdrop with a blur effect, and a high `z-index` to ensure it appears on top of all other content.
