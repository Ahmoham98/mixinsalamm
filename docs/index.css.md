# Global CSS Stylesheet

This file (`src/index.css`) is the main stylesheet for the application. It includes the base styles for Tailwind CSS, as well as custom global styles, animations, and utility classes.

## Key Sections

### Tailwind CSS Directives
- **`@tailwind base;`**: This directive injects Tailwind's base styles and any base styles registered by plugins. This includes things like a CSS reset to normalize styles across browsers.
- **`@tailwind components;`**: This directive injects Tailwind's component classes and any component classes registered by plugins.
- **`@tailwind utilities;`**: This directive injects Tailwind's utility classes and any utility classes registered by plugins.

These three directives are essential for Tailwind CSS to work correctly.

### Custom Scrollbar Styles
- **`.custom-scrollbar`**: This class can be applied to any element to give it a custom-styled scrollbar.
  - `::-webkit-scrollbar`: Targets the scrollbar itself.
  - `::-webkit-scrollbar-track`: Targets the track of the scrollbar.
  - `::-webkit-scrollbar-thumb`: Targets the handle of the scrollbar.
  - `::-webkit-scrollbar-thumb:hover`: Targets the handle of the scrollbar when it's being hovered over.
- Note: These scrollbar styles are specific to WebKit-based browsers like Chrome, Safari, and Edge.

### Global Styles
- **`body`**: Sets the default font family to `'Vazirmatn', sans-serif` and the default text color.
- **`h1, h2, h3, h4, h5, h6`**: Sets the default color for all heading elements.
- **`p`**: Sets the default color for paragraph elements.

### Gradient Text Animation
- **`@keyframes gradient`**: Defines a CSS animation called `gradient` that animates the `background-position` of an element. This is used to create a moving gradient effect.
- **`.animate-gradient`**: A utility class that applies the `gradient` animation. It also sets the `background-size` to `200% 200%`, which is necessary for the gradient animation to work correctly.

### Card Hover Effects
- **`.card-hover`**: A utility class that adds a smooth transition to an element.
- **`.card-hover:hover`**: Applies a slight upward transform and a box shadow when the element is hovered over, creating a "lift" effect.

### Button Styles
- **`.btn-primary`**: A custom component class for a primary button. It uses Tailwind's `@apply` directive to compose several utility classes into a single class. This creates a button with a gradient background, white text, and a hover effect.
- **`.btn-secondary`**: A custom component class for a secondary button. It also uses `@apply` to create a button with a white background, blue text, and a blue border.

### Loading Animation
- **`@keyframes pulse`**: Defines a CSS animation called `pulse` that animates the `opacity` of an element, creating a pulsing effect.
- **`.animate-pulse`**: A utility class that applies the `pulse` animation. Note that Tailwind CSS also has its own `animate-pulse` class, so this might be an override or a custom version.

### Text Utilities
- **`.text-primary`, `.text-secondary`, `.text-muted`, `.text-light`**: These are custom utility classes for setting specific text colors that are likely part of the project's design system.

## How It Works

This CSS file is imported into the main entry point of the application (`src/main.tsx`), which makes these styles available globally. The build tool (Vite) processes this file, and because it's configured with PostCSS and Tailwind CSS, it will:
1. Process the `@tailwind` directives to generate the necessary Tailwind CSS.
2. Apply any other PostCSS plugins (like Autoprefixer).
3. Bundle the final CSS into a single file that is included in the production build.

This file is a good example of how to combine the power of a utility-first framework like Tailwind CSS with custom global styles and components to create a consistent and maintainable design system.
