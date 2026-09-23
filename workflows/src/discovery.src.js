import { workflow, node, trigger, expr, ifElse, newCredential } from '@n8n/workflow-sdk';

const PAGE_HTML = '__PAGE_HTML__';
const BASE = 'appREPLACE_WITH_BASE_ID';

const NORMALIZE_CODE =
  'const req = $("Read Request").first().json;\n' +
  'const items = $input.all().map(function (i) { return i.json; });\n' +
  'const byHandle = {};\n' +
  'items.forEach(function (it) {\n' +
  '  const a = it.authorMeta || it.author || it.user || it;\n' +
  '  const raw = a.name || a.uniqueId || a.nickName || a.userName || a.handle || "";\n' +
  '  const handle = String(raw).replace(/^@/, "").trim();\n' +
  '  if (!handle) { return; }\n' +
  '  const key = handle.toLowerCase();\n' +
  '  const fRaw = a.fans != null ? a.fans : (a.followers != null ? a.followers : (a.followerCount != null ? a.followerCount : (a.stats && a.stats.followerCount)));\n' +
  '  const followers = Number(fRaw) || 0;\n' +
  '  const bRaw = a.signature != null ? a.signature : (a.bio != null ? a.bio : (a.desc != null ? a.desc : ""));\n' +
  '  const bio = String(bRaw).replace(/\\s+/g, " ").trim();\n' +
  '  const prev = byHandle[key];\n' +
  '  const better = !prev || followers > prev.followers || (bio && !prev.bio);\n' +
  '  if (better) { byHandle[key] = { handle: handle, followers: followers, bio: bio, profileUrl: "https://www.tiktok.com/@" + handle }; }\n' +
  '});\n' +
  'const profiles = Object.keys(byHandle).map(function (k) { return byHandle[k]; });\n' +
  'const out = { t0: req.t0, tScrape: Date.now(), keyword: req.keyword, minFollowers: req.minFollowers, maxResults: req.maxResults, rawItemCount: items.length, profiles: profiles, profileCount: profiles.length };\n' +
  'return [{ json: out }];';

const FILTER_CODE =
  'const p = $input.first().json;\n' +
  'const passed = p.profiles.filter(function (x) { return x.followers >= p.minFollowers; });\n' +
  'const extra = { tFilter: Date.now(), passed: passed, passedCount: passed.length, rejectedCount: p.profiles.length - passed.length };\n' +
  'return [{ json: Object.assign({}, p, extra) }];';

const DEDUPE_CODE =
  'const prev = $("Filter By Follower Count").first().json;\n' +
  'const RUBRIC = "You score TikTok creators on their fit for a paid partnership with ElevenLabs, an AI audio company. ' +
  'ElevenLabs makes text-to-speech, voice cloning, dubbing into 70+ languages, AI music, and voice agents. ' +
  'Their creator program wants people whose audience would plausibly use those tools. ' +
  'Score each creator 0-100 using this rubric. ' +
  '85-100: already makes content about AI voice, TTS, dubbing, or AI content tooling. ' +
  '70-84: creator economy, faceless content, video editing, voiceover, or audio production. ' +
  '50-69: general AI, tech, or software audience, or heavily narration-driven content. ' +
  '25-49: adjacent creative audience with no clear audio or AI hook. ' +
  '0-24: no plausible connection. ' +
  'Judge only from the bio text and follower count given. Never invent facts about a creator. ' +
  'If a bio is empty or uninformative, score no higher than 30 and say the bio was thin. ' +
  'Return strict JSON with a single key called scores, whose value is an array of objects. ' +
  'Each object has three keys: handle (the exact handle from the input), score (integer 0-100), and reasoning ' +
  '(one sentence, max 22 words, naming the specific signal you used). ' +
  'Include every handle from the input exactly once. If the input creator list is empty, return an empty scores array.";\n' +
  'const existing = {};\n' +
  'let existingCount = 0;\n' +
  '$input.all().forEach(function (i) {\n' +
  '  const j = i.json || {};\n' +
  '  const f = j.fields || {};\n' +
  '  const h = j.Handle != null ? j.Handle : f.Handle;\n' +
  '  if (h) { existing[String(h).replace(/^@/, "").toLowerCase().trim()] = true; existingCount++; }\n' +
  '});\n' +
  'const fresh = prev.passed.filter(function (c) { return !existing[c.handle.toLowerCase().trim()]; });\n' +
  'const duplicatesBlocked = prev.passed.length - fresh.length;\n' +
  'const capped = fresh.slice(0, prev.maxResults);\n' +
  'const slim = capped.map(function (c) { return { handle: c.handle, followers: c.followers, bio: c.bio }; });\n' +
  'const userPayload = JSON.stringify({ keyword: prev.keyword, creators: slim });\n' +
  'const msgs = [];\n' +
  'msgs.push({ role: "system", content: RUBRIC });\n' +
  'msgs.push({ role: "user", content: userPayload });\n' +
  'const openaiRequest = { model: "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: msgs };\n' +
  'const extra = { tDedupe: Date.now(), existingCount: existingCount, newCreators: capped, newCount: capped.length, duplicatesBlocked: duplicatesBlocked, openaiRequest: openaiRequest };\n' +
  'return [{ json: Object.assign({}, prev, extra) }];';

const BUILD_RESULT_CODE =
  'const d = $("Remove Duplicates").first().json;\n' +
  'const tScore = Date.now();\n' +
  'let scores = [];\n' +
  'let aiError = null;\n' +
  'try {\n' +
  '  const msg = $input.first().json;\n' +
  '  const hasChoice = msg && msg.choices && msg.choices[0] && msg.choices[0].message;\n' +
  '  const content = hasChoice ? msg.choices[0].message.content : "{}";\n' +
  '  const parsed = JSON.parse(content);\n' +
  '  scores = Array.isArray(parsed.scores) ? parsed.scores : (Array.isArray(parsed) ? parsed : []);\n' +
  '} catch (e) { aiError = String(e.message || e); scores = []; }\n' +
  'const byHandle = {};\n' +
  'scores.forEach(function (s) { if (s && s.handle) { byHandle[String(s.handle).replace(/^@/, "").toLowerCase().trim()] = s; } });\n' +
  'const creators = d.newCreators.map(function (c) {\n' +
  '  const s = byHandle[c.handle.toLowerCase().trim()];\n' +
  '  let score = null;\n' +
  '  const hasScore = s && s.score !== undefined && s.score !== null && !isNaN(Number(s.score));\n' +
  '  if (hasScore) { score = Math.max(0, Math.min(100, Math.round(Number(s.score)))); }\n' +
  '  const why = s && s.reasoning ? String(s.reasoning) : "Not scored.";\n' +
  '  return { handle: c.handle, followers: c.followers, bio: c.bio, profileUrl: c.profileUrl, score: score, reasoning: why };\n' +
  '});\n' +
  'creators.sort(function (a, b) { return (b.score === null ? -1 : b.score) - (a.score === null ? -1 : a.score); });\n' +
  'const scored = creators.filter(function (c) { return c.score !== null; });\n' +
  'const avgScore = scored.length ? Math.round(scored.reduce(function (t, c) { return t + c.score; }, 0) / scored.length) : null;\n' +
  'const ms = function (a, b) { return Math.max(0, Math.round(b - a)); };\n' +
  'const minLabel = Number(d.minFollowers).toLocaleString("en-US");\n' +
  'const dupeNote = d.duplicatesBlocked ? (" (" + d.duplicatesBlocked + " blocked)") : "";\n' +
  'const aiDetail = aiError ? ("parse failed: " + aiError) : (scored.length + "/" + creators.length + " scored");\n' +
  'const stages = [];\n' +
  'stages.push({ name: "Kill switch", detail: "clear", status: "ok" });\n' +
  'stages.push({ name: "Apify TikTok scrape", detail: d.rawItemCount + " posts, " + d.profileCount + " unique profiles", ms: ms(d.t0, d.tScrape), status: "ok" });\n' +
  'stages.push({ name: "Follower filter (min " + minLabel + ")", detail: d.profileCount + " to " + d.passedCount, ms: ms(d.tScrape, d.tFilter), status: "ok" });\n' +
  'stages.push({ name: "Dedupe against Airtable", detail: d.passedCount + " to " + d.newCount + dupeNote, ms: ms(d.tFilter, d.tDedupe), status: "ok" });\n' +
  'stages.push({ name: "AI brand-fit scoring", detail: aiDetail, ms: ms(d.tDedupe, tScore), status: aiError ? "failed" : "ok" });\n' +
  'stages.push({ name: "Airtable write", detail: creators.length + " records created", status: creators.length ? "ok" : "skipped" });\n' +
  'const summary = { scanned: d.profileCount, passedFilter: d.passedCount, newCreators: creators.length, duplicatesBlocked: d.duplicatesBlocked, avgScore: avgScore };\n' +
  'const out = { halted: false, keyword: d.keyword, summary: summary, stages: stages, creators: creators };\n' +
  'return [{ json: out }];';

const SPLIT_CODE =
  'const d = $("Build Result").first().json;\n' +
  'const rows = d.creators || [];\n' +
  'return rows.map(function (c) {\n' +
  '  const r = {};\n' +
  '  r.Handle = c.handle;\n' +
  '  r["Profile URL"] = c.profileUrl;\n' +
  '  r.Followers = c.followers;\n' +
  '  r.Bio = c.bio;\n' +
  '  r["Fit Score"] = c.score;\n' +
  '  r["Score Reasoning"] = c.reasoning;\n' +
  '  r["Discovered At"] = new Date().toISOString();\n' +
  '  return { json: r };\n' +
  '});';

const HALTED_CODE =
  'const kw = $("Read Request").first().json.keyword;\n' +
  'const names = ["Kill switch", "Apify TikTok scrape", "Follower filter", "Dedupe against Airtable", "AI brand-fit scoring", "Airtable write"];\n' +
  'const stages = names.map(function (n, i) {\n' +
  '  const detail = i === 0 ? "enabled in Airtable - run halted" : "not run";\n' +
  '  return { name: n, detail: detail, status: "skipped" };\n' +
  '});\n' +
  'const out = { halted: true, keyword: kw, stages: stages, creators: [] };\n' +
  'return [{ json: out }];';

const pageWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'GET Demo Page',
    parameters: { httpMethod: 'GET', path: 'creator-discovery', responseMode: 'responseNode', options: {} },
    position: [-240, 0]
  },
  output: [{ headers: {}, query: {}, body: {} }]
});

const respondPage = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond With Page',
    parameters: {
      respondWith: 'text',
      responseBody: PAGE_HTML,
      options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }] } }
    },
    position: [0, 0]
  }
});

const runWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Receive Discovery Request',
    parameters: { httpMethod: 'POST', path: 'creator-discovery/run', responseMode: 'responseNode', options: { allowedOrigins: '*' } },
    position: [-240, 260]
  },
  output: [{ body: { keyword: 'AI voiceover', minFollowers: 10000, maxResults: 20 } }]
});

const readRequest = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Read Request',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'kw', name: 'keyword', value: expr('{{ ($json.body && $json.body.keyword) || ($json.query && $json.query.keyword) || "AI voiceover" }}'), type: 'string' },
          { id: 'mf', name: 'minFollowers', value: expr('{{ Number(($json.body && $json.body.minFollowers) || 10000) }}'), type: 'number' },
          { id: 'mr', name: 'maxResults', value: expr('{{ Number(($json.body && $json.body.maxResults) || 20) }}'), type: 'number' },
          { id: 'ts', name: 't0', value: expr('{{ Date.now() }}'), type: 'number' }
        ]
      },
      options: {}
    },
    position: [-40, 260]
  },
  output: [{ keyword: 'AI voiceover', minFollowers: 10000, maxResults: 20, t0: 1757600000000 }]
});

const readKillSwitch = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Read Kill Switch',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, mode: 'id', value: BASE },
      table: { __rl: true, mode: 'id', value: 'Settings' },
      filterByFormula: '{Key} = "KILL_SWITCH"',
      returnAll: true,
      options: {}
    },
    credentials: { airtableTokenApi: newCredential('Airtable PAT') },
    alwaysOutputData: true,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 1000,
    position: [160, 260]
  },
  output: [{ id: 'rec1', Key: 'KILL_SWITCH', Enabled: false }]
});

const killSwitchOff = ifElse({
  version: 2.3,
  config: {
    name: 'Kill Switch Off?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            id: 'ks',
            leftValue: expr('{{ ($json.Enabled === true) || ($json.fields && $json.fields.Enabled === true) }}'),
            operator: { type: 'boolean', operation: 'equals' },
            rightValue: false
          }
        ],
        combinator: 'and'
      },
      looseTypeValidation: true,
      options: {}
    },
    position: [360, 260]
  }
});

const buildHalted = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Halted Response',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: HALTED_CODE },
    position: [560, 480]
  },
  output: [{ halted: true, keyword: 'AI voiceover', stages: [], creators: [] }]
});

const respondHalted = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Halted',
    parameters: { respondWith: 'firstIncomingItem', options: {} },
    position: [760, 480]
  }
});

const scrapeTikTok = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Scrape TikTok Profiles',
    parameters: {
      method: 'POST',
      url: 'https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ searchQueries: [$("Read Request").first().json.keyword], resultsPerPage: $("Read Request").first().json.maxResults, shouldDownloadVideos: false, shouldDownloadCovers: false, shouldDownloadSubtitles: false, shouldDownloadSlideshowImages: false, shouldDownloadAvatars: false, proxyCountryCode: "None" }) }}'),
      options: { timeout: 300000 }
    },
    credentials: { httpBearerAuth: newCredential('Apify API Token') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    position: [560, 160]
  },
  output: [{ authorMeta: { name: 'voicecraftai', fans: 148000, signature: 'AI voiceover tutorials daily' } }]
});

const normalizeProfiles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Profiles',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: NORMALIZE_CODE },
    position: [760, 160]
  },
  output: [{ keyword: 'AI voiceover', minFollowers: 10000, maxResults: 20, rawItemCount: 47, profileCount: 31, profiles: [] }]
});

const filterFollowers = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Filter By Follower Count',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: FILTER_CODE },
    position: [960, 160]
  },
  output: [{ passedCount: 22, rejectedCount: 9, passed: [] }]
});

const loadExisting = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Load Existing Creators',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, mode: 'id', value: BASE },
      table: { __rl: true, mode: 'id', value: 'Creators' },
      returnAll: true,
      options: { fields: ['Handle'] }
    },
    credentials: { airtableTokenApi: newCredential('Airtable PAT') },
    alwaysOutputData: true,
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 1000,
    position: [1160, 160]
  },
  output: [{ id: 'rec2', Handle: 'voicecraftai' }]
});

const removeDuplicates = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Remove Duplicates',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: DEDUPE_CODE },
    position: [1360, 160]
  },
  output: [{ newCount: 18, duplicatesBlocked: 4, newCreators: [], openaiRequest: {} }]
});

const scoreBrandFit = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Score Brand Fit With AI',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.openaiRequest) }}'),
      options: { timeout: 180000 }
    },
    credentials: { openAiApi: { id: 'qz1aPMdRI6yojE5Z', name: 'OpenAi account' } },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    position: [1560, 160]
  },
  output: [{ choices: [{ message: { content: 'json string containing a scores array' } }] }]
});

const buildResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Result',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: BUILD_RESULT_CODE },
    position: [1760, 160]
  },
  output: [{ halted: false, keyword: 'AI voiceover', summary: { scanned: 31, newCreators: 18, duplicatesBlocked: 4, avgScore: 71 }, stages: [], creators: [] }]
});

const splitCreators = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Split Creators For Airtable',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: SPLIT_CODE },
    position: [1960, 0]
  },
  output: [{ Handle: 'voicecraftai', Followers: 148000 }]
});

const saveCreators = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.2,
  config: {
    name: 'Save Creators To Airtable',
    parameters: {
      resource: 'record',
      operation: 'create',
      base: { __rl: true, mode: 'id', value: BASE },
      table: { __rl: true, mode: 'id', value: 'Creators' },
      columns: { mappingMode: 'autoMapInputData', value: null, matchingColumns: [], schema: [] },
      options: { typecast: true }
    },
    credentials: { airtableTokenApi: newCredential('Airtable PAT') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 1000,
    position: [2160, 0]
  },
  output: [{ id: 'rec9', Handle: 'voicecraftai' }]
});

const respondResults = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond With Results',
    parameters: { respondWith: 'firstIncomingItem', options: {} },
    position: [1960, 200]
  }
});

const sendSummary = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send Run Summary',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: 'REPLACE_WITH_YOUR_CHAT_ID',
      text: expr('Creator Discovery finished\n\n'
        + 'Keyword: {{ $json.keyword }}\n'
        + 'Profiles scanned: {{ $json.summary.scanned }}\n'
        + 'Passed follower filter: {{ $json.summary.passedFilter }}\n'
        + 'Duplicates blocked: {{ $json.summary.duplicatesBlocked }}\n'
        + 'New creators saved: {{ $json.summary.newCreators }}\n'
        + 'Average fit score: {{ $json.summary.avgScore }}'),
      additionalFields: { appendAttribution: false }
    },
    credentials: { telegramApi: { id: 'kOtQXJDJnxBOh3Y9', name: 'Jarvis' } },
    onError: 'continueRegularOutput',
    position: [1960, 400]
  },
  output: [{ ok: true }]
});

export default workflow('creator-discovery-engine', 'Creator Discovery Engine')
  .add(pageWebhook)
  .to(respondPage)
  .add(runWebhook)
  .to(readRequest)
  .to(readKillSwitch)
  .to(killSwitchOff
    .onTrue(
      scrapeTikTok
        .to(normalizeProfiles)
        .to(filterFollowers)
        .to(loadExisting)
        .to(removeDuplicates)
        .to(scoreBrandFit)
        .to(buildResult)
    )
    .onFalse(buildHalted.to(respondHalted))
  )
  .add(buildResult)
  .to(splitCreators.to(saveCreators))
  .add(buildResult)
  .to(respondResults)
  .add(buildResult)
  .to(sendSummary);
