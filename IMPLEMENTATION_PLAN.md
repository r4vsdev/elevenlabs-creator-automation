# Implementation Plan — Creator Discovery Engine

> **Status:** Phases 2–4 are built and live in n8n. Phase 1 (Airtable) and all credentials are
> yours to do — see [SETUP.md](SETUP.md), which supersedes this file for remaining work.
> Phase 0 was dropped (your n8n already runs). Phase 5 is the recording.

A demo for the ElevenLabs **Automations Engineer** application.

**The deliverable is a Loom recording.** Nothing is deployed, nothing is sent, nothing runs
unattended. The only question any decision answers is: does this make the video better.

On screen for most of the video: a local page where you type a keyword and watch real TikTok
creators come back scored. Cut to n8n and Airtable only to prove it is real.

---

## Stack

| Piece | Choice |
|---|---|
| Runtime | Your existing local n8n |
| Scrape | Apify TikTok actor |
| Scoring | OpenAI via HTTP Request node |
| CRM | Airtable |
| Alerts | Your existing Telegram bot |
| Page | Single local HTML file, opened from disk |

Not in scope: Docker, Postgres, fallback scraper, Google Sheets, Slack, Stripe, contracts,
e-signature, onboarding, invoicing, content tracking, weekly reports, schedule triggers, hosting,
README, clean-import checks.

---

## What you need before starting

| Service | What | Note |
|---|---|---|
| n8n | Running, reachable at `http://localhost:5678` | Already done |
| Airtable | **Personal Access Token** (`data.records:read`, `data.records:write`) + Base ID | Plain API keys were deprecated in 2024 — generate a PAT at airtable.com/create/tokens |
| Apify | API token | Free tier, $5/mo credit |
| OpenAI | API key | Already have |
| Telegram | Bot token + your chat ID | Bot already exists; get the chat ID from @userinfobot |

---

## Phase 1 — Airtable ~30 min

Two tables, built by hand.

- [ ] **Creators** — `Handle`, `Profile URL`, `Followers` (number), `Bio` (long text), `Fit Score` (number), `Score Reasoning` (long text), `Dedupe Key` (formula: `LOWER(Handle)`), `Discovered At` (datetime)
- [ ] **Settings** — `Key`, `Enabled` (checkbox). One row: `KILL_SWITCH` = false

Campaigns table dropped — the keyword and threshold come from the page form now, so a table
holding them is a step you would only be reading past on camera.

**Test:** an Airtable node in n8n reads Creators and returns rows.

---

## Phase 2 — Discovery workflow ~1.5 h

`workflows/01-creator-discovery.json` — I generate this, you import it.

- [ ] Webhook trigger, POST, CORS headers enabled
- [ ] Airtable → read `Settings.KILL_SWITCH`; IF enabled, respond `{halted: true}` and stop
- [ ] HTTP Request → Apify `run-sync-get-dataset-items`, keyword and cap from the request body
- [ ] Code node — normalize to `handle, profileUrl, followers, bio`
- [ ] Filter — `followers >= minFollowers`
- [ ] Airtable → fetch existing dedupe keys; Code node drops matches
- [ ] HTTP Request → OpenAI per creator, JSON mode, ElevenLabs-specific brand-fit rubric, returns `{"score": int, "reasoning": string}`
- [ ] Parse and clamp 0–100
- [ ] Airtable → create Creators rows
- [ ] Respond to Webhook → per-stage counts + the scored creators

Assuming `clockworks/tiktok-scraper`; actor ID confirmed live at build time.

**Test:** POST from curl. Real creators land in Airtable with scores and reasoning worth reading
aloud. Run again → zero new rows.

---

## Phase 3 — Two reliability beats ~30 min

Trimmed to what shows well on camera.

- [ ] **Kill switch** — already the first node from Phase 2. Just verify the halt path returns cleanly to the page
- [ ] **Retries** — `retryOnFail` + backoff on both HTTP nodes. Two checkboxes
- [ ] **Success message** — Telegram node at the end of the main workflow: keyword, per-stage counts, average score
- [ ] **Error alert** (`workflows/99-error-handler.json`) — two nodes, `Error Trigger` → `Telegram`. Sends workflow name, `{{$json.execution.lastNodeExecuted}}`, `{{$json.execution.error.message}}`
- [ ] Main workflow → Settings → Error Workflow → select the error handler
- [ ] Use n8n's native Telegram node, not raw HTTP — keeps the bot token in the credential store

**Gotcha:** n8n error workflows do not fire on manual canvas executions, only production ones.
The page POSTs to the webhook so this works — but only if the workflow is **activated** and the
page targets the production URL (`/webhook/...`), not `/webhook-test/...`.

**Test:** flip `KILL_SWITCH` → page shows halted, nothing written. Break the Apify credential,
run from the page → phone buzzes naming the node.

---

## Phase 4 — The page ~1.5 h

`site/index.html`, opened from disk. This is what the video is.

- [ ] ElevenLabs-adjacent styling — black, white, generous space, title only
- [ ] Form — keyword (typed live), min followers, results cap
- [ ] POST to the n8n webhook on localhost
- [ ] **Stage log** — renders the per-stage counts from the response: kill switch clear · Apify 47 profiles · filter 47→22 · dedupe 22→18 · scored 18/18 · written 18. This is the part that makes the pipeline legible without you narrating a node diagram
- [ ] Summary tiles — scanned, new, duplicates blocked, average score
- [ ] Creator cards ranked by score — handle, followers, score bar, AI reasoning, profile link
- [ ] Visible state for the halted case, so the kill-switch beat has something to show

**Test:** open from disk, run against local n8n, real results render.

---

## Phase 5 — Record ~45 min

Roughly 3 minutes, page-centric:

- [ ] **0:00** The page. Type the keyword, set the threshold, run
- [ ] **0:20** Stage log fills in — narrate the pipeline off it
- [ ] **0:50** Results render. Read one creator's score and reasoning aloud
- [ ] **1:20** Cut to n8n canvas — a few seconds, walking the nodes. This is what proves the page is not a mockup
- [ ] **1:40** Cut to Airtable — the rows are there
- [ ] **2:00** Run the same keyword again → duplicates blocked, zero new rows
- [ ] **2:20** Flip `KILL_SWITCH` in Airtable → run → page shows halted
- [ ] **2:40** In the Apify node URL, change the actor ID `clockworks/tiktok-scraper` → `clockworks/tiktok-scraperX`. Run from the page → Apify 404s → Telegram alert names the failing node. Ctrl+Z to restore
- [ ] **3:00** End on the results

Record the happy path start to finish first, then shoot the failure as a separate segment — that
way a messy break cannot cost you the good footage.

---

## Deliverables

1. `workflows/01-creator-discovery.json` — import into your n8n
2. `workflows/99-error-handler.json`
3. `site/index.html`
4. Airtable field list — in Phase 1 above, no separate doc

**Total ≈ 4 hours.**
