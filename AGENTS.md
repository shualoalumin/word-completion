# 🧠 TOEFL iBT Project Constitution

> **Vision**: Build a scalable, global-ready TOEFL learning platform.  
> **Core Philosophy**: Long-term Scalability > Short-term Convenience.

---

## 1. Architectural Principles

### 🛡️ Clean In, Clean Out (Data Integrity)
- **Principle**: Never rely on frontend to fix broken data. Fix it at the source (Ingestion Layer).
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
- **Prompting**: Explicitly instruct AI about formatting (e.g., "Text MUST end with a space").
- **Spacing**: AI treats spaces as separators. Always verify `Text` <-> `Blank` boundaries.

### Database
- **Schema**: Use `docs/architecture/database-schema.md` as the source of truth.
- **Migration**: Prefer lazy migration (self-healing) over batch updates for live data.

---

## 4. Documentation
- Update `docs/dev-logs/` for major architectural decisions.
- Keep `docs/troubleshooting/` updated with solved critical issues.

