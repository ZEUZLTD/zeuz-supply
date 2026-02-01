# AGENT MANIFEST // SYSTEM CONTEXT

**CRITICAL INSTRUCTION FOR AI AGENTS**:
If you are an AI agent working on this repository, you **MUST** read the relevant context files below **BEFORE** attempting any changes.
Do not guess. Use the "Brain".

## 📍 Where am I?
*   **Repo**: `zeuz-supply`
*   **Mission**: High-Fidelity Infrastructure for Energy Distribution.
*   **Architecture**: Next.js 14 + Supabase + Stripe.

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



## ⚡ Quick Protocol
1.  **Plan**: Read the relevant module.
2.  **Verify**: Check `task.md` for current objectives.
3.  **Execute**: Make atomic changes.
4.  **Audit**: Run `npm run build` before asking for review.
