# SwissTaxSearch Subscription And Credits System

The plan structure and economics remain the same as the previous subscription design, but the feature language is now Swiss tax specific.

## Plans

| Plan |  Price | Monthly credits | Speed searches | Quality searches | Deep Research equivalent |
| ---- | -----: | --------------: | -------------: | ---------------: | -----------------------: |
| Free |  $0/mo |              20 |             20 |                5 |            Not available |
| Pro  |  $9/mo |             150 |            150 |               37 |            Not available |
| Plus | $29/mo |             500 |            500 |              125 |                       50 |
| Max  | $79/mo |           2,000 |          2,000 |              500 |                      200 |

Annual plans keep the same pricing convention: two months free.

## Credit Costs

| Operation            | Credits | Runtime status                   |
| -------------------- | ------: | -------------------------------- |
| Speed search         |       1 | Implemented                      |
| Quality search       |       4 | Implemented                      |
| Deep Research report |      10 | Schema-ready, UI/runtime roadmap |
| Alert notification   |       0 | Schema-ready, delivery roadmap   |

Credits are preflighted before streaming and deducted after a successful assistant response is saved. Failed or aborted streams do not consume credits.

## Credit Balances

`subscriptions` stores three spendable balances:

1. `topup_credits`
2. `rollover_credits`
3. `credits_balance`

`deduct_credits()` spends in that order and writes an append-only `credit_ledger` entry.

## Top-Up Packs

The same top-up pack design is retained for paid users:

| Pack          | Credits | Price |
| ------------- | ------: | ----: |
| Starter Pack  |      50 |    $3 |
| Growth Pack   |     150 |    $7 |
| Power Pack    |     400 |   $15 |
| Research Pack |   1,000 |   $30 |

Free users must upgrade before purchasing top-ups. Top-up purchase runtime and Polar webhook handling remain roadmap work.

## Feature Matrix

| Feature                                     |        Free        |   Pro   |      Plus      |        Max        |
| ------------------------------------------- | :----------------: | :-----: | :------------: | :---------------: |
| Official Swiss tax search                   |        Yes         |   Yes   |      Yes       |        Yes        |
| Federal/cantonal/municipal source filtering |        Yes         |   Yes   |      Yes       |        Yes        |
| Evidence Score badge                        |        Yes         |   Yes   |      Yes       |        Yes        |
| Swiss tax profile context                   |        Yes         |   Yes   |      Yes       |        Yes        |
| Quality mode                                | Limited by credits |   Yes   |      Yes       |        Yes        |
| Chat history                                |       7 days       | 90 days |     1 year     |     Unlimited     |
| Bookmarks and collections                   |         No         |   Yes   |      Yes       |        Yes        |
| Alert subscriptions                         |         No         |    3    |       15       |     Unlimited     |
| Deep Research mode                          |         No         |   No    |      Yes       |        Yes        |
| Webhook alerts                              |         No         |   No    |       No       |        Yes        |
| Priority support                            |     Community      |  Email  | Priority email | Dedicated support |

## Runtime Files

- `lib/subscriptions/credits.ts`: credit costs, preflight response, post-save deduction
- `app/api/chat/route.ts`: credit preflight for authenticated users
- `lib/streaming/helpers/persist-stream-results.ts`: calls deduction after the assistant response is saved
- `supabase/migrations/001_swisstaxsearch_schema.sql`: `subscriptions`, `credit_ledger`, `deduct_credits()`

## Remaining Billing Work

- Polar checkout and customer portal routes
- Polar webhook handler for subscription lifecycle and top-up packs
- Billing page with balance breakdown and ledger history
- Period reset job for monthly grants, rollover, and top-up expiry
