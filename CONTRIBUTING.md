# Contributing to VESITRail

Thanks for your interest in contributing! This project is licensed under the **VESITRail Community License**. Please read it before contributing.

## ⚠️ Deployment & Usage Restriction

Only **VESIT (Vivekanand Education Society's Institute of Technology)** is permitted to deploy or operate this software. External forks must not deploy public instances without prior written permission.

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Google OAuth credentials (@ves.ac.in usage preferred)
- Cloudinary & Firebase credentials (if working on related features)

## 🛠️ Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Copy env file: `cp .env.example .env`
6. Fill in required environment variables
7. Generate Prisma client: `npx prisma generate`
8. Start dev server: `npm run dev`

## 🧪 Code Guidelines

- TypeScript strict mode is enforced
- Follow existing file/module patterns under `src/`
- Use server actions in `src/actions` for backend mutations
- Validate user inputs with Zod
- Use Radix UI + shadcn patterns for new components
- Keep components accessible (ARIA attributes, keyboard navigation)
- Avoid adding heavy dependencies without discussion

## 🔄 Git & Commit Standards

- Use short, descriptive branches: `feature/...`, `fix/...`, `refactor/...`
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`, `test:`
- Reference issues in PR descriptions using `Closes: #<issue>`

## ✅ Pull Request Checklist

Before opening a PR:

- [ ] Ran `npm run build` locally without errors
- [ ] Updated or added types/schemas if models changed
- [ ] Added migrations if Prisma schema changed
- [ ] Updated docs (`README.md` or relevant .md files) if behavior changed
- [ ] Added tests (if/when test setup exists)
- [ ] No unrelated formatting or dependency noise

## 🗃 Database & Prisma

- Edit models in `prisma/schema.prisma` only
- Run `npx prisma migrate dev --name meaningful_name` (if schema changes)
- Do NOT manually edit generated files in `src/generated/`

## 🔐 Security & Privacy

- Never commit secrets (.env is ignored)
- Use environment variables for keys/config
- Report vulnerabilities privately (see `SECURITY.md`)

## 🧩 Adding UI Components

- Place shared components under `src/components/ui` or appropriate domain folder
- Reuse existing patterns; keep styling via Tailwind utility classes
- Avoid inline styles unless dynamic

## 📄 Documentation

- Update `README.md` if your change affects setup or core workflows
- Add comments for non-trivial logic

## 🤝 Communication

- Use GitHub Issues for bugs & feature proposals
- Be respectful (see `CODE_OF_CONDUCT.md`)

## 🛑 Out of Scope

Please avoid submitting:

- Complete redesigns without prior discussion
- vendor lock-in changes (e.g., moving to a different auth provider) without justification

## 🏁 Getting Help

Open an issue and label it with `question` or `discussion`.

Thanks again for contributing to VESITRail! 🚆
