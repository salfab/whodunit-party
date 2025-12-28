# Deployment Instructions

## Environment Setup

Before deploying, ensure you have the following secrets configured in your deployment platform:

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

### For GitHub Actions Deployment

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN` - Your Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `PRODUCTION_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

## Deployment Process

The deployment pipeline automatically:

1. ✅ Installs dependencies
2. ✅ Builds the Next.js application
3. ✅ Deploys to Vercel (or your hosting platform)
4. ✅ Waits for deployment to be live
5. ✅ Seeds mysteries from `seed-data/mysteries/`

## Manual Deployment

### Deploy without seeding

```bash
pnpm build
# Deploy using your platform's CLI
```

### Deploy with mystery seeding

```bash
# 1. Deploy your application
pnpm build
# ... deploy to your platform ...

# 2. Wait for deployment to be live

# 3. Seed mysteries
API_URL=https://your-production-url.com pnpm seed:mysteries
```

## Local Testing

Test the deployment process locally:

```bash
# 1. Start your local server
pnpm dev

# 2. In another terminal, seed mysteries
pnpm seed:mysteries
# or with custom URL
API_URL=http://localhost:3000 pnpm seed:mysteries
```

## Mystery Pack Management

### Adding New Mysteries

1. Add mystery ZIP files to `seed-data/mysteries/`
2. Ensure each mystery.json includes a `version` field
3. Commit and push to trigger deployment
4. New mysteries will be automatically seeded

### Updating Mysteries

1. Increment the `version` in mystery.json (e.g., `1.0.0` → `1.1.0`)
2. Re-export the mystery pack
3. Replace the old ZIP in `seed-data/mysteries/`
4. Deploy - the system will automatically upgrade to the newer version

### Version Guidelines

- **1.0.0 → 2.0.0**: Major changes (plot, characters)
- **1.0.0 → 1.1.0**: Minor updates (new content, improvements)
- **1.0.0 → 1.0.1**: Patches (typos, small fixes)

## Troubleshooting

### Mystery seeding fails

Check the logs for specific error messages:

```bash
# Local debugging
API_URL=http://localhost:3000 pnpm seed:mysteries
```

Common issues:
- Missing version field → Skipped (safe default)
- Invalid JSON in mystery.json → Upload fails
- Missing images referenced in JSON → Images skipped, mystery still uploaded
- API not accessible → Check URL and network

### Re-running seed script

The seeding script is idempotent and safe to run multiple times:
- Existing mysteries (same version) are skipped
- Newer versions replace older ones
- No duplicates are created

## CI/CD Integration

### GitHub Actions (included)

The `.github/workflows/deploy.yml` file handles automatic deployment on push to `main`.

### Other Platforms

Adapt the deployment process for your platform:

**Vercel** (via CLI):
```bash
vercel --prod
API_URL=$(vercel inspect --wait) pnpm seed:mysteries
```

**Netlify**:
```bash
netlify deploy --prod
API_URL=$(netlify status | grep "Site URL") pnpm seed:mysteries
```

**Docker**:
```dockerfile
# In your Dockerfile
COPY seed-data ./seed-data
RUN npm run seed:mysteries || true
```

## Production Checklist

Before deploying to production:

- [ ] All mysteries have version numbers
- [ ] Mystery JSON validates against schema
- [ ] Images are properly referenced
- [ ] Environment variables are set
- [ ] Supabase migrations are applied
- [ ] Test seeding script locally
- [ ] Review deployed mysteries in admin panel
