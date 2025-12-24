# Whodunit Party 🔍

A real-time multiplayer murder mystery party game built with Next.js, Supabase, and TypeScript.

## Features

- **Real-time Multiplayer**: Players join game rooms and interact in real-time
- **Role-Based Gameplay**: Investigator, guilty party, and innocent characters
- **Secret Character Sheets**: Each player receives unique markdown-formatted character info
- **Consensus System**: Players must all be ready to proceed
- **Dramatic Accusation**: Investigator makes accusations with animated reveals
- **Heartbeat System**: Automatic detection of disconnected players
- **Mystery Management**: Upload and manage multiple mysteries via JSON
- **Responsive UI**: Built with Material-UI and Framer Motion animations

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run migrations**
   ```bash
   npx supabase db push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Upload mysteries** at `/admin/mysteries/upload`

6. **Create a game** at `/admin/session/create`

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
5. Roles are randomly distributed (investigator + guilty always assigned)
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
│   │   ├── admin/        # Admin dashboard and mystery upload
│   │   ├── api/          # API routes (sessions, join, accusations)
│   │   ├── join/         # Player join flow
│   │   ├── lobby/        # Game lobby with ready system
│   │   └── play/         # Character sheets and gameplay
│   ├── hooks/            # Custom hooks (heartbeat)
│   ├── lib/              # Utilities (auth, logging, supabase)
│   └── types/            # TypeScript definitions
├── supabase/
│   └── migrations/       # Database schema
└── public/
    └── characters/       # Role placeholder images
```

## Key Features

### Real-time Multiplayer
- Supabase Realtime channels for live updates
- Player status synchronization
- Automatic disconnect detection via heartbeat

### Role Distribution
- Minimum 5 players required
- Investigator and guilty always assigned
- Innocent roles distributed to remaining players
- Randomized assignment each round

### Character Sheets
- Markdown-formatted secrets and alibis
- Three words to place in conversation
- Toggle visibility for secrets
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
4. Add environment variables
5. Deploy

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT
