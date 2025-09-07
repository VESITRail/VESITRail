# Security Policy

## Supported Versions

Active development occurs on the `main` branch. Only the latest commit on `main` receives security updates.

**Note:** The project is currently in active development (version `1.0.0`) and not yet production-ready. Security practices are applied, but features may evolve significantly before stable release.

## Reporting a Vulnerability

If you discover a security vulnerability, please DO NOT open a public issue.

Instead, report it privately via email at: vesit.railwayconcession@ves.ac.in

When reporting, please include:

- Description of the vulnerability
- Steps to reproduce / proof of concept
- Potential impact
- Suggested remediation (if any)

You will receive an acknowledgment within 72 hours. We'll aim to provide a mitigation or patch ETA after initial triage.

## Disclosure Process

1. Report received and acknowledged
2. Triage & severity assessment
3. Patch preparation and internal testing
4. Coordinated release (if needed)
5. Public disclosure (optional) after fix is deployed

## Scope

In-scope components:

- Next.js application (`src/`)
- Prisma models & database layer (`prisma/`)
- Authentication & authorization logic (`src/lib/auth*`, `src/middleware.ts`)
- Server actions (`src/actions/`)
- Push notification logic (`src/hooks/use-fcm.ts`, related API routes`)

Out of scope:

- Third-party service vulnerabilities (Google, Firebase, Cloudinary)
- User misuse of credentials

## Best Practices Followed

- OAuth-based authentication (Google)
- Role-based access control (Student/Admin)
- Input validation with Zod
- Secrets managed via environment variables
- Minimal data access in server actions
- Database access restricted via Prisma client

## Known Risks

Currently no publicly disclosed unresolved security issues.

## Secure Development Guidelines for Contributors

- Validate all external input
- Sanitize uploaded file metadata
- Avoid leaking stack traces to users
- Never log secrets
- Use HTTPS in production deployments

Thanks for helping keep VESITRail secure.
