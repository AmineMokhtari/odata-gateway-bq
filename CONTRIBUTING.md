# Contributing to odata-gateway-bq

Welcome! We're thrilled you want to help build the world's most business-friendly OData gateway for BigQuery. This project isn't just about moving data; it's about empowering people.

---

## 🌟 Our North Star: The 'Elena' Persona

Every line of code in this project should serve **Elena**, our "Stranded Analyst."
- **Who she is**: A brilliant business person who knows her data but doesn't know SQL or Python.
- **Her goal**: To connect her favorite tools (Excel, Power BI) to BigQuery instantly and securely.
- **Our mission**: To transform technical errors into "Elena Tips" and complex OData syntax into visual toggles.

**Rule #1**: If a feature is too complex for Elena to use, it's not finished yet.

---

## 🏗️ Architecture Philosophy

We follow the **Trusted Subsystem** model to eliminate IAM management overhead.

1. **Identity**: We verify the user via OIDC (Office 365/GCP).
2. **Authorization**: We check internal department rules (`common/src/types/tenant.ts`) to see if they are allowed in.
3. **Execution**: All queries run via a single **Master Service Account**.
4. **Audit**: We attach the user's identity to every BigQuery job using **Job Labels** (`user_identity`).

---

## 🚀 Development Workflow (The BMad Way)

We use the **BMad Framework** for a rigorous, story-driven implementation trail.

1. **Epics**: Large feature areas (e.g., "Self-Service Governance").
2. **Stories**: Small, actionable units of work with clear Acceptance Criteria (AC).
3. **Implementation**: We follow a Red-Green-Refactor cycle for every story.
4. **Walkthroughs**: Every major change is documented with a visual walkthrough.

**Before you start**: Check `_bmad-output/implementation-artifacts/sprint-status.yaml` to see what's in progress.

---

## 🎨 Premium UX Standards

Our frontend should feel premium, alive, and encouraging.

- **Styling**: Use Tailwind CSS (via Shadcn/UI) but maintain a custom, high-end aesthetic.
- **Icons**: Use `lucide-react` for all iconography.
- **Animations**: Use `framer-motion` for smooth state transitions and "Success Pulses."
- **Narrative**: Use the `ElenaAdviceCard` to provide feedback. Never show a raw JSON error to the user.

---

## 🛠️ Technical Guardrails

- **Type Safety**: No `any`. No `!`. Use TypeScript interfaces for all API contracts.
- **Cost Control**: Every query must undergo a **Dry Run** check before execution.
- **Streaming**: Data must be streamed from BigQuery to the client using Node.js `Transform` streams. Avoid `res.send(hugeArray)`.
- **SQL Safety**: Use the `translateODataToSql` engine. Never concatenate raw user input into SQL strings.

---

## 📥 Getting Started

1. **Environment**: Copy `.env.example` to `.env` and configure your GCP and OIDC settings.
2. **Auth**: Run `gcloud auth application-default login` to enable local BigQuery access.
3. **Install**: `npm install`
4. **Dev**: `npm run dev` (Runs both backend and frontend).

---

## 📬 Submitting Changes

1. Create a new Story file in `_bmad-output/implementation-artifacts/`.
2. Follow the story implementation steps.
3. Run `npm test` to ensure no regressions.
4. Submit your PR with a link to your `walkthrough.md`.

Thank you for helping us empower the next generation of analysts! 🚀
