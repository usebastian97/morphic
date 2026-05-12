# SwissTaxSearch Development Roadmap

## Completed In Current Refactor

- [x] Replaced the old database migration set with `001_swisstaxsearch_schema.sql`
- [x] Added Swiss canton, tax topic, and official source seed data
- [x] Updated TypeScript DB types and Supabase query helpers for SwissTaxSearch
- [x] Replaced the previous domain prompt context with canton, municipality, taxpayer type, and language context
- [x] Added official-only Swiss tax query enrichment and search tooling
- [x] Restricted direct URL fetches to official Swiss tax/government domains
- [x] Updated evidence scoring to federal, cantonal, municipal, legal/form, news, and non-official breakdowns
- [x] Rebuilt onboarding and profile UI for Swiss tax context
- [x] Added runtime subscription credit preflight and post-save credit deduction
- [x] Updated subscription documentation while preserving the same plan economics

## In Progress

- [ ] Validate the destructive migration against a real Supabase database
- [ ] Add unit tests for `lib/swiss-tax/official-domain-policy.ts`
- [ ] Add unit tests for `lib/swiss-tax/official-source-score.ts`
- [ ] Add integration coverage for credit preflight and `deduct_credits()` handling
- [ ] Review all marketing copy and landing pages for SwissTaxSearch positioning

## Next Milestones

### Phase 1: Database Verification

- Run the migration on a clean database
- Confirm RLS policies for all app tables
- Confirm `handle_new_user()` creates both profile and subscription rows
- Confirm seed files load successfully

### Phase 2: Billing UI And Polar

- Add `/billing` page with current plan, credit balance, and ledger history
- Add Polar checkout and portal routes
- Add Polar webhook handler for subscription lifecycle and top-up packs
- Add monthly grant, rollover, and top-up expiry job

### Phase 3: Official Tax Alerts

- Implement alert delivery for `tax_alert_subscriptions`
- Add official source monitoring for federal and cantonal tax news
- Add alert quotas by plan

### Phase 4: Swiss Tax Product Polish

- Add canton comparison UI for answers involving multiple jurisdictions
- Add saved official sources and bookmarks UI
- Add public share previews tailored to SwissTaxSearch
- Add a public official-source coverage page

### Phase 5: Deep Research

- Add Plus/Max gated Deep Research mode
- Charge 10 credits per successful report
- Persist structured reports with source methodology and jurisdiction notes
