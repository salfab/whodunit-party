# Whodunit Party 🔍

A real-time multiplayer murder mystery party game built with Next.js, Supabase, and TypeScript.

## Features

- **Real-time Multiplayer**: Players join game rooms and interact in real-time
- **Role-Based Gameplay**: Investigator and suspects, with the culprit chosen per round
- **Secret Character Sheets**: Each player receives unique markdown-formatted character info
- **Consensus System**: Players must all be ready to proceed
- **Dramatic Accusation**: Investigator makes accusations with animated reveals
- **Heartbeat System**: Automatic detection of disconnected players
- **Mystery Management**: Create, edit, delete, and upload mysteries via admin console
- **JSON Schema Validation**: Mysteries validated against strict schema
- **Base64 Support**: Upload base64-encoded mystery data
- **Responsive UI**: Built with Material-UI and Framer Motion animations

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start Supabase locally** (requires Docker)
   ```bash
   npx supabase start
   ```

3. **Set up environment**
   ```bash
   cp .env.local.example .env.local
   # The example file has local development defaults that work out of the box
   ```

4. **Seed sample mysteries**
   ```bash
   pnpm seed:mysteries
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Manage mysteries**
   - Browse mysteries at `/admin/mysteries`
   - Create new mystery at `/admin/mysteries/new/edit`
   - Upload JSON mysteries at `/admin/mysteries/upload`

7. **Create a game** by clicking "New Game" on the home page

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Technology Stack

- **Frontend**: Next.js 16 with React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **Styling**: MUI 7 with Emotion
- **Animations**: Framer Motion
- **Markdown**: react-markdown with remark-gfm
- **Auth**: Custom JWT sessions with jose

## Game Flow

1. Admin creates game session → receives join code
2. Players join via join code → enter lobby
3. Players mark themselves ready
4. Admin selects mystery and starts game
5. Character sheets are randomly distributed (one investigator + suspects)
6. Players receive secret character sheets
7. Investigation phase (free-form discussion)
8. Investigator makes accusation
9. Results revealed with animations
10. Option to continue with next mystery

## Project Structure

```
whodunit-party/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── admin/        # Admin dashboard and mystery management
│   │   ├── api/          # API routes (sessions, join, accusations, mysteries)
│   │   ├── join/         # Player join flow
│   │   ├── lobby/        # Game lobby with ready system
│   │   └── play/         # Character sheets and gameplay
│   ├── hooks/            # Custom hooks (heartbeat)
│   ├── lib/              # Utilities (auth, logging, supabase)
│   └── types/            # TypeScript definitions
├── schemas/
│   └── mystery.schema.json  # JSON schema for mystery validation
├── supabase/
│   └── migrations/       # Database schema
└── public/
    └── characters/       # Role placeholder images
```

## Mystery Management

### Admin Console

Access the mysteries admin console at `/admin/mysteries` to:
- View all mysteries in a table
- Create new mysteries with the form editor
- Edit existing mysteries
- Delete mysteries
- Upload mysteries via JSON

### Mystery JSON Schema

Mysteries must conform to the schema defined in [`schemas/mystery.schema.json`](schemas/mystery.schema.json).

**Required fields:**
- `title` (string, 1-200 chars)
- `description` (string, min 10 chars, supports markdown)
- `innocent_words` (array of exactly 3 strings)
- `guilty_words` (array of exactly 3 strings)
- `character_sheets` (array, min 2 items, must include exactly one investigator and at least one suspect)

**Character sheet fields:**
- `role`: "investigator" | "suspect"
- `dark_secret` (string, min 10 chars)
- `alibi` (string, min 10 chars)
- `image_path` (optional string)

New packs never define the culprit. Every suspect sheet must contain a
`dark_secret` that can work as a confession if that suspect is chosen at runtime.
Legacy uploads using `guilty` or `innocent` are accepted as import aliases and
normalized to `suspect`.

### Uploading Mysteries

**Via Form Editor**: `/admin/mysteries/new/edit`
- Fill out the form with mystery details
- Add character sheets dynamically
- Validate on save

**Via JSON Upload**: `/admin/mysteries/upload`
- Paste JSON array of mysteries
- Optional: Check "Base64 encoded" box for base64 input
- Schema validation runs automatically
- Detailed error messages for validation failures

**Example Mystery JSON**:
```json
[
  {
    "title": "Murder at the Manor",
    "description": "## The Crime\\n\\nLord Blackwood was found dead...",
    "language": "en",
    "author": "Example",
    "theme": "SERIOUS_MURDER",
    "innocent_words": ["manuscript", "inheritance", "betrayal"],
    "guilty_words": ["ledger", "poison", "desperate"],
    "character_sheets": [
      {
        "role": "investigator",
        "dark_secret": "You secretly gambled away your family fortune.",
        "alibi": "I was in the conservatory reading all evening."
      },
      {
        "role": "suspect",
        "dark_secret": "I confess everything: I poisoned the victim to prevent exposure.",
        "alibi": "I was in my room writing letters."
      },
      {
        "role": "suspect",
        "dark_secret": "I confess everything: my affair with the victim's spouse gave me a motive, and I used the confusion to act.",
        "alibi": "I was walking in the garden."
      }
    ]
  }
]
```

## Key Features

### Real-time Multiplayer
- Supabase Realtime channels for live updates
- Player status synchronization
- Automatic disconnect detection via heartbeat

### Role Distribution
- Minimum 2 players required
- One investigator sheet is assigned each round
- Suspect sheets are distributed to remaining players
- The guilty player is chosen deterministically by the server for that round

### Character Sheets
- Markdown-formatted secrets and alibis
- Three words to place in conversation
- Optional inspiration text for alibis
- Role-specific placeholder images

### Accusation System
- Investigator-only accusation privilege
- Player selection modal
- Blood drip animation for accused
- Immediate result reveal

## Development

```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build
npm start
```

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `whodunit-party`
4. Add environment variables (see below)
5. Deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Project URL (from Dashboard → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase `service_role` secret key (server-side only) |
| `JWT_SECRET` | ✅ | Secret key for signing player session JWTs |

### JWT_SECRET

Used to sign and verify player session tokens. Without this, players cannot join games.

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:** `pFcxARPGuJXn9kZhwtr+qEw714KGF5yS/QPd9odbBDI=`

Add to:
- **Local development:** `.env.local` file
- **Vercel:** Project Settings → Environment Variables (all environments)

⚠️ **Never commit secrets to git.** The `.env.local` file is gitignored.

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT
