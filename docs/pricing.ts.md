# Pricing and Subscription API Service

This file contains a collection of functions for interacting with the application's backend endpoints related to users, plans, subscriptions, usage, and payments. It also includes date utility functions used by the API calls.

## Date Utilities

### `formatNow`

- **Description**: Returns the current date and time as a string in the custom format `YYYY-MM-DD/HH:mm`.
- **Returns**: `string`

### `addDays`

- **Description**: Adds a specified number of days to a date string.
- **Parameters**:
  - `isoLike: string`: A date string in the format `YYYY-MM-DD/HH:mm`.
  - `days: number`: The number of days to add.
- **Returns**: A new date string in the same `YYYY-MM-DD/HH:mm` format.

## API Functions

### Users

#### `ensureUser`

- **Endpoint**: `POST /googlesheet/user/`
- **Description**: This function seems to be related to a Google Sheet integration, likely to create or verify a user record in a spreadsheet.
- **Parameters**: `body: any`
- **Returns**: A `Promise` with the response data.

### Usage

#### `createInitialUsageRecord`

- **Endpoint**: `POST /api/usage/increment`
- **Description**: Creates the first usage record for a new user. It sets the `migration_used` and `realtime_used` counters to 0. The usage period (`period_start` and `period_end`) is set based on the current time and the subscription's renewal date.
- **Parameters**: `periodEnd?: string` (optional)
- **Returns**: A `Promise` with the response data.

#### `getUsage`

- **Endpoint**: `GET /api/usage/`
- **Description**: Fetches the current usage data for the authenticated user.
- **Returns**: A `Promise` with the usage data.

#### `incrementUsage`

- **Endpoint**: `POST /api/usage/increment`
- **Description**: Increments the usage counter for a specific feature. The backend handles the logic of which counter to increment based on the `type` parameter.
- **Parameters**: `type: 'migration' | 'realtime'`
- **Returns**: A `Promise` with the updated usage data.

### Plans

#### `getPlans`

- **Endpoint**: `GET /api/plans/`
- **Description**: Fetches a list of all available pricing plans.
- **Returns**: A `Promise` with an array of plan objects.

#### `getPlanById`

- **Endpoint**: `GET /api/plans/{planId}`
- **Description**: Fetches the details of a single pricing plan by its ID.
- **Parameters**: `planId: number`
- **Returns**: A `Promise` with the plan object.

### Subscriptions

#### `getCurrentSubscription`

- **Endpoint**: `GET /api/subscription/current`
- **Description**: Fetches the current subscription details for the authenticated user.
- **Returns**: A `Promise` with the subscription object.

#### `createDefaultSubscription`

- **Endpoint**: `POST /api/subscription/`
- **Description**: Creates a default subscription for a new user. It's typically a free or trial plan (in this case, `plan_id: 1`) with a 31-day duration.
- **Returns**: A `Promise` with the newly created subscription object.

### Payments

#### `createPayment`

- **Endpoint**: `POST /api/payments/`
- **Description**: Creates a new payment record in the database. This is used to log a user's payment attempt after they have paid through the external Basalam link.
- **Parameters**: `body: any` (an object representing the payment details)
- **Returns**: A `Promise` with the created payment object.

## Summary

This service file consolidates all the business logic related to the application's monetization model. It provides a clear and organized way to interact with the backend for managing everything from a user's initial free trial to their ongoing usage and payments for premium plans. The use of the global `api` instance from `./config.ts` ensures that all these requests benefit from the automatic authentication and error handling provided by the axios interceptors.
