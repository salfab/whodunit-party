# Running E2E Tests

## Quick Commands

```bash
# Run all tests (auto-setup everything)
pnpm cy:run

# Open Cypress UI (auto-setup everything)
pnpm cy:open

# Run multi-player tests only
pnpm test:e2e:multi-player

# Run specific test file
pnpm cy:run --spec "cypress/e2e/gameplay/multi-player-voting.feature"
```

## What the Scripts Do

When you run `pnpm cy:run` or `pnpm cy:open`, the test runner automatically:

1. ✅ **Checks Supabase** - Starts local Supabase if not running
2. ✅ **Starts Dev Server** - Launches Next.js on an available port
3. ✅ **Detects Port** - Finds which port the server started on (3001, 3002, etc.)
4. ✅ **Configures Cypress** - Sets the base URL to match the detected port
5. ✅ **Runs Tests** - Executes your test suite
6. ✅ **Cleans Up** - Stops the dev server when done

## Manual Setup (Optional)

If you prefer to control each step:

```bash
# Terminal 1: Start Supabase
npx supabase start

# Terminal 2: Start dev server
pnpm dev

# Terminal 3: Run tests
CYPRESS_BASE_URL=http://localhost:3002 pnpm cypress:run
```

## Troubleshooting

**"Supabase failed to start"**
- Run `npx supabase stop` then `npx supabase start`
- Check Docker is running

**"Server timeout"**
- Increase timeout in `scripts/run-e2e-tests.mjs` (default: 60s)
- Check for port conflicts

**"Tests fail with 404"**
- Verify dev server started successfully
- Check the detected port matches your server

**"Can't detect port"**
- Dev server output format may have changed
- Check Next.js version compatibility

## Test Files

- `cypress/e2e/gameplay/multi-player-voting.feature` - Multi-player voting tests
- `cypress/e2e/gameplay/accusation.feature` - Accusation flow tests
- `cypress/e2e/gameplay/character-sheet.feature` - Character sheet tests
- More tests in `cypress/e2e/`

## More Info

See `cypress/README.md` for detailed documentation on:
- Writing new tests
- Test categories (@mocked, @integration, @multi-player)
- Custom commands
- Debugging tips
