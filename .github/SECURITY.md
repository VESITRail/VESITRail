# Security Policy

VESITRail takes the security of its platform and user data seriously. This document outlines our supported versions, vulnerability reporting process, and the security practices we follow across the project.

---

## Supported Versions

| Branch     | Status              |
| ---------- | ------------------- |
| `main`     | Actively maintained |
| All others | Not supported       |

Security patches are applied exclusively to the latest commit on the `main` branch. Prior releases and feature branches do not receive backported fixes.

---

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

To report a vulnerability responsibly, send a detailed report via email to:

**vesit.railwayconcession@ves.ac.in**

Your report should include the following:

- A clear description of the vulnerability and the affected component
- Step-by-step instructions to reproduce the issue, or a proof of concept
- An assessment of the potential impact and severity
- Any suggested remediation or mitigation steps, if applicable

### Response Timeline

| Stage                        | Expected Timeframe     |
| ---------------------------- | ---------------------- |
| Initial acknowledgment       | Within 72 hours        |
| Severity assessment          | Within 5 business days |
| Patch or mitigation delivery | Based on severity      |

We will keep you informed throughout the process and coordinate on any public disclosure timeline.

---

## Disclosure Process

We follow a coordinated disclosure model to ensure vulnerabilities are addressed before they are made public.

1. **Report Received** -- The security team acknowledges receipt of the vulnerability report.
2. **Triage and Assessment** -- The report is evaluated for severity, impact, and reproducibility.
3. **Patch Development** -- A fix is developed and tested internally against the identified issue.
4. **Coordinated Release** -- The patch is deployed to production, with the reporter notified accordingly.
5. **Public Disclosure** -- If appropriate, a public advisory is issued after the fix has been verified in production.

---

## Scope

### In Scope

The following components are covered under this security policy:

| Component                        | Path / Location                            |
| -------------------------------- | ------------------------------------------ |
| Next.js application              | `src/`                                     |
| Prisma models and data layer     | `prisma/`                                  |
| Authentication and authorization | `src/lib/auth*`, `src/middleware.ts`       |
| Server actions                   | `src/actions/`                             |
| Push notification infrastructure | `src/hooks/use-fcm.ts`, related API routes |

### Out of Scope

The following are explicitly excluded from this policy:

- Vulnerabilities in third-party services (Google, Firebase, Cloudflare R2) that are outside our control
- Issues arising from user misuse or mishandling of credentials
- Denial-of-service attacks against infrastructure not managed by VESITRail
- Social engineering attacks targeting individual users

---

## Security Practices

VESITRail is built with security as a foundational concern. The following practices are enforced across the codebase:

| Practice           | Implementation                                            |
| ------------------ | --------------------------------------------------------- |
| Authentication     | OAuth 2.0 via Google, restricted to `@ves.ac.in` domain   |
| Authorization      | Role-based access control (Student / Administrator)       |
| Input validation   | Schema-level enforcement using Zod                        |
| Secret management  | Environment variables, never committed to version control |
| Data access        | Minimal-privilege queries via Prisma client               |
| Server actions     | Scoped data access with input sanitization                |
| Transport security | HTTPS enforced in all production deployments              |

---

## Known Vulnerabilities

There are currently no publicly disclosed or unresolved security issues affecting VESITRail.

If this status changes, advisories will be published through the repository's security advisory feature.

---

## Secure Development Guidelines

All contributors are expected to adhere to the following standards:

- **Validate all external input** -- Never trust data from client-side sources without server-side validation.
- **Sanitize file metadata** -- Strip or validate metadata from uploaded files before processing or storage.
- **Suppress internal error details** -- Avoid exposing stack traces, database errors, or internal paths to end users.
- **Protect secrets** -- Never log, commit, or expose API keys, tokens, or credentials in any form.
- **Enforce HTTPS** -- All production deployments must use encrypted connections without exception.
- **Follow least privilege** -- Request only the minimum permissions and data access required for any operation.
- **Review dependencies** -- Regularly audit third-party packages for known vulnerabilities using automated tooling.

---

## Contact

For security-related inquiries, contact the maintainer team at **vesit.railwayconcession@ves.ac.in**.

For general contribution guidelines, refer to the [Contributing Guide](CONTRIBUTING.md). For the project's code of conduct, see the [Code of Conduct](CODE_OF_CONDUCT.md).
