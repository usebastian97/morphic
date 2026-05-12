# Changelog

All notable changes to the SwissTaxSearch / Morphic codebase are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.
Versions on the `dev` branch are tagged by date until a formal release cycle is established.

---

## [Unreleased]

_Changes merged to `dev` but not yet reflected in a tagged release._

### Added

- **SwissTaxSearch domain baseline** — destructive Supabase reset migration for the new official Swiss tax product scope
  - `supabase/migrations/001_swisstaxsearch_schema.sql` — creates Swiss tax profile, canton, official source, tax topic, analytics, alert, subscription, and credit ledger tables
  - `supabase/seed/swiss_cantons.sql`, `supabase/seed/tax_topics.sql`, `supabase/seed/official_sources.sql` — seed the new Swiss tax reference data
  - `lib/swiss-tax/*` — query enrichment, official domain policy, official source cache, profile context, and official-source evidence scoring
  - `lib/tools/swiss-tax-search.ts` — Parallel Search implementation constrained to official Swiss federal, cantonal, and municipal domains
  - `lib/subscriptions/credits.ts` — credit costs, authenticated preflight checks, and post-save credit deduction helpers
- **Export Response as Cited PDF** _(Sprint 1.2)_ — "Download as PDF" button on every assistant response
  - `lib/supabase/queries/export-message.ts` — `getMessageExportData()` fetches the assistant message, source parts, preceding user query, and official source metadata
  - `app/api/messages/[messageId]/export-pdf/route.ts` — RLS-enforced export endpoint
  - `lib/export/generate-pdf.tsx`, `lib/hooks/use-export-pdf.ts`, and `components/artifact/export-pdf-button.tsx` — client-side PDF generation and download UI
- **Evidence Scoring system** — automatic official-source trust rating for every assistant message
  - `GET /api/messages/[messageId]/evidence-score` — RLS-enforced endpoint returning `{ score: EvidenceScore | null }`
  - `components/artifact/evidence-score-badge.tsx` — client badge with polling and HoverCard breakdown
  - Score is written to `messages.metadata.evidence_score` after `upsertMessage()` succeeds

### Changed

- **Product domain pivot** — renamed active behavior from AgriEvidence agriculture search to SwissTaxSearch official Swiss tax search
  - `lib/agents/prompts/search-mode-prompts.ts` — rewritten for official Swiss tax answers, jurisdiction applicability, and non-advice caveats
  - `lib/agents/researcher.ts` — injects Swiss tax profile context instead of agricultural context
  - `lib/tools/fetch.ts` — rejects non-official Swiss tax/government URLs
  - `components/profile/profile-form.tsx` and `app/(app)/onboarding/*` — collect canton, municipality, taxpayer type, preferred language, and optional tax research notes
  - `components/artifact/evidence-score-badge.tsx`, `lib/export/generate-pdf.tsx`, and export helpers — display official-source scoring and SwissTaxSearch copy
  - `app/api/chat/route.ts` and `lib/streaming/helpers/persist-stream-results.ts` — replaced authenticated Redis daily caps with credit preflight and post-save credit deduction

### Removed

- Deleted obsolete agriculture modules under `lib/agri/` and the old `lib/tools/agri-search.ts` provider.
- Deleted old AgriEvidence migration files and agriculture seed files in favor of the single SwissTaxSearch baseline migration and seed set.
- Deleted outdated AgriEvidence roadmap and GTM documents from `docs/`.

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

| Commit    | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| `b4fef07` | chore: bump Next.js to 16.2.3                                    |
| `8db7272` | fix: align upload client MIME types with server allow-list       |
| `c212932` | feat: add keyboard shortcuts dialog (⌘/)                         |
| `73b8d36` | feat: enlarge image carousel dialog, dark floating style         |
| `d2886aa` | feat: inline image groups via spec blocks                        |
| `0905c5c` | refactor: generalise spec components to Heading and Button       |
| `1df54d8` | fix: offset chat section scroll target for mobile header         |
| `20bad58` | fix: exclude instagram.com from Tavily results in Cloud          |
| `9b4d1b9` | feat: footer message with typewriter tips next to assistant logo |
| `1a3eeef` | feat: show "Reply..." placeholder for follow-up messages         |
| `07963f8` | feat: per-user daily limit for adaptive search mode              |
| `0f852c6` | fix: increase max HTTP header size for development server        |
