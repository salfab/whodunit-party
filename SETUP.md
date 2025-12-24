# Whodunit Party - Setup Guide

## Prerequisites

- Node.js 20+ installed
- A Supabase account (free tier works)
- A Vercel account (for deployment)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Copy your project URL and API keys (Settings > API)
3. Copy `.env.local.example` to `.env.local`
4. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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

1. **Admin Creates Game**: `/admin/session/create` → Gets join code
2. **Players Join**: `/join` → Enter code and name → Go to lobby
3. **Lobby**: Players mark themselves ready
4. **Admin Starts**: Selects mystery → Distributes roles
5. **Play**: Players receive character sheets
6. **Investigation**: Players discuss and investigate
7. **Accusation**: Investigator selects guilty party
8. **Results**: Correct/incorrect reveal
9. **Next Round**: Repeat with new mystery

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and keys are correct
- Check that migrations have been applied
- Ensure RLS policies are enabled

### Session/Auth Issues

- Verify JWT_SECRET is at least 32 characters
- Clear cookies and try again
- Check browser console for errors

### Realtime Not Working

- Ensure Supabase Realtime is enabled for your project
- Check that REPLICA IDENTITY is set on tables (migrations handle this)
- Verify table subscriptions in Supabase dashboard

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
