# MODULE: deployment-gatekeeper.md

# The Gatekeeper // Deployment Protocol

**Role Check**: You are the internal auditor. You do NOT write features. You REJECT them if they fail these checks.

## 1. The "Zero-Error" Policy
Before ANY code is pushed to `main` (Production) or `dev` (Staging), it must pass the **Gatekeeper Checks**.
If *any* step fails, the deployment is **ABORTED**.

## 2. The Checklist

### A. Code Integrity (Automated via `node scripts/gatekeeper.js`)
Run the following commands in order:
1.  **Security Audit**: `npm audit --audit-level=high` (High/Critical vulnerabilities flagged as WARN).
2.  **Linting**: `npm run lint` (Advisory only - warnings don't block deployment).
3.  **Fast Type Check**: `npx tsc --noEmit` (Quick ~5s check - catches type errors before full build).
4.  **Production Build**: `npm run build`
    *   *Must build successfully.*
    *   *Validates types, compiles pages, generates static content.*
    *   *Check Bundle Size*: No individual chunk should exceed 500kB (warning) or 1MB (hard fail).

**Exit Criteria**: Deployment requires both `Type Check` (Step 3) and `Build` (Step 4) to pass.

### B. Visual Integrity (Manual / Agentic)
1.  **Terminal Check**: Review the `npm run dev` output. Are there any runtime error stacks?
2.  **Browser Check (Critical)**:
    *   **Homepage**: Load `http://localhost:3000/`. Check for 404s (Chunks) or Hydration Errors.
    *   **Admin**: Load `http://localhost:3000/admin`. Verify Dashboard access.

### C. Documentation & Consolidation (Architect Mode)
1.  **Update Context**: Ensure `.agent/context/*.{md,json}` files reflect the latest codebase state.
2.  **Consolidate**: Run `node scripts/consolidate_docs.js`.
    *   *Output*: Verifty `ZEUZ_FULL_CONTENT.md` is generated/updated.

### D. Data Integrity (Supabase)
1.  **Schema Sync**: Run `npx supabase db push`.
    *   *Expectation*: "Everything is up to date" OR successful migration application.
    *   *Risk*: If there are local changes not reflected in the migration history, determine if they are destructive.

### E. SEO & Assets
1.  **Robots.txt**: Verify it allows indexing (for Prod) or Disallows (for internal paths).
2.  **Sitemap**: Is it accessible at `/sitemap.xml`?

## 3. The "Go / No-Go" Summary
Before pushing, compile a report (or run `node scripts/gatekeeper.js` for automated version):

| Check | Status | Notes |
| :--- | :--- | :--- |
| **Security** | ⚠️ WARN | Advisory only (High+ flagged). |
| **Lint** | ✅ PASS | Advisory only (warnings OK). |
| **Type Check** | ✅ PASS | Must pass for deployment. |
| **Build** | ✅ PASS | Must pass for deployment. |
| **Database** | 🔧 MANUAL | Run `npx supabase db push` if changed. |

**DECISION**: [ GO / NO-GO ] (Requires Type Check + Build = PASS)

## 4. Automation
Use `node scripts/gatekeeper.js` to run the automated section of this protocol.
