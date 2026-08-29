# Security Policy

VESITRail takes the security of its platform and user data seriously. This document outlines our supported versions, private vulnerability reporting process via **GitHub Security Advisories**, and the security standards enforced across the project.

---

## Supported Versions

| Branch     | Status              |
| :--------- | :------------------ |
| `main`     | Actively maintained |
| All others | Not supported       |

Security patches and updates are applied exclusively to the latest commit on the `main` branch. Prior releases and feature branches do not receive backported fixes.

---

## Reporting a Vulnerability

> **Do not open public GitHub issues, discussions, or pull requests for security vulnerabilities.**
> Publicly disclosing a vulnerability exposes all active users to risk before a patch can be deployed.

We use **GitHub Security Advisories** for private, secure vulnerability reporting and coordinated disclosure. Submissions through this portal are encrypted and only accessible to repository maintainers.

👉 **[Submit a Vulnerability Report via GitHub Security Advisories](https://github.com/VESITRail/VESITRail/security/advisories/new)**

### Vulnerability Report Format

When submitting an advisory, please provide comprehensive technical details using the GitHub Advisory format:

#### 1. Advisory Details

- **Title**: A concise, descriptive summary of the vulnerability (e.g., _Improper access control in concession review server action_).
- **Description**:
  - `### Summary`: High-level summary of the issue, clearly stating the severity, exploitability, and potential impact.
  - `### Details`: In-depth technical breakdown of the vulnerability. Reference specific files, endpoints, server actions, or lines of code (e.g., `src/actions/concession.ts`, `src/proxy.ts`).
  - `### PoC (Proof of Concept)`: Clear, reproducible step-by-step instructions, sample payloads, API calls, or configuration steps required to replicate the vulnerability.
  - `### Impact`: What type of vulnerability is this? Which user roles (Students, Admins, Unauthenticated users) or data assets are impacted?

#### 2. Affected Products & Packages

- **Ecosystem**: `npm` / `pnpm`
- **Package Name**: `vesitrail` (or relevant dependency / submodule)
- **Affected Versions**: e.g., `< 2.0.0` or specific commit hash
- **Patched Versions**: e.g., Target release or `main`

#### 3. Severity & CVSS v3.1 Assessment

Please evaluate the severity using the CVSS calculator where applicable:

- **Attack Vector (AV)**: `Network` / `Adjacent` / `Local` / `Physical`
- **Attack Complexity (AC)**: `Low` / `High`
- **Privileges Required (PR)**: `None` / `Low` / `High`
- **User Interaction (UI)**: `None` / `Required`
- **Scope (S)**: `Unchanged` / `Changed`
- **Confidentiality (C)**: `None` / `Low` / `High`
- **Integrity (I)**: `None` / `Low` / `High`
- **Availability (A)**: `None` / `Low` / `High`

#### 4. Common Weakness Enumeration (CWE)

Specify the relevant CWE identifier (e.g., `CWE-284: Improper Access Control`, `CWE-862: Missing Authorization`, `CWE-79: Cross-Site Scripting`, `CWE-89: SQL Injection`).

#### 5. Credit & Acknowledgement

Reporters are credited through GitHub Security Advisories and the **MITRE Credit System** once the advisory is officially published.

---

## Response & Triage Timeline

| Stage                                | Expected Timeframe                                         |
| :----------------------------------- | :--------------------------------------------------------- |
| **Initial Acknowledgment**           | Within 48–72 hours                                         |
| **Triage & Severity Assessment**     | Within 5 business days                                     |
| **Patch Development & Verification** | Based on CVSS severity (Critical: <7 days, High: <14 days) |
| **Coordinated Public Release**       | Upon deployment of the fix to production                   |

Maintainers will collaborate with the reporter inside the private GitHub advisory workspace, where temporary private forks and pull requests are used to test patches before public merging.

---

## Scope

### In Scope

The following codebase components are in scope for security evaluations:

| Component                            | Path / Location                                                        |
| :----------------------------------- | :--------------------------------------------------------------------- |
| Next.js App Router & Routes          | `src/app/`                                                             |
| Edge Route Interceptor & Proxy       | `src/proxy.ts`                                                         |
| Authentication & Role Guards         | `src/lib/auth.ts`, `src/lib/auth-guard.ts`                             |
| Server Actions & Business Logic      | `src/actions/`                                                         |
| Database Layer & Models              | `prisma/schema.prisma`, `prisma/models/`                               |
| Object Storage Ingestion             | `src/actions/r2.ts`                                                    |
| Push Notifications & Messaging       | `src/lib/notifications/`, `src/actions/fcm.ts`, `src/hooks/use-fcm.ts` |
| Progressive Web App & Service Worker | `src/sw.ts`                                                            |

### Out of Scope

The following are excluded from this security policy:

- Vulnerabilities in upstream third-party services (Google OAuth, Firebase, Cloudflare R2, PostHog) beyond our configuration.
- Denial of Service (DoS/DDoS) attacks against third-party hosting infrastructure.
- Social engineering, phishing, or physical attacks against students, faculty, or administrators.
- Issues caused by unauthorized local browser extensions or compromised client machines.

---

## Security Practices Enforced in VESITRail

VESITRail enforces defence-in-depth security standards across all layers:

| Security Domain              | Implementation Standard                                                                                                                   |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**           | Google OAuth 2.0 via Better Auth restricted to institutional `@ves.ac.in` email domain at the database hook level.                        |
| **Authorization (RBAC)**     | Role validation (`requireAuth`, `requireAdmin`, `requireStudent`) enforced server-side on every Server Action.                            |
| **Input Validation**         | Runtime validation on all client submissions using Zod schemas generated from Prisma models.                                              |
| **SQL Injection Prevention** | Parameterized database queries executed via Prisma ORM v7 with `@prisma/adapter-pg`.                                                      |
| **File Storage Security**    | Cloudflare R2 presigned URLs with short-lived expiration for secure client-direct uploads.                                                |
| **Transport & Headers**      | Strict HTTPS, HSTS (`max-age=31536000`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restricted `Permissions-Policy`. |
| **Secret Management**        | All credentials and secrets managed strictly via environment variables; never checked into version control.                               |

---

## Secure Development Guidelines for Contributors

All contributors must adhere to the following standards:

1. **Never Trust Client Input**: Always validate and sanitize parameters on the server side using Zod before processing.
2. **Enforce Role Verification**: Use `requireAdmin()` or `requireStudent()` in all server actions to prevent IDOR (Insecure Direct Object Reference).
3. **No Sensitive Data in Logs**: Avoid logging tokens, passwords, cookies, or student PII.
4. **Preserve Security Headers**: Do not modify or disable security headers in `next.config.ts` without maintainer review.
5. **Keep Dependencies Audited**: Periodically run `pnpm audit` to detect and remediate vulnerabilities in npm dependencies.

---

## Additional Resources

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [System Architecture Documentation](../docs/ARCHITECTURE.md)
