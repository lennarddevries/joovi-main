# Joovi E2E Tests

End-to-end tests for the Joovi application using Playwright.

## Overview

This test suite runs Playwright E2E tests against Docker containerized versions of the web and server applications. Tests can run in two modes:

- **Dev Mode**: Tests against locally built Docker images using `development` target
- **Production Mode**: Tests against locally built Docker images using `production` target

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- [Task](https://taskfile.dev) (optional, for using Taskfile commands)
- Access to GitHub Container Registry images

## Installation

```bash
npm install
npx playwright install --with-deps
```

## Running Tests

### Using Task (Recommended)

```bash
# Run tests against dev environment
task test:dev

# Run tests against production environment
task test:prd

# Run tests with UI
task test:ui

# Run tests in headed mode
task test:headed

# Run tests in debug mode
task test:debug

# View test report
task test:report
```

### Using npm

```bash
# Start dev environment
npm run docker:up:dev

# Run tests against dev
npm run test:dev

# Stop dev environment
npm run docker:down:dev

# Start production environment
npm run docker:up:prd

# Run tests against production
npm run test:prd

# Stop production environment
npm run docker:down:prd
```

## Docker Environment Management

### Dev Environment

```bash
# Start dev services (builds development images)
task docker:up:dev

# Stop dev services
task docker:down:dev

# View dev logs
task docker:logs:dev
```

### Production Environment

```bash
# Start production services (builds production images)
task docker:up:prd

# Stop production services
task docker:down:prd

# View production logs
task docker:logs:prd
```

### Clean Up

```bash
# Remove all docker resources
task docker:clean
```

## Test Structure

```
e2e/
├── tests/                  # Test files
│   └── example.spec.ts    # Example test suite
├── playwright.config.ts    # Playwright configuration
├── package.json           # Dependencies and scripts
└── Taskfile.yml           # Task automation

compose/                    # Docker compose files (in root)
├── docker-compose.dev.yml      # Local development environment
├── docker-compose.e2e-dev.yml  # E2E dev environment config
└── docker-compose.e2e-prd.yml  # E2E production environment config
```

## Writing Tests

Tests are written using Playwright's test framework:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/expected title/i);
  });
});
```

## CI/CD Integration

The E2E tests run automatically on GitHub Actions:

- **On push/merge to `dev`**: Runs `e2e-dev` job against `:dev` images
- **On push/merge to `main`**: Runs `e2e-prd` job against `:latest` images

See `.github/workflows/e2e.yml` for the complete workflow configuration.

## Configuration

### Environment Variables

- `TEST_ENV`: Set to `dev` or `prd` to specify which environment to test against
- `CI`: Automatically set in GitHub Actions to enable CI-specific behaviors

### Playwright Config

The `playwright.config.ts` file contains:
- Browser configurations (Chromium, Firefox, WebKit)
- Test parallelization settings
- Reporter configuration
- Base URL settings

### Docker Compose

- `compose/docker-compose.e2e-dev.yml` - E2E tests with development build target
- `compose/docker-compose.e2e-prd.yml` - E2E tests with production build target
- `compose/docker-compose.dev.yml` - Local development with live volumes

All compose files define:
- Web service on port 4321
- Server service on port 8000
- Health checks for both services
- Shared network for service communication

## Debugging

```bash
# Run with Playwright Inspector
task test:debug

# Run with UI mode
task test:ui

# Run in headed mode (see browser)
task test:headed

# View test report after run
task test:report
```

## Code Quality

```bash
# Format code
task format

# Check formatting
task format:check

# Lint code
task lint

# Fix linting issues
task lint:fix
```

## Troubleshooting

### Services not starting

Check Docker logs:
```bash
task docker:logs:dev
# or
task docker:logs:prd
```

### Tests timing out

Increase wait times in the workflow or check if services are actually healthy:
```bash
docker compose -f docker-compose.dev.yml ps
curl http://localhost:4321
curl http://localhost:8000/health
```
