# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-28

### Added
- **TOEFL 2026 Analysis**: Comprehensive documentation for the new TOEFL iBT format changes.
- **Algorithm Analysis**: In-depth reverse-engineered logic for the new Writing Task 1: "Build a Sentence" (`docs/algorithms/ets-build-sentence-algorithm.md`).
- **Project Constitution**: Added "Maintenance & Synchronization" rule to `AGENTS.md` to ensure local/remote environment parity.
- **UI UX**: Added "English Mode" keyboard hint to the Text Completion practice screen for better user guidance.

### Fixed
- **Authentication**: Resolved 401 Unauthorized errors in `explain-word-in-context` Edge Function by allowing unauthenticated access (v6).
- **Core Logic**: Removed restrictive `onBeforeInput` filters in `CharInput.tsx` to fix desktop typing issues (IME/Focus).
- **UI/UX**: Fixed word explanation popup overflow by shortening AI-generated definitions (2-3 synonyms) and context (max 2 lines).
- **Environment**: Synchronized `supabase/config.toml` with the active production project ID.

### Changed
- **Mobile Navigation**: Refactored Global Header mobile view to a horizontal "App-like" layout with optimized spacing.
- **Dashboard**: Updated icons and labels to match the new practice terminology ("Practice" with Pencil icon).
