# PaymentHistory Component

The `PaymentHistory` component is a UI element designed to display a user's payment history in a clear, tabular format.

## Interface Definition

- **`Payment`**: This interface defines the structure of a single payment object.
  - `id`: A unique identifier for the payment.
  - `amount`: The amount of the payment.
  - `currency`: The currency of the payment (e.g., "USD", "IRR").
  - `status`: The status of the payment (e.g., "paid", "failed").
  - `created_at`: The date and time the payment was created, as a string.
  - `invoice_url`: An optional URL to download the invoice for the payment.

## Props

- **`payments: Payment[]`**: An array of `Payment` objects to be displayed in the history table.

## Functionality

- **Conditional Rendering**:
  - If the `payments` array is empty, the component displays a message "هیچ پرداختی ثبت نشده است." (No payments have been recorded).
  - If there are payments, it renders a table with the payment details.
- **Table Display**: The component renders a table with the following columns:
  - **تاریخ (Date)**: The date of the payment, formatted for the Persian locale (`fa-IR`).
  - **مبلغ (Amount)**: The payment amount and currency.
  - **وضعیت (Status)**: The payment status. The text color is green for "paid" and red for "failed" to provide a quick visual cue.
  - **فاکتور (Invoice)**: A link to download the invoice. If no `invoice_url` is available, it displays a dash (—).
- **Styling**: The component is styled using Tailwind CSS to create a clean, modern table layout within a shadowed, rounded container.

## Usage

This component is designed to be used on a page where a user can view their transaction history, such as a billing or account page.

```jsx
import PaymentHistory, { Payment } from './PaymentHistory';

function BillingPage() {
  const userPayments: Payment[] = [
    // ... array of payment objects fetched from an API
  ];

  return (
    <div>
      <h1>Billing</h1>
      <PaymentHistory payments={userPayments} />
    </div>
  );
}
```

## How It Works

1. The component receives an array of `payments` as a prop.
2. It checks the length of the `payments` array to decide whether to show the "no payments" message or the history table.
3. If there are payments, it maps over the `payments` array to create a table row (`<tr>`) for each payment.
4. Each cell (`<td>`) in the row displays a piece of information from the payment object, with appropriate formatting (e.g., for the date and status).
5. The invoice link is a standard anchor tag (`<a>`) that opens in a new tab for a better user experience.

This component is a good example of how to display structured data in a user-friendly way, with clear visual indicators for important information like payment status.
