# Creator Program Automation — system map

**The demo page:** https://n8n.aiblackops.xyz/webhook/creator-discovery

Job post on the left, a live automation for each bullet on the right.

---

## Workflows

| Workflow | ID | Covers |
|---|---|---|
| [Creator Discovery Engine](https://n8n.aiblackops.xyz/workflow/x7shyIdcuDSWQrh2) | `x7shyIdcuDSWQrh2` | Serves the page · creator discovery |
| [Onboarding, Contracts, Reminders](https://n8n.aiblackops.xyz/workflow/TCHRsD8j6mjSqXLr) | `TCHRsD8j6mjSqXLr` | Welcome packet · contract PDF · deadline reminder |
| [Tracking, Aggregation, Reporting](https://n8n.aiblackops.xyz/workflow/lbtju5u8RYPJsbT3) | `lbtju5u8RYPJsbT3` | CRM read-back · content tracking · aggregation · weekly sheet |
| [Reliability Controls](https://n8n.aiblackops.xyz/workflow/NoIFp3SQVlVMm3D1) | `NoIFp3SQVlVMm3D1` | Kill switch from page · kill switch by Telegram |
| [Error Alert](https://n8n.aiblackops.xyz/workflow/uIMnegJRpl0KRsVh) | `uIMnegJRpl0KRsVh` | Global failure handler → Telegram |

All published.

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
| `POST /webhook/program/killswitch` | Flip the Airtable checkbox | ~1s |

Fast ones are safe to click live on camera. The two slow ones are worth pre-running.

---

## Airtable — [Creator Discovery](https://airtable.com/appWB9HEm79syOpyO) `appWB9HEm79syOpyO`

| Table | ID |
|---|---|
| `Creators` | `tblB7h8SohZ9JMPTz` |
| `Metrics` | `tbl5N9XgkarwFtSW8` |
| `Settings` | `tblCLR2VWBM9yCPJT` |

---

## Kill switch by Telegram — lives inside Jarvis

The command route was merged into your existing
[jarvis - telegram ai bot](https://n8n.aiblackops.xyz/workflow/H8UzKAyczOzIqknM)
(`H8UzKAyczOzIqknM`) rather than run as a second bot listener — Telegram allows only one webhook
per bot, so two triggers would have fought.

What changed in Jarvis:

- The classifier agent learned two new intents → outputs `kill creators` / `resume creators`
- The Switch gained two matching routes (outputs 5 and 6)
- New chain: `Find Creator Kill Switch` → `Build Creator Switch Patch` → `Flip Creator Kill Switch` → `Confirm Creator Switch`

Its four original routes — create video, normal message, unsafe, safe — are untouched.

**Jarvis is active** (since 2026-09-22). To activate it, its OpenRouter fallback models were
disconnected and disabled (no OpenRouter credential exists), and the Jarvis Telegram and Google
Sheets credentials were attached to the safe/unsafe route nodes. Kill/resume routes match with
`contains`, so stray quotes from the classifier don't break them.

Both the page button and the Jarvis command send a Telegram confirmation when the switch flips.

The duplicate trigger I had built in the Reliability workflow has been removed, so nothing
competes for the bot.

---

## Verified working

- Contract → real PDF delivered on Telegram
- Onboarding and reminder → Telegram
- Tracking → 15 real posts with live links into `Metrics`
- Aggregation → 1,207,468 views across 15 posts, per-creator breakdown
- Report → [live spreadsheet](https://docs.google.com/spreadsheets/d/16nPXucbJ6IKPX4J8sp9qDol5IjHwZ9hbQEalVeWO9us/edit)
- Kill switch → flip on, discovery halts, flip off
- CRM read-back → 13 profiles

Untested: the Telegram kill command (node disabled), and the failure alert.

---

## Recording notes

Order follows the page top to bottom, which is the job post's own order.

Intro: *"I found this role interesting, so I automated a simplified version of it."*

Then walk down. The left column is the brief, the right column is the answer. Cut or speed up
the two slow runs.

Ten rows, every one backed by a live workflow. The finance bullets — ROI, invoicing, payment
alerts — are not on the page at all.
