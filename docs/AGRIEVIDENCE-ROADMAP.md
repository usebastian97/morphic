# AgriEvidence — Implementation Roadmap

> Last updated: May 2026  
> Stack: Next.js 15.5 · React 19 · TypeScript · Bun · Supabase · Vercel AI SDK v6 · DeepSeek V4 · Parallel.ai

---

## Table of Contents

1. [Overview](#overview)
2. [Sprint 1 — Foundation (Now)](#sprint-1--foundation-now)
3. [Sprint 2 — Grant Demo Ready](#sprint-2--grant-demo-ready)
4. [Sprint 3 — Scale & Integrations](#sprint-3--scale--integrations)
5. [Parallel.ai Integration Phases](#parallelai-integration-phases)
6. [Grant Alignment Matrix](#grant-alignment-matrix)
7. [Key Commands & Notes](#key-commands--notes)

---

## Overview

AgriEvidence is an AI-powered agricultural answer engine built on the Morphic open-source stack. It synthesises peer-reviewed literature, government extension data, and trusted agronomic sources into clear, cited answers.

This document defines the phased implementation plan across three sprints, plus a dedicated phase for Parallel.ai integrations.

### Guiding principle

> Every feature must answer: *"Who cannot access this information today, and how does this help them concretely?"*

---

## Sprint 1 — Foundation (Now)

**Goal:** Make each response trustworthy and shareable. These features are visible immediately in demo and require no new infrastructure.

**Timeline:** ~2 weeks

---

### 1.1 Evidence Scoring per Response

**Type:** Grant critical  
**Effort:** ~2 days

**What it does:**  
Evaluates and displays the trustworthiness of every AI-generated response. Score is computed server-side, persisted in `messages.metadata`, and rendered as a badge next to each assistant message.

**Score model:**

```typescript
interface EvidenceScore {
  overall: number; // 0–100
  breakdown: {
    peer_reviewed_count: number;
    government_count: number;
    web_general_count: number;
    total_sources: number;
    avg_curated_trust: number | null;
    used_fallback: boolean;
    primary_source_type: 'peer_reviewed' | 'government' | 'mixed' | 'web_general' | 'none';
  };
  label: 'High' | 'Moderate' | 'Low' | 'Insufficient';
  computed_at: string;
}
```

**Scoring algorithm:**

```
base = (peer_reviewed_count × 40 + government_count × 25) / max(total_sources, 1)
base = min(base, 75)
trust_bonus = avg_curated_trust != null ? (avg_curated_trust / 100) × 20 : 0
fallback_penalty = used_fallback ? 10 : 0
overall = clamp(round(base + trust_bonus - fallback_penalty), 0, 100)
```

Label thresholds: `≥70` → High · `≥45` → Moderate · `≥20` → Low · `<20` → Insufficient

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/agri/evidence-score.ts` | Pure scoring function + interfaces |
| `lib/agri/evidence-score.test.ts` | Vitest unit tests |
| `app/api/messages/[messageId]/evidence-score/route.ts` | GET endpoint (RLS enforced) |
| `components/artifact/evidence-score-badge.tsx` | Badge UI with HoverCard breakdown |

**Files to modify:**

| File | Change |
|------|--------|
| `lib/streaming/create-chat-stream-response.ts` | Fire-and-forget score computation after stream ends |
| Assistant message render component | Add `<EvidenceScoreBadge messageId={message.id} />` |

**UI spec:**
- Inline badge: colored dot + label + "X sources"
- On hover (Radix `HoverCard`): breakdown panel
- Icons: `solar:shield-check-bold` (High), `solar:shield-warning-bold` (Moderate), `solar:shield-cross-bold` (Low)
- Polling: fetch score with 2s delay, stop after 10s if null

**Data source:** `parts` table — count `source-url` and `source-document` parts, match domains against `sources.domain` + `sources.trust_score`

---

### 1.2 Export Response as Cited PDF

**Type:** Demo wow  
**Effort:** ~3 days

**What it does:**  
"Download as PDF" button on every assistant response. Generates a professionally formatted A4 report with the full answer, cited sources, evidence score, and a disclaimer. Suitable for printing and academic sharing.

**PDF structure:**

```
AgriEvidence logo + date
─────────────────────────
QUERY
[user's question]
─────────────────────────
ANSWER
[full answer text, markdown stripped]
─────────────────────────
EVIDENCE SCORE   [High / Moderate / ...]
X peer-reviewed · Y government · Z web general
─────────────────────────
SOURCES  (numbered)
[1] Title — domain.com
    Type: Research | Trust: 85/100
    Snippet (if available)
    URL
─────────────────────────
DISCLAIMER (8pt italic)
Page X of Y  |  agri-evidence.com
```

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/supabase/queries/export-message.ts` | `getMessageExportData()` — fetches message + parts + user query + curated source metadata |
| `app/api/messages/[messageId]/export-pdf/route.ts` | GET endpoint returning `MessageExportData` JSON |
| `lib/export/generate-pdf.ts` | `generateAndDownloadPDF()` — client-side PDF generation |
| `lib/hooks/use-export-pdf.ts` | Hook: fetch data → generate → toast feedback → analytics |
| `components/artifact/export-pdf-button.tsx` | Icon button with Radix Tooltip and loading state |

**Files to modify:**

| File | Change |
|------|--------|
| Assistant message render component | Add `<ExportPDFButton />` to message footer, right-aligned |

**PDF library priority:**
1. `@react-pdf/renderer` if installed → `pdf(element).toBlob()` then download
2. `window.print()` fallback → inject hidden print frame + `@media print` CSS

**Install if needed:**
```bash
bun add @react-pdf/renderer
```

**Analytics event:** `track('pdf_export', { messageId, label: score?.label ?? 'none' })`

---

### 1.3 Agricultural Season Indicator

**Type:** UX  
**Effort:** ~2 days

**What it does:**  
Contextualises responses against the user's current growing season based on `country_code` + `climate_zone` from `user_profiles`. Shows a banner: *"Seasonally relevant now"* or *"Off-season — plan ahead"*.

**Data already in DB:** `user_profiles.country_code`, `user_profiles.climate_zone`, `user_profiles.primary_crops`

**Season logic (Northern / Southern hemisphere aware):**

```typescript
interface SeasonContext {
  hemisphere: 'northern' | 'southern';
  current_season: 'spring' | 'summer' | 'autumn' | 'winter' | 'dry' | 'wet';
  is_planting_window: boolean;
  is_harvest_window: boolean;
  relevance: 'high' | 'low';
  message: string;
}
```

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/agri/season-context.ts` | `getSeasonContext(countryCode, climateZone, date): SeasonContext` |
| `lib/agri/season-context.test.ts` | Vitest tests for hemisphere detection and season mapping |
| `components/artifact/season-indicator.tsx` | Banner component rendered above answer |

**Files to modify:**

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Include season context in Researcher system prompt |
| Assistant message render component | Add `<SeasonIndicator />` conditionally when user profile has location |

---

### 1.4 Shortened Onboarding (3 Steps)

**Type:** UX  
**Effort:** ~1 day

**What it does:**  
Reduces the onboarding wizard friction to 3 essential steps. Additional profile fields are collected progressively in-app. Completion rate is a KPI for grant reporting.

**Current state:** Full wizard collects 7+ fields upfront  
**Target state:** Minimum viable — country + primary crop + farm type → set `onboarding_completed = true`

**Step structure:**

```
Step 1: Where do you farm?       → country_code (searchable select)
Step 2: What do you grow?        → primary_crops (multi-select, top 20 crops)
Step 3: What type of farm?       → farm_types (radio: crop / livestock / mixed / other)
```

**Files to modify:**

| File | Change |
|------|--------|
| `app/(app)/onboarding/page.tsx` | Reduce to 3 steps, defer remaining fields |
| `lib/agri/query-enricher.ts` | Gracefully handle partial profile (country + crop sufficient) |

**Metric to track:** `track('onboarding_completed', { steps_filled: n, skipped: bool })`

---

## Sprint 2 — Grant Demo Ready

**Goal:** Build the evidence of impact and demo infrastructure needed for grant applications and live pitches.

**Timeline:** ~3 weeks

---

### 2.1 Public Impact Dashboard

**Type:** Grant critical  
**Effort:** ~3 days

**What it does:**  
A public `/impact` page showing anonymised aggregate metrics. This URL goes directly into grant applications.

**Metrics to display:**

| Metric | Source |
|--------|--------|
| Total queries resolved | `COUNT(search_events)` |
| Countries reached | `COUNT(DISTINCT country_code) FROM search_events` |
| Top 10 crop topics | `search_events JOIN chat_topics JOIN topics` |
| Trusted source citations | `COUNT(parts WHERE type = 'source-document')` |
| Average evidence score | `AVG(messages.metadata->>'evidence_score'->>'overall')` |
| Monthly active users | `COUNT(DISTINCT user_id) WHERE created_at > now() - interval '30 days'` |

**Files to create:**

| File | Purpose |
|------|---------|
| `app/(marketing)/impact/page.tsx` | Public SSR page, revalidate every 6h |
| `lib/supabase/queries/impact-metrics.ts` | `getImpactMetrics(): ImpactMetrics` |
| `components/marketing/impact-dashboard.tsx` | Chart + stat card components |

**No auth required.** Uses Supabase `anon` client.

---

### 2.2 Demo Mode with Pre-filled Profile

**Type:** Demo wow  
**Effort:** ~1 day

**What it does:**  
A URL parameter `?demo=kenya-maize` that pre-populates a guest session with a realistic farmer profile. Zero friction for live pitches.

**Demo profiles to implement:**

| Param | Profile |
|-------|---------|
| `kenya-maize` | Kenya, maize farmer, semi-arid, 2ha |
| `india-wheat` | India (Punjab), wheat + rice, temperate, 5ha |
| `brazil-soy` | Brazil (Mato Grosso), soy, tropical, 50ha |
| `spain-olive` | Spain (Andalucía), olive + viticulture, mediterranean, 10ha |

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/config/demo-profiles.ts` | Static map of demo profile configs |
| `lib/hooks/use-demo-profile.ts` | Reads `?demo=` param, injects profile into session context |

**Files to modify:**

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Accept `X-Demo-Profile` header, use demo profile instead of DB profile |
| `middleware.ts` | Skip onboarding redirect when `?demo=` param present |

---

### 2.3 CGIAR / FAO / CIMMYT Sources

**Type:** Grant critical  
**Effort:** ~2 days (mostly data, minimal code)

**What it does:**  
Populates `sources` table with the top-tier agricultural research institutions. Immediately improves Evidence Scores for any query matching these domains.

**Sources to add (SQL seed):**

```sql
-- cgiar.org family
('CGIAR', 'cgiar.org', 'research', 95, true, true),
('CIMMYT', 'cimmyt.org', 'research', 95, true, true),
('IRRI', 'irri.org', 'research', 93, true, true),
('CIP', 'cipotato.org', 'research', 90, true, true),
('ICARDA', 'icarda.org', 'research', 90, true, true),
('WorldFish', 'worldfishcenter.org', 'research', 88, true, false),

-- UN / intergovernmental
('FAO', 'fao.org', 'government', 97, true, true),
('IFAD', 'ifad.org', 'government', 90, true, false),
('WFP', 'wfp.org', 'government', 88, true, false),

-- National extension services
('USDA', 'usda.gov', 'government', 92, true, true),
('USDA ARS', 'ars.usda.gov', 'research', 93, true, false),
('Rothamsted Research', 'rothamsted.ac.uk', 'research', 91, true, false),
('INRAE France', 'inrae.fr', 'research', 89, true, false),

-- Databases
('PubAg USDA', 'pubag.nal.usda.gov', 'database', 90, true, false),
('AGRIS FAO', 'agris.fao.org', 'database', 88, true, false),
('EPPO Global DB', 'gd.eppo.int', 'database', 87, true, true)
```

**Files to create:**

| File | Purpose |
|------|---------|
| `supabase/seed/002_trusted_sources.sql` | Full seed with all sources + source_topics mappings |

**Also update:** `sources` table entries for any existing rows without `logo_url` — fetch logos from Clearbit or use initials fallback in UI.

---

### 2.4 Enhanced Sharing with OG Preview

**Type:** Technical  
**Effort:** ~2 days

**What it does:**  
Public chat links (`visibility = 'public'`) get a dynamic Open Graph image showing the question + evidence score + source count. Enables organic sharing on Twitter/LinkedIn.

**OG image spec:**
- Size: 1200×630px
- Content: AgriEvidence logo + question text (max 120 chars) + "X sources · Evidence: High" badge
- Generated via Next.js `ImageResponse` (built-in, zero dependencies)

**Files to create:**

| File | Purpose |
|------|---------|
| `app/chat/[chatId]/opengraph-image.tsx` | Next.js `ImageResponse` dynamic OG image |

**Files to modify:**

| File | Change |
|------|--------|
| `app/chat/[chatId]/page.tsx` | Add `generateMetadata()` with `openGraph.images` pointing to OG route |

---

## Sprint 3 — Scale & Integrations

**Goal:** Unlock access for users without reliable internet, support agricultural field workers, and meet EU Horizon requirements.

**Timeline:** ~6–8 weeks

---

### 3.1 SMS / WhatsApp Fallback

**Type:** Grant critical  
**Effort:** ~2 weeks

**What it does:**  
Farmers without internet send an SMS to a dedicated number. The query is processed by the AgriEvidence Researcher agent, and a concise answer (max 480 chars) is sent back via SMS. Critical differentiator for Gates Foundation and CGIAR grants.

**Provider:** Africa's Talking (primary for Africa) + Twilio (global fallback)

**Architecture:**

```
Farmer SMS → Africa's Talking webhook
           → POST /api/webhooks/sms
           → extract phone + body
           → create anonymous chat session
           → run Researcher agent (Speed mode, SMS-optimised prompt)
           → truncate answer to 480 chars + top source URL
           → send reply SMS via Africa's Talking API
           → log to search_events with platform='sms'
```

**Files to create:**

| File | Purpose |
|------|---------|
| `app/api/webhooks/sms/route.ts` | Incoming SMS handler (Africa's Talking + Twilio format) |
| `lib/sms/africa-talking.ts` | Africa's Talking API client |
| `lib/sms/format-sms-response.ts` | Truncate + format answer for SMS (480 char limit) |
| `lib/streaming/create-sms-response.ts` | Non-streaming Researcher invocation for SMS context |

**Install:**
```bash
bun add africastalking
bun add twilio
```

**New env vars:**
```bash
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=
AFRICASTALKING_SMS_SHORTCODE=
TWILIO_ACCOUNT_SID=        # fallback
TWILIO_AUTH_TOKEN=         # fallback
TWILIO_PHONE_NUMBER=       # fallback
```

**Rate limiting:** Max 5 SMS per phone number per day (Redis-backed, same pattern as `guest-limit.ts`)

---

### 3.2 Extension Worker Mode

**Type:** Technical  
**Effort:** ~3 weeks

**What it does:**  
A dedicated mode for agricultural extension agents who serve multiple farmers. They can manage farmer profiles, share responses with clients, and generate per-farmer reports.

**New subscription tier:** `extension` (above `pro`, below `enterprise`)

**New DB table:** `farmer_clients`

```sql
CREATE TABLE farmer_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  country_code text,
  primary_crops text[] NOT NULL DEFAULT '{}',
  farm_size_ha numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: all operations own only (extension_worker_id = auth.uid())
```

**Files to create:**

| File | Purpose |
|------|---------|
| `supabase/migrations/010_farmer_clients.sql` | New table + RLS policies |
| `app/(app)/clients/page.tsx` | Client list page (extension workers only) |
| `app/(app)/clients/[clientId]/page.tsx` | Per-client chat history + shared reports |
| `lib/supabase/queries/farmer-clients.ts` | CRUD helpers |
| `components/clients/` | Client card, client selector, share modal |

**Files to modify:**

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Accept `X-Client-Id` header to contextualise Researcher prompt with farmer's profile |
| `lib/rate-limit/chat-limits.ts` | Higher limits for `extension` tier |

---

### 3.3 Copernicus / Weather Data Integration

**Type:** Grant critical (EU Horizon)  
**Effort:** ~1 week

**What it does:**  
Integrates real-time weather and climate data from the EU Copernicus Climate Data Store into query enrichment and responses. Required for EU Horizon Agri-food grant eligibility.

**API:** Copernicus CDS API (free for research projects)  
**Data used:** ERA5 reanalysis (temperature, precipitation, soil moisture) by lat/lon

**Architecture:**

```
User query + country_code
  → geocode country_code to lat/lon centroid
  → fetch 30-day weather summary from Copernicus CDS
  → inject weather context into Researcher system prompt:
    "Current conditions in [region]: avg temp X°C, rainfall Y mm/month,
     soil moisture: [normal/deficit/surplus]"
```

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/weather/copernicus-client.ts` | CDS API client with 1h cache |
| `lib/weather/format-weather-context.ts` | Format weather data for prompt injection |
| `lib/agri/country-centroids.ts` | Static map of country_code → lat/lon centroid |

**Files to modify:**

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Fetch + inject weather context for authenticated users with `country_code` |
| `lib/agents/researcher.ts` | Document weather context in system prompt template |

**New env var:**
```bash
COPERNICUS_CDS_API_KEY=
```

---

## Parallel.ai Integration Phases

These phases leverage existing Parallel.ai account features to build AgriEvidence-specific pipelines.

---

### Phase A — Monitor + Webhook (2–3 days)

**Activates:** `alert_subscriptions` table (currently in DB but non-functional)

**Setup in Parallel dashboard:**  
Configure Monitor tasks for:

| URL | Alert type |
|-----|-----------|
| `fao.org/agriculture/en/news` | disease, pest, regulation |
| `gd.eppo.int/taxon/pests` | pest |
| `usda.gov/topics/farming/crop-production` | market, research |
| `apps.fas.usda.gov/psdonline` | market |
| `phytosanitary.info/new-entries` | pest, disease |

**Webhook handler:**

```
POST /api/webhooks/parallel
  → validate Parallel signature (HMAC)
  → parse event: { url, title, summary, change_type, detected_at }
  → extract keywords from title + summary
  → query alert_subscriptions WHERE is_active = true
    AND keywords overlap with extracted keywords
    AND (regions is empty OR country_code overlaps)
  → for each matching subscription: dispatch notification
    via channel (email | push | webhook)
  → log to search_events with platform='monitor_alert'
```

**Files to create:**

| File | Purpose |
|------|---------|
| `app/api/webhooks/parallel/route.ts` | Webhook handler (POST, HMAC validation) |
| `lib/parallel/webhook-parser.ts` | Parse and validate Parallel webhook payload |
| `lib/notifications/dispatch.ts` | Route to email / push / webhook channel |

**New env var:**
```bash
PARALLEL_WEBHOOK_SECRET=
```

---

### Phase B — Extract Pipeline (3–4 days)

**Improves:** Evidence Score accuracy + `source-document` part quality

**What it does:**  
When the Researcher cites a URL, that URL is also sent to Parallel Extract with an agricultural JSON schema. The enriched metadata is saved back to the `source-document` part.

**Extraction schema:**

```json
{
  "title": "string",
  "authors": ["string"],
  "publication_year": "number | null",
  "institution": "string | null",
  "crops_mentioned": ["string"],
  "study_type": "field_trial | meta_analysis | review | case_study | policy | other",
  "key_conclusions": ["string"],
  "geographic_scope": "string | null",
  "evidence_quality": "high | medium | low"
}
```

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/parallel/extract-client.ts` | Parallel Extract API wrapper |
| `lib/parallel/agri-schema.ts` | Agricultural extraction JSON schema constant |
| `lib/agri/source-enricher.ts` | `enrichSourcePart(url, partId): Promise<void>` — fire-and-forget |

**Files to modify:**

| File | Change |
|------|--------|
| `lib/streaming/create-chat-stream-response.ts` | After saving parts, trigger `enrichSourcePart` for each `source-url` part |
| Evidence score algorithm | Factor in `evidence_quality` field from extraction if available |

---

### Phase C — FindAll for Source Discovery (1 week)

**Improves:** `sources` table coverage, reduces manual curation

**What it does:**  
Periodic job (weekly cron) uses Parallel FindAll to discover new relevant pages on trusted domains for each topic in `topics` table. Results go into an admin review queue before being added to `sources`.

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/parallel/findall-client.ts` | Parallel FindAll API wrapper |
| `scripts/discover-sources.ts` | CLI script: run per topic, write to review queue |
| `app/(app)/admin/source-queue/page.tsx` | Admin page to approve/reject discovered sources |
| `supabase/migrations/011_source_queue.sql` | `source_candidates` table for review queue |

---

### Phase D — Deep Research Mode (3–4 days)

**Adds:** "In-depth" search mode to complement Speed and Quality

**What it does:**  
Exposes Parallel Deep Research as a third search mode. Returns a multi-page structured report with primary sources, methodology notes, and confidence levels. Ideal for researchers and policy makers.

**Files to create:**

| File | Purpose |
|------|---------|
| `lib/parallel/deep-research-client.ts` | Parallel Deep Research API wrapper |
| `lib/streaming/create-deep-research-response.ts` | Streaming handler for deep research mode |
| `components/artifact/deep-research-report.tsx` | Multi-section report renderer |

**Files to modify:**

| File | Change |
|------|--------|
| `lib/config/search-modes.ts` | Add `deep_research` mode |
| `app/api/chat/route.ts` | Route `deep_research` mode to Parallel instead of Researcher agent |
| Search mode selector component | Add "In-depth" option with estimated time warning (~30–60s) |

---

## Grant Alignment Matrix

| Feature | EU Horizon | Gates Foundation | CGIAR Excellence | FAO / World Bank | EIC Accelerator |
|---------|-----------|-----------------|-----------------|-----------------|----------------|
| Evidence scoring | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF export | ✅ | — | ✅ | ✅ | — |
| CGIAR/FAO sources | ✅ | ✅ | ✅ | ✅ | — |
| Impact dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMS / WhatsApp | — | ✅ | ✅ | ✅ | — |
| Copernicus weather | ✅ | — | — | — | ✅ |
| Multilingual (7 langs) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Extension worker mode | — | ✅ | ✅ | ✅ | ✅ |
| Parallel Monitor alerts | ✅ | ✅ | ✅ | ✅ | — |

---

## Key Commands & Notes

```bash
# Development
bun dev                    # Start dev server (http://localhost:3000)
bun run build              # Production build
bun run test               # Vitest test suite
bun typecheck              # TypeScript check
bun lint                   # ESLint + import sort

# Database
bun run migrate            # Apply all migrations from supabase/migrations/
docker compose up -d       # Full local stack (PostgreSQL, Redis, SearXNG)

# Dependencies to add per sprint
bun add @react-pdf/renderer          # Sprint 1 — PDF export
bun add africastalking twilio        # Sprint 3 — SMS
```

### Environment variables summary

```bash
# Sprint 1 — no new vars needed

# Sprint 2
# no new vars

# Sprint 3
COPERNICUS_CDS_API_KEY=
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=
AFRICASTALKING_SMS_SHORTCODE=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Parallel.ai phases
PARALLEL_WEBHOOK_SECRET=
# PARALLEL_API_KEY already exists
```

### Database migrations order

```
001_extensions.sql          ✅ existing
002_core_tables.sql         ✅ existing
003_user_profiles.sql       ✅ existing
004_topics.sql              ✅ existing
005_sources.sql             ✅ existing
006_bookmarks.sql           ✅ existing
007_analytics.sql           ✅ existing
008_alerts.sql              ✅ existing
009_service_role_grants.sql ✅ existing
010_farmer_clients.sql      🔲 Sprint 3.2
011_source_queue.sql        🔲 Parallel Phase C
```

### Prompt index

Each feature above has a corresponding implementation prompt. Prompts are structured for use with Claude Code, Cursor, or any agentic coding tool with repo access.

| Feature | Prompt available |
|---------|-----------------|
| 1.1 Evidence Scoring | ✅ |
| 1.2 PDF Export | 🔲 |
| 1.3 Season Indicator | 🔲 |
| 1.4 Onboarding | 🔲 |
| 2.1 Impact Dashboard | 🔲 |
| 2.2 Demo Mode | 🔲 |
| 2.3 CGIAR Sources | 🔲 (SQL seed only) |
| 2.4 OG Sharing | 🔲 |
| 3.1 SMS | 🔲 |
| 3.2 Extension Worker | 🔲 |
| 3.3 Copernicus | 🔲 |
| Parallel A — Monitor | 🔲 |
| Parallel B — Extract | 🔲 |
| Parallel C — FindAll | 🔲 |
| Parallel D — Deep Research | 🔲 |

---

*AgriEvidence — Evidence-based agriculture for everyone.*