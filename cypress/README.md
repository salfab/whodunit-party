# Cypress E2E Tests

This directory contains end-to-end tests for the Whodunit Party application.

## Quick Start

**Run all tests (recommended):**
```bash
pnpm cy:run
```

**Open Cypress UI:**
```bash
pnpm cy:open
```

**Run multi-player tests only:**
```bash
pnpm test:e2e:multi-player
```

These commands automatically:
- ✅ Start Supabase if not running
- ✅ Start the Next.js dev server
- ✅ Detect the server port dynamically
- ✅ Run Cypress tests
- ✅ Clean up after completion

## Test Categories

### 1. Mocked Tests (Fast)
- Run without backend dependencies
- Use `cy.mockApi()` to intercept network requests
- Good for UI-only testing
- Tagged with `@mocked`

### 2. Integration Tests (Require Backend)
- Test real API endpoints
- Require local Supabase running
- Tagged with `@integration`

### 3. Multi-Player Tests (Require Backend)
- Test scenarios with multiple players
- Use `cy.session()` to switch between player identities
- Require local Supabase running
- Tagged with `@multi-player`

### 4. Real-Time Tests (Require Backend + Real-Time)
- Test features that depend on Supabase real-time subscriptions
- Require local Supabase with real-time enabled
- Tagged with `@realtime` and `@skip`
- Must be run explicitly: `pnpm cy:run --env tags="@realtime"`
- Skipped by default because they need actual backend presence/subscriptions

## Running Tests

### Automated Setup (Recommended)

The easiest way to run tests is using the built-in scripts that handle all setup:

```bash
# Run all tests (headless)
pnpm cy:run

# Open Cypress UI (interactive)
pnpm cy:open

# Run specific feature
pnpm cy:run --spec "cypress/e2e/gameplay/multi-player-voting.feature"

# Run multi-player tests
pnpm test:e2e:multi-player
```

These scripts automatically:
1. Check if Supabase is running, start it if needed
2. Start the Next.js dev server
3. Detect which port the server is running on (3001, 3002, etc.)
4. Configure Cypress to use that port
5. Run the tests
6. Clean up processes when done

### Manual Setup (Advanced)

If you prefer manual control:

```bash
# Terminal 1: Start Supabase
npx supabase start

# Terminal 2: Start dev server
pnpm dev

# Terminal 3: Run Cypress (will use port from cypress.config.ts)
pnpm cypress:run
# or
pnpm cypress:open
```

### Prerequisites

For integration and multi-player tests:
- **Supabase**: Local instance (auto-started by test scripts)
- **Sample Data**: Mysteries with ≥5 character sheets (run `pnpm seed:mysteries` if needed)
- **Node.js**: v18+ required

The automated test scripts (`pnpm cy:run` or `pnpm cy:open`) handle Supabase startup automatically.

### Run All Tests

Using automated setup (handles everything):
```bash
# Headless
pnpm cy:run

# Interactive UI  
pnpm cy:open
```

Using manual setup:
```bash
# After starting Supabase and dev server manually
pnpm cypress:run
pnpm cypress:open
```

### Run Specific Tags

```bash
# Only mocked tests (fast, no backend needed)
npx cypress run --env tags="@mocked"

# Integration tests (require Supabase)
npx cypress run --env tags="@integration"

# Multi-player tests
npx cypress run --env tags="@multi-player"

# Real-time tests (require Supabase with real-time enabled)
# Note: These are @skip by default, must be run explicitly
pnpm cy:run --env tags="@realtime"

# Skip real-time tests (default behavior)
npx cypress run --env tags="not @skip"

# Mobile tests
npx cypress run --env tags="@mobile"
```

### Run Specific Feature

```bash
# Single feature file
npx cypress run --spec "cypress/e2e/gameplay/multi-player-voting.feature"
```

## Multi-Player Test Architecture

Multi-player tests use Cypress's `cy.session()` command to manage multiple authenticated users in a single test.

### How It Works

1. **Session Caching**: Each player's session is cached by name
2. **Switching Sessions**: Use `cy.switchToPlayer(name)` to switch between players
3. **Independent Contexts**: Each session has its own cookies/storage

### Example

```javascript
// Setup
cy.createRealRoom().then(({ sessionId, joinCode }) => {
  // Join 5 players
  ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'].forEach(name => {
    cy.loginAsPlayer(name, joinCode);
  });
  
  // Switch between players
  cy.switchToPlayer('Alice');
  cy.visit(`/lobby/${sessionId}`);
  // ... Alice's actions ...
  
  cy.switchToPlayer('Bob');
  cy.visit(`/lobby/${sessionId}`);
  // ... Bob's actions ...
});
```

### Custom Commands

See `cypress/support/commands.ts` for all available custom commands:

- `cy.loginAsPlayer(name, joinCode)` - Create/cache player session
- `cy.switchToPlayer(name)` - Switch to cached player session
- `cy.createRealRoom()` - Create a real session via API
- `cy.joinRealRoom(joinCode, playerName)` - Join a session via API

## Test Data

### Fixtures
- `cypress/fixtures/` - Mock data for API responses
- Use `cy.fixture('filename.json')` to load

### Test IDs
- Use `data-testid` attributes in components
- Access with `cy.getByTestId('test-id')`

## Debugging

### View Browser Console
```bash
npx cypress open
# Then click on a test to run in interactive mode
```

### Screenshots & Videos
- Automatic on test failure
- Located in `cypress/screenshots/` and `cypress/videos/`

### Logs
```javascript
cy.log('Custom message'); // Appears in command log
console.log('Debug info'); // Appears in browser console
```

## Troubleshooting

### "Session not found" errors
- Make sure to call `cy.loginAsPlayer()` before `cy.switchToPlayer()`
- Sessions are cached per test - use `cy.session(...).clear()` to reset

### API 401/403 errors
- Verify Supabase is running: `npx supabase status`
- Check that cookies are set correctly
- Verify RLS policies allow test operations

### Tests timing out
- Increase timeout in cypress.config.ts
- Check if Supabase is responsive
- Use `{ timeout: 10000 }` on specific commands

## Writing New Tests

### Feature File (Gherkin)
```gherkin
Feature: My Feature
  
  @mocked
  Scenario: My scenario
    Given some precondition
    When I do something
    Then I should see something
```

### Step Definitions (TypeScript)
```typescript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('some precondition', () => {
  // Setup code
});

When('I do something', () => {
  // Action code
});

Then('I should see something', () => {
  // Assertion code
});
```

## Best Practices

1. **Use mocked tests for UI-only logic** - They're fast and reliable
2. **Use integration tests for API contracts** - Verify backend behavior
3. **Use multi-player tests for coordination** - Test real multiplayer scenarios
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive names** - Make failures easy to understand
6. **Tag appropriately** - Use `@mocked`, `@integration`, `@multi-player` tags
