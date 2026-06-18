# AI Job Matching Platform

An intelligent job discovery and matching platform that scrapes job listings from multiple sources and uses AI to match them with your skills and resume.

## Features

- **Multi-Source Job Scraping**: Automatically scrapes jobs from 8+ sources:
  - Wellfound, Remote OK, Remotive, Indeed, Naukri, LinkedIn, Y Combinator, ZipRecruiter
  - Scheduled scraping every 6 hours
  - Job deduplication and skill-based filtering
  
- **AI-Powered Matching**: Uses local Ollama LLMs for semantic analysis
  - Resume upload and parsing
  - Smart job-to-resume matching with confidence scores
  - Intelligent recommendations for skill gaps
  
- **Modern Full-Stack**:
  - Backend: NestJS + Prisma + PostgreSQL
  - Frontend: Next.js 16 + React 19 + Tailwind CSS
  - Real-time scheduler with NestJS `@nestjs/schedule`

## Quick Start

### Prerequisites

- **Node.js** 18+ (for backend & frontend)
- **pnpm** 10.33+
- **PostgreSQL** 14+ (or use Docker)
- **Ollama** with models: `llama3.2`, `qwen3`, `deepseek-r1`
- **Docker & Docker Compose** (optional, for PostgreSQL & Redis)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-job-os
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` files to actual `.env` files:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

Update `.env` files with your actual URLs if different from defaults:
- **API**: `DATABASE_URL`, `OLLAMA_API_URL`
- **Frontend**: `NEXT_PUBLIC_API_URL`

### 3. Start Services

#### Option A: Using Docker Compose (PostgreSQL + Redis)

```bash
docker-compose up -d
```

#### Option B: Manual Services

If you don't have PostgreSQL/Redis running, install them or update `DATABASE_URL` in `.env`.

### 4. Migrate Database

```bash
cd apps/api
pnpm run db:generate   # Generate Prisma client
pnpm run db:migrate    # Run migrations
pnpm run db:seed       # Seed default job sources (if seed script exists)
```

### 5. Start Ollama

Ensure Ollama is running on `http://localhost:11434`:

```bash
# On macOS:
ollama serve

# On Linux/Windows, refer to: https://ollama.ai
```

Pull required models:
```bash
ollama pull llama3.2
ollama pull qwen3
ollama pull deepseek-r1
```

### 6. Run Backend & Frontend

**Backend** (Terminal 1):
```bash
cd apps/api
pnpm run start:dev
# Runs on http://localhost:5000
```

**Frontend** (Terminal 2):
```bash
cd apps/web
pnpm run dev
# Runs on http://localhost:3000
```

## Project Structure

```
ai-job-os/
├── apps/
│   ├── api/                      # NestJS Backend
│   │   ├── src/
│   │   │   ├── ai/              # AI services (matching, discovery)
│   │   │   ├── scraping/        # Job scrapers & scheduler
│   │   │   ├── jobs/            # Job endpoints
│   │   │   ├── resume/          # Resume upload & parsing
│   │   │   ├── matching/        # Job matching logic
│   │   │   ├── prisma/          # DB service
│   │   │   └── applications/    # Application tracking
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # DB schema
│   │   │   ├── migrations/      # DB migrations
│   │   │   └── seed.ts          # Seed data
│   │   └── package.json
│   │
│   └── web/                      # Next.js Frontend
│       ├── src/
│       │   ├── app/             # Pages & layouts
│       │   ├── components/      # Reusable UI components
│       │   ├── lib/             # API client & utilities
│       │   └── hooks/           # Custom React hooks
│       └── package.json
│
└── docker-compose.yml            # Local PostgreSQL & Redis
```

## Key Commands

### Backend (apps/api)

| Command | Purpose |
|---------|---------|
| `pnpm run start:dev` | Start API in watch mode |
| `pnpm run build` | Build for production |
| `pnpm run lint` | Lint & fix code |
| `pnpm run test` | Run unit tests |
| `pnpm run test:e2e` | Run e2e tests |
| `pnpm run db:migrate` | Run pending migrations |
| `pnpm run db:seed` | Seed database |
| `pnpm run db:generate` | Generate Prisma client |

### Frontend (apps/web)

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Start dev server on :3000 |
| `pnpm run build` | Build for production |
| `pnpm run start` | Run production build |
| `pnpm run lint` | Lint code |

## API Endpoints

### Jobs
- `GET /jobs` - List jobs with filters (q, location, workMode, jobType, experienceLevel)
- `GET /jobs/:slug` - Get job details
- `GET /jobs/sources` - List active scraping sources
- `GET /jobs/skills` - List all skills

### Resume
- `POST /resume/upload` - Upload and parse resume (PDF/DOCX)
- `GET /resume` - List all resumes

### Scraping
- `POST /scraping/scrape-all` - Trigger scraping all sources
- `POST /scraping/scrape/:source` - Scrape specific source
- `GET /scraping/status` - Get scraping status & job counts

### AI / Matching
- `POST /ai/chat` - Chat with AI job assistant
- `POST /ai/test-models` - Test Ollama model availability
- `POST /matching/match` - Match resume to job

### Applications
- `POST /applications` - Create job application
- `GET /applications` - List user applications

## Database Schema

**Key Tables:**
- `Job` - Job listings with title, description, salary, location, skills
- `JobSource` - Scraping sources (Indeed, LinkedIn, etc.)
- `Company` - Company details
- `Resume` - User resumes with parsed content
- `MatchResult` - AI match scores between resume & job
- `Application` - Track job applications
- `Skill` - Skill taxonomy

See [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) for full schema.

## Configuration

### Environment Variables

**Backend (.env)**:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
OLLAMA_API_URL=http://localhost:11434
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

### Docker Compose Services

- **PostgreSQL** (pgvector): Port 5432
- **Redis**: Port 6379

## Troubleshooting

### "Cannot find module '@nestjs/common'"
```bash
cd apps/api && pnpm install
```

### "Ollama connection failed"
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_API_URL` in `.env` matches your setup
- Verify models are pulled: `ollama list`

### "Database connection failed"
- Check PostgreSQL is running (Docker: `docker-compose up -d`)
- Verify `DATABASE_URL` in `.env`
- Run migrations: `pnpm run db:migrate`

### "Port 5000 or 3000 already in use"
Change in:
- Backend: Update `PORT` in `.env` and restart
- Frontend: `pnpm run dev -- -p 3001`

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Run `pnpm run lint` before committing

### Testing
```bash
cd apps/api
pnpm run test          # Unit tests
pnpm run test:cov      # With coverage
pnpm run test:e2e      # E2E tests
```

### Database Migrations
```bash
# Create new migration after schema changes
cd apps/api
pnpm run db:migrate -- --name feature_name

# Review migration in prisma/migrations/
# Deploy to DB
pnpm run db:deploy
```

## Production Deployment

### Build
```bash
pnpm run build
```

### Environment Setup
Ensure all env vars are set in production:
```bash
export DATABASE_URL="postgresql://..."
export OLLAMA_API_URL="http://prod-ollama:11434"
export NEXT_PUBLIC_API_URL="https://api.example.com"
```

### Run
```bash
# Backend
cd apps/api && pnpm run start:prod

# Frontend
cd apps/web && pnpm run start
```

### Docker Deployment
Use provided `docker-compose.yml` as base. Add:
- API & web service definitions
- Nginx reverse proxy
- SSL certificates (Let's Encrypt)

## Known Limitations & Next Steps

- **Auth/Security**: No authentication yet — implement JWT/OAuth
- **Scraper Fragility**: HTML parsing breaks on site updates — add fallbacks
- **CORS/Rate-Limiting**: Not implemented — add before production
- **Error Handling**: Basic logging — add Sentry/metrics
- **Resume Parsing**: Currently basic text extraction — improve with ML models
- **Job Matching UI**: Partial implementation — complete match results display

## Contributing

1. Create a feature branch: `git checkout -b feature/name`
2. Commit with conventional messages: `feat:`, `fix:`, `docs:`
3. Submit PR with test coverage

## License

ISC

## Support

For issues, refer to:
- Prisma Docs: https://www.prisma.io/docs/
- NestJS Docs: https://docs.nestjs.com/
- Next.js Docs: https://nextjs.org/docs
- Ollama Docs: https://ollama.ai/
