# UA Volunteering Platform - Frontend

React + TypeScript frontend for the UA Volunteering Platform.

## Tech Stack

- **Build Tool:** Vite 7
- **Framework:** React 19 + TypeScript
- **Package Manager:** pnpm
- **Routing:** TanStack Router
- **Data Fetching:** TanStack Query
- **Styling:** Tailwind CSS 4 + tailwind-merge
- **Testing:** Vitest + React Testing Library
- **Linting/Formatting:** Biome

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Testing

### Run Tests

```bash
# Watch mode
pnpm test

# Single run
pnpm test:run

# With coverage
pnpm test:coverage
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Card, Input, etc.)
│   └── layout/          # Layout components (Header, Footer, Sidebar)
├── features/            # Feature-based modules
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (cn, api client)
├── routes/              # TanStack Router routes
├── styles/              # Global styles and theme
├── test/                # Test utilities and setup
├── types/               # TypeScript types
└── main.tsx             # Entry point
```

## Theme

The app uses a custom theme with UA brand colors:

- **Primary:** Blue (#1E40AF) - UA institutional
- **Secondary:** Green (#059669) - Volunteering/growth
- **Accent:** Orange (#EA580C) - Energy/action

See `src/styles/globals.css` for the complete theme configuration.

## Docker

### Development

```bash
docker compose up frontend
```

### Production Build

```bash
docker build -t ua-volunteering-frontend .
docker run -p 80:80 ua-volunteering-frontend
```

## Scripts

| Command              | Description                    |
|---------------------|--------------------------------|
| `pnpm dev`          | Start development server       |
| `pnpm build`        | Build for production           |
| `pnpm preview`      | Preview production build       |
| `pnpm lint`         | Run Biome linter               |
| `pnpm format`       | Format code with Biome         |
| `pnpm check`        | Run Biome lint + format check  |
| `pnpm check:fix`    | Fix lint + format issues       |
| `pnpm test`         | Run tests in watch mode        |
| `pnpm test:run`     | Run tests once                 |
| `pnpm test:coverage`| Run tests with coverage        |
