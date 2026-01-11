# Whodunit Party - Setup Guide

## Prerequisites

- Node.js 20+ installed
- Docker Desktop installed and running (for local Supabase)
- pnpm, npm, or yarn package manager

## Quick Start (Local Development)

The fastest way to get started is with Supabase local development using Docker:

```bash
# 1. Install dependencies
pnpm install

# 2. Start Supabase locally (requires Docker)
npx supabase start

# 3. Copy local environment config
cp .env.local.example .env.local
# Edit .env.local and use the credentials shown by `supabase start`

# 4. Seed the database with sample mysteries
pnpm seed:mysteries

# 5. Start development server
pnpm dev
```

Visit `http://localhost:3000` to start playing!

---

## Local Development with Supabase (Docker)

### 1. Install Docker Desktop

Download and install Docker Desktop for your operating system:
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **macOS**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

Make sure Docker Desktop is **running** before proceeding.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Supabase Locally

```bash
npx supabase start
```

This will pull the required Docker images (first time only) and start:
- **PostgreSQL** database on port 54422
- **Supabase Studio** (admin UI) on port 54423
- **Auth service** for authentication
- **Realtime service** for live updates
- **Storage service** for file uploads

After startup, you'll see output like:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54421
     GraphQL URL: http://127.0.0.1:54421/graphql/v1
  S3 Storage URL: http://127.0.0.1:54421/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54422/postgres
      Studio URL: http://127.0.0.1:54423
    Inbucket URL: http://127.0.0.1:54424
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: ...
   S3 Secret Key: ...
       S3 Region: local
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with the values from `supabase start` output:

```env
# For LOCAL development with Supabase Docker
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase start>
JWT_SECRET=<JWT secret from supabase start>
```

> **Tip:** You can also run `npx supabase status` anytime to see the credentials again.

### 5. Seed Sample Mysteries

```bash
pnpm seed:mysteries
```

This loads sample mysteries from `seed-data/mysteries/` into your local database.

### 6. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

### Useful Supabase Commands

| Command | Description |
|---------|-------------|
| `npx supabase start` | Start local Supabase services |
| `npx supabase stop` | Stop local Supabase services |
| `npx supabase status` | Show status and credentials |
| `npx supabase db reset` | Reset database and re-run migrations |
| `npx supabase db diff` | Show differences between local and migrations |
| `npx supabase migration new <name>` | Create a new migration file |

### Accessing Supabase Studio

While Supabase is running locally, access the admin UI at:

**http://127.0.0.1:54423**

From here you can:
- Browse and edit database tables
- Run SQL queries
- View realtime subscriptions
- Manage authentication

---

## Cloud Development (Supabase Hosted)

If you prefer to use a hosted Supabase instance instead of Docker:

### 1. Create Supabase Project

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Copy your project credentials from the Supabase Dashboard:
   - **Project URL**: Settings → API → Project URL
   - **Publishable Key**: Settings → API → `anon` `public` key (or `sb_publishable_...`)
   - **Service Secret Key**: Settings → API Keys → `service_role` `secret` key (or `sb_secret_...`)
3. Copy `.env.local.example` to `.env.local`
4. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_or_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_secret_key
   JWT_SECRET=generate_a_random_32_character_string
   ```

### 3. Run Database Migrations

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Or manually run the SQL from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

### 4. Upload Sample Mysteries

1. Start the dev server: `npm run dev`
2. Navigate to `/admin/mysteries/upload`
3. Paste the sample mystery JSON (see below)
4. Click "Upload Mysteries"

### Sample Mystery JSON

```json
[
  {
    "title": "Murder at the Manor",
    "description": "A wealthy aristocrat was found dead in the library. The killer is among the guests.",
    "character_sheets": [
      {
        "role": "investigator",
        "dark_secret": "You secretly gambled away your family fortune and came here to borrow money from the victim.",
        "words_to_place": ["manuscript", "inheritance", "betrayal"],
        "alibi": "I was in the conservatory reading all evening."
      },
      {
        "role": "guilty",
        "dark_secret": "You poisoned the victim's evening whiskey to prevent them from revealing your embezzlement scheme.",
        "words_to_place": ["ledger", "poison", "desperate"],
        "alibi": "I was in my room writing letters to my family."
      },
      {
        "role": "innocent",
        "dark_secret": "You're having a secret affair with the victim's spouse.",
        "words_to_place": ["secret", "rendezvous", "passion"],
        "alibi": "I was walking in the garden, enjoying the moonlight."
      },
      {
        "role": "innocent",
        "dark_secret": "You stole the victim's valuable painting last month and replaced it with a forgery.",
        "words_to_place": ["forgery", "auction", "authenticity"],
        "alibi": "I was in the billiard room playing alone."
      },
      {
        "role": "innocent",
        "dark_secret": "You witnessed the murder but are too afraid to speak up.",
        "words_to_place": ["shadow", "whisper", "fear"],
        "alibi": "I was in bed, sleeping soundly all night."
      }
    ]
  }
]
```

## Running the Application

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Deploying to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `whodunit-party`
4. Add environment variables in Vercel dashboard
5. Deploy!

## Game Flow

1. **Admin Creates Game**: Click "New Game" on home page → Gets join code
2. **Players Join**: `/join` → Enter code and name → Go to lobby
3. **Lobby**: Players mark themselves ready
4. **Admin Starts**: Selects mystery → Distributes roles
5. **Play**: Players receive character sheets
6. **Investigation**: Players discuss and investigate
7. **Accusation**: Investigator selects guilty party
8. **Results**: Correct/incorrect reveal
9. **Next Round**: Repeat with new mystery

## Troubleshooting

### Docker / Supabase Start Issues

**"Docker Desktop is a prerequisite for local development"**
- Make sure Docker Desktop is installed and **running**
- On Windows: Look for the Docker whale icon in the system tray
- Try restarting Docker Desktop
- Run `docker --version` to verify Docker is accessible

**"Cannot connect to Docker daemon"**
- Docker Desktop might not be running - start it from your applications
- On Windows, you may need to run terminal as Administrator
- Check Docker Desktop settings → Resources → WSL Integration is enabled

**"Port already in use"**
- Run `npx supabase stop` then `npx supabase start`
- Check if another service is using ports 54421-54427

**First-time startup is slow**
- Supabase needs to pull Docker images (~2GB) on first run
- This only happens once; subsequent starts are fast

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- For local dev: run `npx supabase status` to see correct credentials
- Check that migrations have been applied (`npx supabase db reset`)
- Ensure RLS policies are enabled

### Session/Auth Issues

- Verify JWT_SECRET is at least 32 characters
- For local dev: use the JWT secret from `npx supabase status`
- Clear cookies and try again
- Check browser console for errors

### Realtime Not Working

- Ensure Supabase Realtime is enabled for your project
- For local: realtime is enabled by default in `supabase/config.toml`
- Check that REPLICA IDENTITY is set on tables (migrations handle this)
- Verify table subscriptions in Supabase dashboard

---

## Project Structure

```
whodunit-party/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── admin/        # Admin pages (create session, upload mysteries)
│   │   ├── api/          # API routes (sessions, join, accusations, etc.)
│   │   ├── join/         # Player join page
│   │   ├── lobby/        # Game lobby with ready consensus
│   │   └── play/         # Character sheet and gameplay
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks (heartbeat)
│   ├── lib/              # Utilities (auth, logging, supabase clients)
│   └── types/            # TypeScript type definitions
├── supabase/
│   ├── migrations/       # Database schema migrations
│   └── config.toml       # Supabase local config
├── public/
│   └── characters/       # Character role images
└── scripts/              # Setup and utility scripts
```
