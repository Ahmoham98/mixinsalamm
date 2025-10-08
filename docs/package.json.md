# package.json File

This file (`package.json`) is a fundamental part of any Node.js project, including this Vite-based React application. It serves as a manifest for the project, containing metadata and defining its properties, scripts, and dependencies.

## Key Sections

- **`name`**: The name of the project, `mixin-basalam-sync`.
- **`private`**: When set to `true`, it prevents the project from being accidentally published to a package registry like npm.
- **`version`**: The current version of the project, `1.0.0`.
- **`type`**: Set to `module`, which indicates that the project uses ES modules for its JavaScript files.
- **`scripts`**: A dictionary of command-line scripts that can be run using `npm run <script-name>`.
  - **`dev`**: Starts the development server using Vite.
  - **`build`**: Compiles the TypeScript code (`tsc`) and then builds the project for production using Vite (`vite build`).
  - **`lint`**: Runs the ESLint linter to check for code quality and style issues.
  - **`preview`**: Starts a local server to preview the production build.
  - **`start`**: An alias for `preview`, but with the `--host` flag to make it accessible on the local network.
  - **`deploy`**: A custom script that first builds the project and then previews it.
- **`dependencies`**: A list of packages that are required for the application to run in a production environment.
  - **`@tanstack/react-query`**: A data-fetching and state management library for React.
  - **`axios`**: A promise-based HTTP client for making requests to APIs.
  - **`lucide-react`**: A library of simply designed icons for React.
  - **`react`**: The core React library.
  - **`react-dom`**: The package that provides DOM-specific methods for React.
  - **`react-router-dom`**: A library for routing in React applications.
  - **`zustand`**: A small, fast, and scalable state management solution for React.
- **`devDependencies`**: A list of packages that are only needed for local development and testing.
  - **`@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`**: Packages related to ESLint for code linting.
  - **`@types/react`, `@types/react-dom`**: TypeScript type definitions for React and React DOM.
  - **`@vitejs/plugin-react`**: The official Vite plugin for React.
  - **`autoprefixer`, `postcss`, `tailwindcss`**: Tools for CSS post-processing and the Tailwind CSS framework.
  - **`typescript`**: The TypeScript compiler.
  - **`vite`**: The build tool and development server.
- **`engines`**: Specifies the version of Node.js that the project is compatible with (version 18.0.0 or greater).
- **`browserslist`**: A configuration to share target browsers between different front-end tools. It's used by tools like Autoprefixer to add vendor prefixes to CSS rules.

## How It Works

This file is used by the `npm` (Node Package Manager) or `yarn` command-line tools. When you run `npm install`, it reads the `dependencies` and `devDependencies` sections and downloads the specified packages into the `node_modules` directory. The `scripts` section allows you to define and run common tasks for your project in a consistent way. The other fields provide important metadata about the project.
