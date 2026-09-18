# LLM Reference Documentation (`docs/llms/`)

This directory stores curated `llms.txt` and reference files for AI coding assistants working in this repository.

## Purpose

Providing concise, authoritative documentation files prevents AI assistants from hallucinating outdated syntax, wrong library APIs, or mismatched version conventions (e.g., confusing Jest with Vitest, or Next.js 14 conventions with Next.js 16).

These files are **indexes, not archives**. The goal is to give an assistant just enough to (a) know a page exists and (b) know when to go fetch it — never to pre-load an entire doc site into context. Two failure modes we're explicitly avoiding:

- **Staleness** — pasting raw doc content in means it silently rots the moment upstream ships a new version. A link with a clear "how to refresh" path stays correct indefinitely; a snapshot doesn't.
- **Context pollution** — dumping full pages (or `llms-full.txt`) into every session burns tokens on content that's irrelevant to the task at hand and crowds out the actual code/problem. A well-organized index lets the assistant fetch only the 1–2 pages it actually needs.

---

## Existing Directory Structure

```text
docs/llms/
├── README.md
├── better-auth/
│   └── llms.txt
└── vitest/
    └── llms.txt
```

---

## Active Documentation Catalog

| Tool / Library  | Location                                         | Scope                                                                                                                                                            | Last Synced |
| :-------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **Better Auth** | [`better-auth/llms.txt`](./better-auth/llms.txt) | Server/client authentication setup, Prisma adapter, Next.js App Router route handlers, session guards, and Google OAuth.                                         | 2026-09-15  |
| **Vitest**      | [`vitest/llms.txt`](./vitest/llms.txt)           | Unit and integration testing configuration, multi-project workspaces (unit vs integration), Better Auth testUtils harness, coverage thresholds, and runner APIs. | 2026-09-17  |

> Keep a **Last Synced** date on every row. If a file hasn't been refreshed in 3+ months, or the tool has had a major version bump since, treat its contents as suspect and re-verify before trusting it for anything version-sensitive.

---

## Guide: Adding a New `llms.txt`

Follow this standard procedure whenever adding documentation for a new tool or dependency:

### Step 1: Create the Directory and File

Create a new folder under `docs/llms/` using the lowercase package or tool name:

```bash
mkdir -p docs/llms/<tool-name>
touch docs/llms/<tool-name>/llms.txt
```

### Step 2a: Fetch the Index

Check for the tool's official `llms.txt` (not `llms-full.txt`) at `https://<tool-domain>/llms.txt`. This is a mechanical lookup: confirm the file exists and note its table of contents / link structure. The index is usually just a sitemap or table of contents, which serves as the raw input to curate from.

### Step 2b: Decide Categories

Using that table of contents, decide how to bucket the content for our index (e.g. Config / Guide / API / Recipes), mirroring the upstream site's own structure where possible.

This is a judgment step, not mechanical — note that curation decisions (what to summarize, what to skip, what project conventions to add) happen here:

- **Curate for this project**: Rather than saving massive raw web dumps, distill the content into:
  - Primary official reference URLs.
  - A categorized link index mirroring the tool's own doc structure so an assistant can jump straight to the right section instead of scanning one giant list.
  - Quick reference syntax / cheatsheet for daily use.
  - Project-specific constraints (e.g. "Do not use X", or "Always import from @/...").
- **Never paste full page bodies.** Link to them. If a snippet is genuinely load-bearing (a gotcha, a non-obvious option), a 1–3 line example is fine — a full copy-paste of the docs page is not.

### Step 3: Use the Standard Template

Structure every `llms.txt` consistently using this format:

```markdown
# <Tool Name> Documentation (llms.txt)

> Short description of the tool and its role in this repository.
> Official reference: https://<domain>/llms.txt
> Full documentation: https://<domain>/docs

## Project Conventions

- Specific rules for our stack (e.g. Node environment, strict types, file naming).
- Import paths and path aliases (`@/*`).

## Quick Reference & APIs

- List most frequent functions, classes, or patterns.
- Brief code snippets illustrating proper usage.

## Core Documentation Index

- [Topic 1](https://<domain>/docs/topic-1)
- [Topic 2](https://<domain>/docs/topic-2)

## Usage Notes for AI Assistants

- Fetch only the specific page(s) relevant to the current task — don't load the whole doc site into context.
- If a URL convention exists (e.g. append `.md` to any doc path for raw Markdown), state it once here so it doesn't need repeating per link.
- Point to which page to check _first_ for the most common category of question (e.g. "check the main config reference before searching individual option pages").
- Flag any features/options tagged with a specific version number as possibly unavailable in this project's installed version — tell the assistant to check the installed version in `package.json` (or equivalent lockfile) before relying on them.

## Maintenance

- Source of truth: https://<domain>/llms.txt (re-fetch and diff against this file periodically)
- Re-sync when: a major version bump lands, links start 404ing, or it's been 3+ months since the last sync.
```

### Step 4: Validate Before Merging

Run through this checklist before committing or opening a PR with the new documentation:

- Confirm every link in the new `llms.txt` actually resolves (no typos'd paths, no 404s).
- Confirm the file includes a "Usage Notes for AI Assistants" section and a "Maintenance" section per the template.
- Confirm the file is not excessively long — if it's pushing past a couple hundred lines, flag that it may need splitting into subcategorized files (e.g. `<tool>/config.txt`, `<tool>/api.txt`) instead of merging as one file, per the "Best Practices" section.

### Step 5: Link in `AGENTS.md`

To ensure AI assistants discover the new documentation automatically:

1. Open [`AGENTS.md`](../../AGENTS.md).
2. Append an entry **after** the `<!-- NEXT-AGENTS-MD-END -->` delimiter so Next.js codemod runs will not overwrite it:
   ```markdown
   <!-- <TOOL-NAME>-DOCS-START -->

   [<Tool Name> Docs Index]|root: ./docs/llms/<tool-name>/llms.txt|<Short instruction for agents on when and how to consult this doc>.
   <!-- <TOOL-NAME>-DOCS-END -->
   ```
3. Keep the "short instruction" specific and trigger-y — name the exact scenarios that should make an agent open this file (e.g. "consult before writing or editing any `*.test.ts` file, or when configuring test timeouts/mocks"), not a vague "for testing questions."

### Step 6: Update the Catalog

Add a new row to the [Active Documentation Catalog](#active-documentation-catalog) table in this `README.md`, including today's date in **Last Synced**.

---

## Best Practices (why the template looks like this)

- **Index over dump, always.** An `llms.txt` file should let an assistant answer "does a page for this exist, and where" in one read. The actual content lives upstream (or in a fetched page), not in this repo.
- **Mirror the upstream information architecture.** If the tool's own docs split into Config / Guide / API / Recipes, keep those same buckets in the index. It makes cross-referencing the official site trivial and makes it obvious where a new link belongs later.
- **Every file names its own refresh path.** Each `llms.txt` should state exactly where it came from (the upstream `llms.txt`/`llms-full.txt` or doc site) so refreshing it later is a diff, not a rewrite from scratch.
- **Call out project-specific deviations explicitly.** Generic API docs don't know about this repo's path aliases, banned patterns, or house conventions — that's the part worth writing by hand rather than curating from upstream.
- **Tag version-sensitive features.** Docs sites often document the latest/edge features. Note anything that might not exist in the version actually pinned in this repo, and tell the assistant to check the lockfile/`package.json` before relying on it.
- **Keep a "Usage Notes for AI Assistants" section in every file.** This is the one part written _for_ the model rather than _about_ the tool — it should say how to navigate the file (fetch narrow, not broad), which page to check first, and any gotchas in interpreting the index.
- **Size discipline.** If a single `llms.txt` is growing past a couple hundred lines, it's a sign the tool's surface area is large enough to warrant subcategorized files (e.g. `vitest/config.txt`, `vitest/api.txt`) rather than one sprawling index.
- **Don't duplicate what the model already knows well.** Skip boilerplate explanations of well-known, stable concepts; spend the curation effort on things that actually drift (config keys, API shapes, current version quirks) or that are project-specific.
