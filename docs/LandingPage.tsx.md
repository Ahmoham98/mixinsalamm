# LandingPage

The `LandingPage` component serves as the public-facing entry point to the application. It's designed to be visually engaging and informative, explaining the purpose of the application and encouraging users to get started.

## Functionality

- **Navigation**:
  - It uses the `useNavigate` hook from `react-router-dom`.
  - The "شروع" (Start) button in the header, when clicked, navigates the user to the `/home` route, which is the main application dashboard.
- **Animated Header**:
  - The header is fixed to the top of the page.
  - It has a "reveal on scroll up" effect. When the user scrolls down, the header hides. When they scroll up, it reappears. This is managed by tracking the scroll position in a `useEffect` hook.
- **Orbital Animation**:
  - The most prominent visual feature is the orbital animation in the main hero section.
  - This is a pure CSS animation. It uses two keyframes:
    - `orbit`: Rotates a container element (`.orbital-path`) in a circle.
    - `counterRotateContent`: Rotates the images themselves in the opposite direction, so they always remain upright while their container orbits.
  - The positions of the three orbiting images (Mixin logo, Basalam logo, and Mixinsalam logo) are calculated using trigonometry (`sin` and `cos`) to place them at 0, 120, and 240 degrees on a circle.
  - The size of the orbit and the images are responsive, adjusting for different screen sizes using CSS media queries.
- **Informational Sections**:
  - **Hero Section**: Welcomes the user and provides a brief tagline.
  - **Goals Section (`#goals`)**: A detailed list that explains the key benefits of using the application, such as product synchronization, unified management, and reduced errors.
  - **Footer**: Contains an "About Us" section and a "Contact Us" section with contact information.
- **Styling**:
  - The entire page uses the 'Vazirmatn' font for a consistent Persian look and feel.
  - The layout is fully responsive, using Tailwind CSS's breakpoint utilities to adjust the layout from a single column on mobile to a two-column layout on larger screens.
  - All animations and transitions are designed to be smooth, enhancing the user experience.

## Usage

This page is configured in `App.tsx` to be the root route (`/`). It is the first thing a new user sees when they visit the application's URL.

```jsx
// In App.tsx
<Route path="/" element={<LandingPage />} />
```

## How It Works

1. The user visits the root URL of the application.
2. The `LandingPage` component is rendered.
3. The `useEffect` hook for scroll handling is set up, which dynamically adds or removes a class to show/hide the header based on scroll direction.
4. The CSS animations for the orbital effect start playing automatically.
5. The user can scroll down to read about the application's goals or click the "Start" button.
6. Clicking "Start" triggers the `handleStartClick` function, which uses `navigate('/home')` to take the user into the main, authenticated part of the application (which would then likely be protected by a `PrivateRoute`).
7. The "Contact Us" link is a simple anchor link that scrolls the user down to the footer section of the page.
