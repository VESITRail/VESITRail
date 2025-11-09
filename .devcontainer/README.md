# VESITRail DevContainer Setup

This project includes a DevContainer configuration for consistent development environments.

## Prerequisites

- Docker Desktop or Docker Engine
- Visual Studio Code with Dev Containers extension

## Getting Started

1. Open the project in VS Code
2. Click "Reopen in Container" when prompted, or use Command Palette: `Dev Containers: Reopen in Container`
3. Wait for the container to build and dependencies to install
4. Copy environment variables:
   ```bash
   cp .devcontainer/.env.devcontainer .env
   ```
5. Update `.env` with your configuration values
6. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

## Services

- **Next.js Application**: http://localhost:3000
- **PostgreSQL Database**: localhost:5432
  - Database: `vesitrail`
  - Username: `vesitrail`
  - Password: `vesitrail`

## Included Extensions

- Prisma
- Playwright Test
- Code Spell Checker
- Prettier Code Formatter
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

## Database Management

Access the database using `psql`:

```bash
psql postgresql://vesitrail:vesitrail@localhost:5432/vesitrail
```

## Environment Variables

The devcontainer uses a pre-configured database connection. For other services (Firebase, Cloudinary, etc.), update the `.env` file with your credentials.
