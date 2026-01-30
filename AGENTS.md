# 🧠 TOEFL iBT Project Constitution

> **Vision**: Build a scalable, global-ready TOEFL learning platform.\
> **Core Philosophy**: Long-term Scalability > Short-term Convenience.

---

## 1. Architectural Principles

### 🛡️ Clean In, Clean Out (Data Integrity)

- **Principle**: Never rely on frontend to fix broken data. Fix it at the source
  (Ingestion Layer).
- **Practice**:
  - AI-generated content MUST be normalized **before** database insertion.
  - Use `_shared/normalize-spacing.ts` in Edge Functions.
  - Implement **Self-Healing** logic for reading cached data.

### 🌍 Global First (Scalability)

- Database schema is designed for global scale (41+ tables).
- Always consider **i18n** (Internationalization) constraints.
- Avoid hardcoded logic that breaks in other languages (e.g., blind spacing).

---

## 2. Tech Stack & Conventions

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, DB, Realtime, Edge Functions)
- **AI**: Gemini (via Edge Functions)
- **Runtime**: Deno (for Edge Functions)

---

## 3. Critical Implementation Rules

### AI Content Generation

- **Prompting**: Explicitly instruct AI about formatting (e.g., "Text MUST end
  with a space").
- **Spacing**: AI treats spaces as separators. Always verify `Text` <-> `Blank`
  boundaries.
- **Gemini models**: Use only models listed in [Gemini models](https://ai.google.dev/gemini-api/docs/models) and [Deprecations](https://ai.google.dev/gemini-api/docs/deprecations). Do not hardcode deprecated/removed model IDs (e.g. `gemini-1.5-flash-002`). Check docs before changing `_shared/ai` model lists.

### Database

- **Schema**: Use `docs/architecture/database-schema.md` as the source of truth.
- **Migration**: Prefer lazy migration (self-healing) over batch updates for
  live data.

---

## 4. Maintenance & Synchronization

### 🔄 Environment Synchronization

- **Principle**: Local configuration must reflect the real remote state to
  prevent drift.
- **Practice**:
  - **Supabase Config**: Whenever a function is deployed or settings are changed
    via tools, update `supabase/config.toml` immediately.
  - **Project ID**: Ensure the `project_id` in `config.toml` matches the active
    project being worked on.
  - **Edge Function Settings**: Keep `verify_jwt` and other function-specific
    flags in sync between local config and remote deployment.
- **Automated Execution**: When the user explicitly requests "push" or "push
  완료", execute the corresponding git commands directly without asking for
  further confirmation, assuming the safety and correctness of the staged
  changes.
- **Proactive Pushing**: For simple modifications like Markdown (`.md`) updates,
  documentation, or minor UI adjustments (CSS/Layout tweaks), automatically
  perform the `add`, `commit`, and `push` cycle without waiting for a user
  request to ensure progress is tracked in real-time.

### 🚀 Supabase Edge Function Deployment

- **Rule**: Always use `--use-api` so deploy succeeds without Docker. Apply in `package.json` scripts and `.github/workflows/deploy-edge-functions.yml`.
- **Command**:
  ```bash
  npx supabase functions deploy <function-name> --no-verify-jwt --use-api --project-ref qnqfarulquicshnwfaxi
  ```
- **Reason**: Docker is not required; server-side bundling via API is reliable across environments.

---

## 5. Documentation

- Update `docs/dev-logs/` for major architectural decisions.
- Keep `docs/troubleshooting/` updated with solved critical issues.
