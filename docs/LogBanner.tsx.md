# LogBanner Component

The `LogBanner` component is a UI element designed to display a list of log entries, such as errors and notifications. It's styled to be noticeable but not intrusive, with a scrollable area for viewing multiple logs.

## Type Definitions

- **`LogEntry`**: This type defines the structure of a single log entry.
  - `id`: A unique identifier for the log entry.
  - `platform`: The platform the log originated from, either `'basalam'` or `'mixin'`.
  - `productId`: An optional product ID associated with the log.
  - `title`: The title of the product or item related to the log.
  - `status`: The status of the operation (e.g., "failed", "success").
  - `message`: The detailed log message.
  - `url`: An optional URL to view the item on its respective platform.
  - `ts`: A timestamp of when the log was created.

## Props

- **`logs: LogEntry[]`**: An array of `LogEntry` objects to be displayed.
- **`onOpenLink?: (entry: LogEntry) => void`**: An optional callback function that is called when the user clicks the "View" button on a log entry. It receives the `LogEntry` object as an argument.

## Functionality

- **Conditional Rendering**: The component will render `null` (i.e., nothing) if the `logs` array is empty or not provided.
- **Displaying Logs**:
  - It displays the last 10 log entries from the `logs` array.
  - Each log entry shows the message, title, status, and timestamp.
  - The logs are displayed in a scrollable container (`max-h-48 overflow-y-auto`).
- **"View" Button**:
  - If the `onOpenLink` callback is provided, a button is rendered for each log entry.
  - The button's text is dynamic, showing "مشاهده در باسلام" (View in Basalam) or "مشاهده در میکسین" (View in Mixin) based on the `platform` of the log.
  - Clicking this button will trigger the `onOpenLink` callback, allowing the parent component to handle the action (e.g., opening a new tab with the provided URL).
- **Styling**: The component is styled using Tailwind CSS, with a distinct amber color scheme to draw attention to the logs as warnings or notifications.

## Usage

This component is intended to be used in parts of the application where you want to provide feedback to the user about background processes, API calls, or other operations that might produce logs.

```jsx
import LogBanner, { LogEntry } from './LogBanner';

function MyPageComponent() {
  const logs: LogEntry[] = [
    // ... array of log entries
  ];

  const handleOpenLink = (entry: LogEntry) => {
    if (entry.url) {
      window.open(entry.url, '_blank');
    }
  };

  return (
    <div>
      {/* Other content */}
      <LogBanner logs={logs} onOpenLink={handleOpenLink} />
    </div>
  );
}
```

## How It Works

1. The component receives an array of `logs` as a prop.
2. It first checks if there are any logs to display. If not, it returns `null`.
3. It then maps over the first 10 logs in the array.
4. For each log, it renders a styled `div` containing the log's information.
5. If the `onOpenLink` prop is provided, it also renders a button that, when clicked, calls the `onOpenLink` function with the corresponding log entry.
6. The entire component is wrapped in a styled container with a scrollable area to manage a large number of logs without taking up too much space.
