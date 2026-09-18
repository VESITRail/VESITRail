# Contributing to VESITRail

Thanks for your interest in contributing! This project is licensed under the **VESITRail Community License**. Please read it before contributing.

## Contribution & Ownership

**Important Notice for Contributors:**

- You are welcome to **clone, contribute, and submit improvements** to this project.
- By contributing, you retain the right to **claim authorship of your specific contributions** (e.g., "I contributed to feature X", "I fixed bug Y", "I implemented test Z").
- However, you **cannot claim ownership of the entire project** or present it as your own work.
- All contributions become part of the VESITRail project and are subject to the project's license.
- Attribution for your contributions will be recognized in commit history, pull requests, and release notes.

**In summary:** Contribute freely, claim your work, but respect the project's ownership and license.

## Deployment & Usage Restriction

Only **VESIT (Vivekanand Education Society's Institute of Technology)** is permitted to deploy or operate this software. External forks must not deploy public instances without prior written permission.

## Prerequisites

- PostgreSQL database (PostgreSQL 18 recommended)
- Node.js 18+ and pnpm
- Docker (optional, recommended for running local PostgreSQL 18 test database)
- Google OAuth credentials (@ves.ac.in usage preferred)
- Cloudflare R2 & Firebase credentials (if working on related features)

## Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Install dependencies: `pnpm install --frozen-lockfile`
5. Copy env file: `cp .env.example .env`
6. Fill in required environment variables
7. Apply migrations and generate Prisma client: `pnpm exec prisma generate && pnpm exec prisma migrate dev`
8. Start dev server: `pnpm run dev`
9. Run test suites to verify setup: `pnpm test` (or `pnpm run test:unit` if your PostgreSQL test database is not running yet)

## Code Guidelines

- TypeScript strict mode is enforced
- Follow existing file/module patterns under `src/`
- Use server actions in `src/actions` for backend mutations
- Validate user inputs with Zod
- Use Radix UI + shadcn patterns for new components
- Keep components accessible (ARIA attributes, keyboard navigation)
- Avoid adding heavy dependencies without discussion

## Git & Commit Standards

- Use short, descriptive branches: `feature/...`, `fix/...`, `refactor/...`
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`, `test:`
- Reference issues in PR descriptions using `Closes #<issue>`

## Pull Request Checklist

Before opening a PR:

- [ ] Ran `pnpm run typecheck` and verified 0 TypeScript errors
- [ ] Ran `pnpm run lint` and verified 0 ESLint errors/warnings
- [ ] Ran `pnpm run format:check` and all files conform to Prettier
- [ ] Ran `pnpm run test:unit` and all unit tests pass
- [ ] Ran `pnpm run test:integration` and all integration tests pass (if modifying backend/database flows)
- [ ] Ran `pnpm run build` locally without errors
- [ ] Updated or added unit/integration tests for new or modified behavior
- [ ] Updated or added types/schemas if models changed
- [ ] Added migrations if Prisma schema changed (`pnpm exec prisma migrate dev`)
- [ ] Updated user guides (`docs/STUDENT_USER_GUIDE.md` / `docs/ADMIN_USER_GUIDE.md`) if user-facing behavior changed
- [ ] Updated technical docs (`README.md`, `docs/ARCHITECTURE.md`) if architecture or setup changed
- [ ] No unrelated formatting or dependency noise

## Database & Prisma

- Models are modularly organized under `prisma/models/*.prisma` (`admin.prisma`, `student.prisma`, `concession.prisma`, `legacy-student.prisma`, `enums.prisma`) and `prisma/schema.prisma`. Edit the appropriate modular file for your domain.
- Run `pnpm exec prisma migrate dev --name meaningful_name` whenever schema changes are made.
- Do NOT manually edit generated files in `src/generated/` (these are rebuilt via postinstall scripts).

## Security & Privacy

- Never commit secrets (.env is ignored)
- Use environment variables for keys/config
- Report vulnerabilities privately (see `SECURITY.md`)

## Adding UI Components

- Place shared components under `src/components/ui` or appropriate domain folder
- Reuse existing patterns; keep styling via Tailwind utility classes
- Avoid inline styles unless dynamic

## Documentation

- Update `README.md` if your change affects setup or core workflows
- Add comments for non-trivial logic

## Communication

- Use GitHub Issues for bugs & feature proposals
- Be respectful (see `CODE_OF_CONDUCT.md`)

## Out of Scope

Please avoid submitting:

- Complete redesigns without prior discussion
- Vendor lock-in changes (e.g., moving to a different auth provider) without justification

## Getting Help

Open an issue and label it with `question` or `discussion`.

Thank you for contributing to VESITRail.
