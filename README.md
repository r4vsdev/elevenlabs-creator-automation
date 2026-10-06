# ElevenLabs Creator Program Automation

A demo for the ElevenLabs **Automations Engineer** application. The job post is on the left of
the page; on the right, a button that runs a live n8n workflow doing that task.

**The page:** https://n8n.aiblackops.xyz/webhook/creator-discovery. n8n serves it from a
webhook, so the page and its API calls share one origin. `site/index.html` is the editable
source. Opened from disk, it falls back to calling that host.

The deliverable is a Loom recording. Nothing here runs on a schedule.

---

## Workflows

Exported from the live instance into `workflows/`. Import them through n8n's **Import from file**.

| File | Workflow | Covers |
|---|---|---|
| `01-demo-page-and-discovery.json` | Creator Program - Demo Page & Discovery | Serves the page · creator discovery |
| `02-onboarding-contracts-reminders.json` | Creator Program - Onboarding, Contracts, Reminders | Welcome packet · contract PDF · deadline reminder |
| `03-tracking-aggregation-reporting.json` | Creator Program - Tracking, Aggregation, Reporting | CRM read-back and clear · content tracking · aggregation · weekly sheet |
| `04-reliability-controls.json` | Creator Program - Reliability Controls | Kill switch from the page |
| `05-error-alert.json` | Creator Program - Error Alert | Global failure handler → Telegram |
| `06-jarvis-telegram-bot.json` | jarvis - telegram ai bot | Personal bot; also owns the kill switch by Telegram |

Exports carry credential **references** only, never secrets. After import, reconnect:

| Credential | Used by |
|---|---|
| Airtable personal access token (`data.records:read`, `data.records:write`) | CRM, metrics, kill switch |
| Apify API token (HTTP Bearer) | TikTok scraping |
| OpenAI | Brand-fit scoring, Jarvis classifier |
| Telegram bot | Every notification |
| Google Sheets OAuth2 | Weekly report |

Hardcoded in nodes (set your own after import): Airtable base `appWB9HEm79syOpyO` and table ids, Telegram chat ID `YOUR_TELEGRAM_CHAT_ID`, and in `06` the Google Sheet `YOUR_GOOGLE_SHEET_ID`.

---

## Endpoints

| Route | Does | Speed |
|---|---|---|
| `GET /webhook/creator-discovery` | Serves the page | instant |
| `POST /webhook/creator-discovery/run` | Scrape, filter, dedupe, AI score, write to CRM | ~50s |
| `POST /webhook/program/crm` | Reads the Creators table back | ~1s |
| `POST /webhook/program/crm-clear` | Deletes every row in Creators (page asks to confirm) | ~2s |
| `POST /webhook/program/onboarding` | Welcome packet → Telegram | ~2s |
| `POST /webhook/program/contract` | Merge terms → PDF → Telegram | ~2s |
| `POST /webhook/program/reminder` | Deadline reminder → Telegram | ~2s |
| `POST /webhook/program/tracking` | Scrape top 3 creators' posts → Metrics | ~40s |
| `POST /webhook/program/aggregate` | Roll Metrics into totals | ~1s |
| `POST /webhook/program/report` | Build a new Google Sheet | ~5s |
| `POST /webhook/program/killswitch` | Flip the Airtable checkbox → Telegram notice | ~2s |

---

## Airtable — base `appWB9HEm79syOpyO`

| Table | ID | Holds |
|---|---|---|
| `Creators` | `tblB7h8SohZ9JMPTz` | Discovered profiles, fit score, reasoning, contact email |
| `Metrics` | `tbl5N9XgkarwFtSW8` | Tracked posts with live links and counts |
| `Settings` | `tblCLR2VWBM9yCPJT` | One row, `KILL_SWITCH`, with an `Enabled` checkbox |

Discovery **dedupes against `Creators`**. Rerunning a keyword while its creators are still in the
table returns nothing new. That is the duplicate check working. **Clear the table** on the page
resets it.

---

## Kill switch

The pipeline reads `Settings.KILL_SWITCH` as its first step and exits before any scraping, AI
call or write. You can flip it three ways:

- **Page:** the *Flip the kill switch* button. The result card shows red **HALTED** or green
  **RUNNING**.
- **Telegram:** message the bot *"kill the creator workflows"* or *"resume the creator
  workflows"*.
- **Airtable:** tick the checkbox directly.

The page and Telegram routes both send a confirmation: 🔴 **KILL SWITCH ON** or 🟢 **KILL SWITCH
OFF**.

The Telegram route lives inside Jarvis because Telegram allows one webhook per bot. The Jarvis
classifier outputs `kill creators` / `resume creators`. The Switch matches with `contains`.
Jarvis's OpenRouter fallback models are disabled because no OpenRouter credential exists.

---

## Running it locally

n8n runs from npm on this PC behind a Cloudflare tunnel. Telegram's IPv6 route times out from
here, so n8n must prefer IPv4:

```bash
setx NODE_OPTIONS "--dns-result-order=ipv4first"
```

Start n8n from a new terminal after that. Without it, every Telegram send fails silently after
about 21s, because the send nodes carry on when delivery fails.

Close any open n8n editor tabs before workflows are changed through the API. An open tab can
autosave over the change.

---

## Status

Verified live: discovery, CRM read-back, contract PDF, onboarding and reminder on Telegram,
tracking, aggregation, report sheet, kill switch from the page with red/green Telegram notice.

Not yet confirmed: CRM clear (built, not clicked), the Jarvis kill/resume commands, the failure
alert.

## Recording notes

Walk the page top to bottom, which follows the job post's own order. Clear the table before the
first take. Cut or speed up the two slow runs (discovery, tracking). To show the dedupe, run a
keyword twice.
