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

- PostgreSQL database
- Node.js 18+ and pnpm
- Google OAuth credentials (@ves.ac.in usage preferred)
- Cloudinary & Firebase credentials (if working on related features)

## Development Setup

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Install dependencies: `pnpm install --frozen-lockfile`
5. Copy env file: `cp .env.example .env`
6. Fill in required environment variables
7. Generate Prisma client: `pnpm exec prisma generate`
8. Start dev server: `pnpm run dev`

## Code Guidelines

- TypeScript strict mode is enforced
- Follow existing file/module patterns under `src/`
- Use server actions in `src/actions` for backend mutations
- Validate user inputs with Zod
- Use Radix UI + shadcn patterns for new components
- Keep components accessible (ARIA attributes, keyboard navigation)
- Avoid adding heavy dependencies without discussion

## Testing

VESITRail uses **Playwright** for end-to-end testing. We strongly encourage adding E2E tests for new features.

### Running Tests

```bash
# Install Playwright browsers (first time only)
pnpm run test:e2e:install

# Run all E2E tests
pnpm run test:e2e

# Run tests in UI mode (interactive debugging)
pnpm exec playwright test --ui

# Run tests in headed mode (see browser actions)
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/login.spec.ts
```

### Writing Tests

- Place test files in the `tests/` directory with `.spec.ts` extension
- Follow the naming convention: `feature-name.spec.ts`
- Tests run on Chromium, Firefox, and WebKit browsers
- Use descriptive test names that explain what is being tested

**Example test structure:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
	test("should perform expected behavior", async ({ page }) => {
		await page.goto("/");
		// Your test logic here
	});
});
```

### Test Guidelines

- Write tests for critical user flows (login, applications, approvals)
- Keep tests independent - each test should work in isolation
- Use proper selectors (prefer `data-testid` attributes)
- Clean up test data when necessary
- Ensure tests pass locally before pushing

## Git & Commit Standards

- Use short, descriptive branches: `feature/...`, `fix/...`, `refactor/...`
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`, `test:`
- Reference issues in PR descriptions using `Closes: #<issue>`

## Pull Request Checklist

Before opening a PR:

- [ ] Ran `pnpm run build` locally without errors
- [ ] Ran `pnpm run test:e2e` and all tests pass
- [ ] Added E2E tests for new features or critical paths
- [ ] Updated or added types/schemas if models changed
- [ ] Added migrations if Prisma schema changed
- [ ] Updated docs (`README.md` or relevant .md files) if behavior changed
- [ ] No unrelated formatting or dependency noise

## Database & Prisma

- Edit models in `prisma/schema.prisma` only
- Run `pnpm exec prisma migrate dev --name meaningful_name` (if schema changes)
- Do NOT manually edit generated files in `src/generated/`

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
