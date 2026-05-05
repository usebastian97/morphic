# Changelog

All notable changes to the AgriEvidence / Morphic codebase are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.
Versions on the `dev` branch are tagged by date until a formal release cycle is established.

---

## [Unreleased]

_Changes merged to `dev` but not yet reflected in a tagged release._

### Added

- **Export Response as Cited PDF** *(Sprint 1.2)* — "Download as PDF" button on every assistant response
  - `lib/supabase/queries/export-message.ts` — `getMessageExportData()` fetches the assistant message, its text/source parts, the preceding user query, and enriches each cited source with trust score and type from the curated `sources` table; exports `MessageExportData` and `ExportSource` interfaces
  - `app/api/messages/[messageId]/export-pdf/route.ts` — RLS-enforced GET endpoint returning `{ data: MessageExportData }`; mirrors `evidence-score` route pattern
  - `lib/export/generate-pdf.tsx` — `generateAndDownloadPDF()` builds a structured A4 PDF using `@react-pdf/renderer` (dynamically imported to avoid SSR), with Header (logo + date), Query, Answer (markdown stripped), Evidence Score, Sources (numbered with type/trust/snippet/URL), and Footer (disclaimer + page numbers)
  - `lib/hooks/use-export-pdf.ts` — `useExportPdf(messageId)` hook: fetch → generate → `toast.success`/`toast.error` → `track('pdf_export', { messageId, label })`
  - `components/artifact/export-pdf-button.tsx` — `solar:file-download-bold` icon button with Radix Tooltip, spinner (`solar:refresh-bold animate-spin`) during generation, and `aria-label="Download as PDF"`
  - `components/message-actions.tsx` — added `<ExportPDFButton messageId={messageId} />` between the copy button and feedback buttons
  - Installed `@react-pdf/renderer@4.5.1`

- **Evidence Scoring system** — automatic trustworthiness rating (0–100) for every assistant message
  - `lib/agri/evidence-score.ts` — pure scoring function (`computeEvidenceScore`, `getScoreColor`); types: `EvidenceScore`, `EvidenceBreakdown`, `CuratedSource`
  - `lib/agri/evidence-score.test.ts` — 6 Vitest unit tests covering all label tiers, fallback penalty, empty parts, and colour helpers
  - `lib/agri/curated-sources-cache.ts` — module-level 10-minute TTL cache for active `sources` rows (no DB hit per request)
  - `GET /api/messages/[messageId]/evidence-score` — RLS-enforced endpoint returning `{ score: EvidenceScore | null }`
  - `components/artifact/evidence-score-badge.tsx` — client badge component with `useEvidenceScore` polling hook (2 s intervals, 10 s timeout), Radix `HoverCard` breakdown, Iconify Solar shield icons, full light/dark mode, and `aria-label`
- Score written to `messages.metadata.evidence_score` (JSONB) as a fire-and-forget step inside `persist-stream-results.ts` immediately after `upsertMessage()` succeeds
- Documentation: `docs/DATABASE_SCHEMA.md` — `metadata` JSONB shape for `messages`; `docs/CONFIGURATION.md` — Evidence Scoring section; `docs/PROJECT_OVERVIEW.md` — Feature 14 write-up

---

## [2026-05-05] — AgriEvidence Dev Sprint 2

### Added

- **User profile management** (`9428006`)
  - `components/profile/profile-form.tsx` — edit form for full name, bio, farm details, and preferences
  - Sidebar enhancements with profile link and avatar display

- **Onboarding UX improvements** (`8748633`)
  - Refined step copy, field grouping, and messaging clarity across all five wizard steps
  - Improved mobile layout for onboarding screens

### Changed

- **Iconify Solar icons** (`665e232`)
  - Replaced all remaining Lucide React icon imports with Iconify Solar equivalents across: `app-sidebar`, `chat-panel`, `collapsible-message`, `header`, `marketing-nav`, `message-actions`, `model-selector-client`, `profile-form`, `render-message`, `research-process-section`, `search-results-image`, `search-section`, `section`, `sidebar/*`, `sign-up-form`, `ui/carousel`, `uploaded-file-list`, `user-menu`, `user-text-section`, and `lib/actions/profile`, `lib/render/components/*`
  - Icon import: `import { Icon } from "@iconify/react"` with `solar:*` identifiers

---

## [2026-05-04] — AgriEvidence Dev Sprint 1

### Added

- **Agricultural context in AI responses** (`54c701e`)
  - Authenticated chat requests now inject user profile fields (`primary_crops`, `climate_zone`, `country_code`) into both the Researcher system prompt and DeepSeek V4 Flash query enrichment

- **Comprehensive documentation** (`fec5c7c`)
  - `docs/PROJECT_OVERVIEW.md` — full architecture, stack, feature inventory, environment variable reference
  - `docs/DATABASE_SCHEMA.md` — all 8 migration groups with full column specs, RLS policies, indexes, and ER diagram

- **Query enrichment** (`ec73b9a`)
  - `lib/agri/query-enricher.ts` — DeepSeek V4 Flash expands informal queries into 2–3 precise scientific sub-queries
  - Optional authenticated profile context injected into enrichment prompt for geographic/agronomic specificity
  - New model fetching utilities for dynamic model selection

- **Search + chat integration** (`227ffad`)
  - Parallel Search (`parallel-web`) wired as the default search backend for AgriEvidence
  - Domain policy sourced from the Supabase `sources` table; open-web fallback when trusted coverage is below threshold
  - `SearchResultsMetadata.openWebResults` field tracks fallback usage per search

### Changed

- **Agricultural search refactor** (`9af920e`)
  - Consolidated `lib/tools/agri-search.ts` provider, removed redundant code paths, improved error handling and result deduplication
  - Trusted domain cache aligned with `sources.is_active` flag

### Fixed

- **Next.js downgrade** (`c78d0e9`)
  - Reverted from 16.2.3 to 15.5.5 to resolve build compatibility issues with the AgriEvidence deployment environment
  - Updated all Next.js-dependent packages accordingly

---

## [2026-05-04] — Database Foundation (main branch merge)

_Commit `eea6858` — merged to `main`_

### Added

- **Database migrations 003–009** (`supabase/migrations/`)
  - `003_user_profiles.sql` — `user_profiles` table, `on_auth_user_created` trigger, `set_updated_at` function
  - `004_topics.sql` — hierarchical `topics` taxonomy (7 languages), `chat_topics` junction
  - `005_sources.sql` — curated `sources` table with `source_type`, `trust_score`, `domain`, `is_active`; `source_topics` junction
  - `006_bookmarks.sql` — `collections` and `bookmarks` tables with GIN tag index
  - `007_analytics.sql` — `search_events` (append-only) with trigram index; `trending_queries` aggregation table
  - `008_alerts.sql` — `alert_subscriptions` with multi-channel delivery config
  - `009_service_role_grants.sql` — service-role grants on all tables
- **Seed data** (`supabase/seed/`) — initial taxonomy topics and curated agricultural sources

---

## Upstream Base — Morphic Open Source

The AgriEvidence fork is based on the open-source [Morphic](https://github.com/miurla/morphic) project.
Upstream changes (Morphic `main` branch, pre-fork) include:

| Commit | Description |
|---|---|
| `b4fef07` | chore: bump Next.js to 16.2.3 |
| `8db7272` | fix: align upload client MIME types with server allow-list |
| `c212932` | feat: add keyboard shortcuts dialog (⌘/) |
| `73b8d36` | feat: enlarge image carousel dialog, dark floating style |
| `d2886aa` | feat: inline image groups via spec blocks |
| `0905c5c` | refactor: generalise spec components to Heading and Button |
| `1df54d8` | fix: offset chat section scroll target for mobile header |
| `20bad58` | fix: exclude instagram.com from Tavily results in Cloud |
| `9b4d1b9` | feat: footer message with typewriter tips next to assistant logo |
| `1a3eeef` | feat: show "Reply..." placeholder for follow-up messages |
| `07963f8` | feat: per-user daily limit for adaptive search mode |
| `0f852c6` | fix: increase max HTTP header size for development server |
