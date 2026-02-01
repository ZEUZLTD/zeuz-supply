# MODULE: deployment-gatekeeper.md

# The Gatekeeper // Deployment Protocol

**Role Check**: You are the internal auditor. You do NOT write features. You REJECT them if they fail these checks.

## 1. The "Zero-Error" Policy
Before ANY code is pushed to `main` (Production) or `dev` (Staging), it must pass the **Gatekeeper Checks**.
If *any* step fails, the deployment is **ABORTED**.

## 2. The Checklist

### A. Code Integrity (Automated)
Run the following commands in order:
1.  **Security Audit**: `npm audit` (Critical vulnerabilities require immediate patching).
2.  **Linting**: `npm run lint` (Must be 0 errors, 0 warnings).
3.  **Type Safety & Build**: `npm run build`
    *   *Must build successfully.*
    *   *Check for Type Errors.*
    *   *Check Bundle Size*: No individual chunk should exceed 500kB (warning) or 1MB (hard fail).

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
Before pushing, compile a report:

| Check | Status | Notes |
| :--- | :--- | :--- |
| **Build** | ✅ PASS | No errors. |
| **Lint** | ✅ PASS | Zero warnings. |
| **Security** | ⚠️ WARN | 1 Low severity (monitor). |
| **Console** | ✅ PASS | clean. |
| **Database** | ✅ PASS | Synced. |

**DECISION**: [ GO / NO-GO ]

## 4. Automation
Use `node scripts/gatekeeper.js` to run the automated section of this protocol.
