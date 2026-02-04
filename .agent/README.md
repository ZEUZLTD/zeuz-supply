# AGENT MANIFEST // SYSTEM CONTEXT

**CRITICAL INSTRUCTION FOR AI AGENTS**:
If you are an AI agent working on this repository, you **MUST** read the relevant context files below **BEFORE** attempting any changes.
Do not guess. Use the "Brain".

## 📍 Where am I?
*   **Repo**: `zeuz-supply`
*   **Mission**: High-Fidelity Infrastructure for Energy Distribution.
*   **Architecture**: Next.js 16 (Canary) + React 19 + R3F + Supabase + Stripe.

## 🧠 The "Brain" (Context Modules)

### 1. 🛠️ I am writing Code / Fixing Bugs
*   **READ**: [.agent/context/tech-stack.json](./context/tech-stack.json)
*   *Contains*: Framework versions, libraries, build commands, env vars.

### 2. 🎨 I am changing the UI / Styles
*   **READ**: [.agent/context/design-system.json](./context/design-system.json)
*   *Contains*: Color palettes ("Void Black"), typography, animation curves.
*   *Rule*: Do **NOT** introduce new colors. Use the tokens.

### 3. 📣 I am writing Copy / Marketing
*   **READ**: [.agent/context/marketing-strategy.md](./context/marketing-strategy.md)
*   *Contains*: Brand voice ("Teenage Engineering"), SEO keywords, campaigns.

### 4. 🧠 I am changing Business Logic (Checkout, Pricing, Inventory)
*   **READ**: [.agent/context/business-logic.md](./context/business-logic.md)
*   *Contains*: "The Paranoid Checkout Model", Volume Discounts, Stock Rules.

### 5. 📨 I am editing Emails / Communications
*   **READ**: [.agent/context/communications.md](./context/communications.md)
*   *Contains*: Transactional flows, Newsletter segments.

### 6. 🎯 I am updating Strategy / Business Model
*   **READ**: [.agent/context/strategy.md](./context/strategy.md)
*   *Contains*: Competitive analysis, Pricing matrix, Logistics strategy.

### 7. 🛡️ I am Deploying (The Gatekeeper)
*   **READ**: [.agent/context/deployment-gatekeeper.md](./context/deployment-gatekeeper.md)
*   **PROTOCOL**:
    *   **Browser Check**: Verify Homepage & Admin Load (Visual check).
    *   **Update Documentation**: Ensure all context files are current.
    *   **Consolidate**: Run `node scripts/consolidate_docs.js`.
    *   **Gatekeeper Audit**: Run `node scripts/gatekeeper.js`.

---

## ⚡ 3D Engine & R3F Rules (React 19 Protocol)

> [!WARNING]
> React 19 + Next.js 16 introduces aggressive hydration boundaries. Follow these rules to avoid `WebGL Context Lost` crashes.

1.  **NO DYNAMIC SSR DISABLE FOR CANVAS**:
    *   ❌ **BAD**: `dynamic(() => import('./HeroViewport'), { ssr: false })`
    *   ✅ **GOOD**: Import directly, and use a `{ mounted && <Component /> }` guard inside the component if client-only behavior is needed.
    *   *Reason*: Wrapping the Context provider in a dynamic loader causes double-initialization and context loss.

2.  **MATERIAL INJECTION OVER TEXTURES**:
    *   Avoid relying on GLB-embedded textures if they fail to load.
    *   Prefer **Runtime Material Injection**: Detect the mesh by name (`Mesh.name`) and apply a fresh `THREE.Material`. This is more robust and allows for dynamic theming.

---

## ⚡ Quick Protocol
1.  **Plan**: Read the relevant module.
2.  **Verify**: Check `task.md` for current objectives.
3.  **Execute**: Make atomic changes.
4.  **Audit**: Run `npm run build` before asking for review.
