import { workflow, node, trigger, expr, ifElse, newCredential } from '@n8n/workflow-sdk';

const PAGE_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>Creator Discovery Engine</title>\n<style>\n  :root{\n    --bg:#000; --panel:#0a0a0b; --panel2:#101012; --line:#1e1e22;\n    --fg:#fafafa; --muted:#86868c; --dim:#5a5a61;\n    --ok:#4ade80; --warn:#fbbf24; --bad:#f87171; --accent:#fff;\n  }\n  *{box-sizing:border-box}\n  body{\n    margin:0; background:var(--bg); color:var(--fg);\n    font:15px/1.5 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Inter,Helvetica,Arial,sans-serif;\n    -webkit-font-smoothing:antialiased;\n  }\n  .wrap{max-width:1040px; margin:0 auto; padding:56px 24px 96px}\n  header{margin-bottom:44px}\n  h1{font-size:30px; letter-spacing:-.022em; font-weight:600; margin:0 0 8px}\n  .sub{color:var(--muted); font-size:14px; letter-spacing:.01em}\n  .sub b{color:var(--dim); font-weight:400}\n\n  .card{background:var(--panel); border:1px solid var(--line); border-radius:14px}\n\n  form{padding:20px; display:grid; grid-template-columns:1fr 168px 148px auto; gap:12px; align-items:end}\n  label{display:block; font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--dim); margin-bottom:7px}\n  input,select{\n    width:100%; background:var(--panel2); color:var(--fg);\n    border:1px solid var(--line); border-radius:9px; padding:11px 12px;\n    font:inherit; font-size:14px; outline:none;\n  }\n  input:focus,select:focus{border-color:#3a3a42}\n  button{\n    background:var(--accent); color:#000; border:0; border-radius:9px;\n    padding:12px 24px; font:inherit; font-weight:600; font-size:14px; cursor:pointer;\n    white-space:nowrap;\n  }\n  button:disabled{opacity:.45; cursor:default}\n\n  section{margin-top:22px}\n  .head{\n    display:flex; justify-content:space-between; align-items:baseline;\n    font-size:11px; text-transform:uppercase; letter-spacing:.09em;\n    color:var(--dim); padding:0 4px 10px;\n  }\n\n  .stages{padding:6px 0}\n  .stage{\n    display:grid; grid-template-columns:22px 1fr auto auto; gap:14px; align-items:center;\n    padding:11px 20px; border-bottom:1px solid var(--line);\n    opacity:0; transform:translateY(-3px); animation:in .22s ease forwards;\n  }\n  .stage:last-child{border-bottom:0}\n  @keyframes in{ to{opacity:1;transform:none} }\n  .mark{font-size:13px; text-align:center}\n  .mark.ok{color:var(--ok)} .mark.skip{color:var(--dim)} .mark.bad{color:var(--bad)}\n  .sname{font-weight:500}\n  .sdetail{color:var(--muted); font-size:13px; font-variant-numeric:tabular-nums}\n  .sms{color:var(--dim); font-size:12px; font-variant-numeric:tabular-nums; min-width:52px; text-align:right}\n\n  .tiles{display:grid; grid-template-columns:repeat(4,1fr); gap:12px}\n  .tile{padding:18px 20px}\n  .tval{font-size:27px; font-weight:600; letter-spacing:-.02em; font-variant-numeric:tabular-nums}\n  .tlab{font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--dim); margin-top:5px}\n\n  .grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px}\n  .cr{padding:18px 20px; display:flex; flex-direction:column; gap:11px}\n  .crtop{display:flex; justify-content:space-between; align-items:flex-start; gap:12px}\n  .handle{font-weight:600; letter-spacing:-.01em}\n  .fol{color:var(--muted); font-size:12.5px; margin-top:2px; font-variant-numeric:tabular-nums}\n  .score{font-size:21px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1}\n  .bar{height:3px; background:#17171a; border-radius:2px; overflow:hidden}\n  .bar i{display:block; height:100%; border-radius:2px}\n  .why{color:var(--muted); font-size:13px; line-height:1.5}\n  .crlink{font-size:12px; color:var(--dim); text-decoration:none}\n  .crlink:hover{color:var(--fg)}\n\n  .note{padding:18px 20px; color:var(--muted); font-size:14px}\n  .note.bad{color:var(--bad)}\n  .note.warn{color:var(--warn)}\n  .hide{display:none}\n  .elapsed{font-variant-numeric:tabular-nums}\n\n  @media(max-width:760px){\n    form{grid-template-columns:1fr; }\n    .tiles{grid-template-columns:repeat(2,1fr)}\n    .wrap{padding:36px 18px 72px}\n  }\n</style>\n</head>\n<body>\n<div class=\"wrap\">\n\n  <header>\n    <h1>Creator Discovery Engine</h1>\n    <div class=\"sub\">TikTok creator sourcing, scored for brand fit and synced to the CRM.\n      <b>&nbsp;·&nbsp; n8n &nbsp;·&nbsp; Apify &nbsp;·&nbsp; OpenAI &nbsp;·&nbsp; Airtable</b></div>\n  </header>\n\n  <div class=\"card\">\n    <form id=\"f\">\n      <div>\n        <label for=\"kw\">Keyword</label>\n        <input id=\"kw\" value=\"AI voiceover\" autocomplete=\"off\" spellcheck=\"false\">\n      </div>\n      <div>\n        <label for=\"mf\">Min followers</label>\n        <select id=\"mf\">\n          <option value=\"1000\">1,000</option>\n          <option value=\"10000\" selected>10,000</option>\n          <option value=\"50000\">50,000</option>\n          <option value=\"100000\">100,000</option>\n        </select>\n      </div>\n      <div>\n        <label for=\"mr\">Results cap</label>\n        <select id=\"mr\">\n          <option value=\"10\">10</option>\n          <option value=\"20\" selected>20</option>\n          <option value=\"40\">40</option>\n        </select>\n      </div>\n      <button id=\"go\" type=\"submit\">Run discovery</button>\n    </form>\n  </div>\n\n  <section id=\"runSec\" class=\"hide\">\n    <div class=\"head\"><span>Pipeline</span><span id=\"runState\" class=\"elapsed\"></span></div>\n    <div class=\"card\"><div class=\"stages\" id=\"stages\"></div></div>\n  </section>\n\n  <section id=\"errSec\" class=\"hide\">\n    <div class=\"card\"><div class=\"note bad\" id=\"errMsg\"></div></div>\n  </section>\n\n  <section id=\"tileSec\" class=\"hide\">\n    <div class=\"head\"><span>This run</span></div>\n    <div class=\"tiles\">\n      <div class=\"card tile\"><div class=\"tval\" id=\"t1\">0</div><div class=\"tlab\">Profiles scanned</div></div>\n      <div class=\"card tile\"><div class=\"tval\" id=\"t2\">0</div><div class=\"tlab\">New creators</div></div>\n      <div class=\"card tile\"><div class=\"tval\" id=\"t3\">0</div><div class=\"tlab\">Duplicates blocked</div></div>\n      <div class=\"card tile\"><div class=\"tval\" id=\"t4\">—</div><div class=\"tlab\">Avg fit score</div></div>\n    </div>\n  </section>\n\n  <section id=\"listSec\" class=\"hide\">\n    <div class=\"head\"><span>Creators</span><span id=\"listNote\"></span></div>\n    <div class=\"grid\" id=\"list\"></div>\n  </section>\n\n</div>\n\n<script>\n(function(){\n  var RUN_URL = window.location.pathname.replace(/\\/+$/,'') + '/run';\n  var f=document.getElementById('f'), go=document.getElementById('go');\n  var runSec=document.getElementById('runSec'), stages=document.getElementById('stages');\n  var runState=document.getElementById('runState');\n  var errSec=document.getElementById('errSec'), errMsg=document.getElementById('errMsg');\n  var tileSec=document.getElementById('tileSec'), listSec=document.getElementById('listSec');\n  var list=document.getElementById('list'), listNote=document.getElementById('listNote');\n  var timer=null, t0=0;\n\n  function show(el,on){ el.classList[on?'remove':'add']('hide'); }\n  function num(n){ return (n===null||n===undefined||isNaN(n)) ? '—' : Number(n).toLocaleString('en-US'); }\n  function esc(s){ var d=document.createElement('div'); d.textContent=(s===null||s===undefined)?'':String(s); return d.innerHTML; }\n  function scoreColor(v){ return v>=75?'var(--ok)':v>=50?'var(--warn)':'var(--bad)'; }\n\n  function tick(){\n    var s=((Date.now()-t0)/1000).toFixed(1);\n    runState.textContent='running · '+s+'s';\n  }\n\n  function reset(){\n    stages.innerHTML=''; list.innerHTML=''; listNote.textContent='';\n    show(errSec,false); show(tileSec,false); show(listSec,false); show(runSec,true);\n  }\n\n  function drawStages(arr){\n    stages.innerHTML='';\n    arr.forEach(function(s,i){\n      var row=document.createElement('div');\n      row.className='stage';\n      row.style.animationDelay=(i*90)+'ms';\n      var cls = s.status==='skipped' ? 'skip' : (s.status==='failed' ? 'bad' : 'ok');\n      var mk  = s.status==='skipped' ? '–' : (s.status==='failed' ? '×' : '✓');\n      row.innerHTML =\n        '<div class=\"mark '+cls+'\">'+mk+'</div>'+\n        '<div class=\"sname\">'+esc(s.name)+'</div>'+\n        '<div class=\"sdetail\">'+esc(s.detail||'')+'</div>'+\n        '<div class=\"sms\">'+(s.ms||s.ms===0 ? (s.ms+' ms') : '')+'</div>';\n      stages.appendChild(row);\n    });\n  }\n\n  function drawCreators(cs){\n    list.innerHTML='';\n    cs.forEach(function(c){\n      var v = (c.score===null||c.score===undefined) ? null : Number(c.score);\n      var col = v===null ? 'var(--dim)' : scoreColor(v);\n      var el=document.createElement('div');\n      el.className='card cr';\n      el.innerHTML =\n        '<div class=\"crtop\">'+\n          '<div><div class=\"handle\">@'+esc(c.handle)+'</div>'+\n          '<div class=\"fol\">'+num(c.followers)+' followers</div></div>'+\n          '<div class=\"score\" style=\"color:'+col+'\">'+(v===null?'—':v)+'</div>'+\n        '</div>'+\n        '<div class=\"bar\"><i style=\"width:'+(v===null?0:v)+'%;background:'+col+'\"></i></div>'+\n        '<div class=\"why\">'+esc(c.reasoning||'No reasoning returned.')+'</div>'+\n        (c.profileUrl ? '<a class=\"crlink\" href=\"'+esc(c.profileUrl)+'\" target=\"_blank\" rel=\"noopener\">View profile ↗</a>' : '');\n      list.appendChild(el);\n    });\n  }\n\n  f.addEventListener('submit', function(e){\n    e.preventDefault();\n    var body = {\n      keyword: document.getElementById('kw').value.trim(),\n      minFollowers: parseInt(document.getElementById('mf').value,10),\n      maxResults: parseInt(document.getElementById('mr').value,10)\n    };\n    if(!body.keyword){ return; }\n\n    reset();\n    go.disabled=true;\n    t0=Date.now(); tick(); timer=setInterval(tick,100);\n    drawStages([{name:'Running workflow',detail:'waiting for n8n',status:'ok'}]);\n\n    fetch(RUN_URL,{\n      method:'POST',\n      headers:{'Content-Type':'application/json'},\n      body:JSON.stringify(body)\n    })\n    .then(function(r){ return r.json().catch(function(){ throw new Error('Workflow returned a non-JSON response (HTTP '+r.status+').'); }); })\n    .then(function(d){\n      clearInterval(timer);\n      runState.textContent='done in '+((Date.now()-t0)/1000).toFixed(1)+'s';\n\n      if(d.halted){\n        drawStages(d.stages||[{name:'Kill switch',detail:'enabled — run halted',status:'skipped'}]);\n        errMsg.textContent='Kill switch is ON in Airtable. No scraping, no AI calls, no writes.';\n        errMsg.className='note warn';\n        show(errSec,true);\n        return;\n      }\n      if(d.error){\n        drawStages(d.stages||[]);\n        errMsg.textContent=d.error;\n        errMsg.className='note bad';\n        show(errSec,true);\n        return;\n      }\n\n      drawStages(d.stages||[]);\n      var s=d.summary||{};\n      document.getElementById('t1').textContent=num(s.scanned);\n      document.getElementById('t2').textContent=num(s.newCreators);\n      document.getElementById('t3').textContent=num(s.duplicatesBlocked);\n      document.getElementById('t4').textContent=(s.avgScore===null||s.avgScore===undefined)?'—':s.avgScore;\n      show(tileSec,true);\n\n      var cs=d.creators||[];\n      if(cs.length){\n        drawCreators(cs);\n        listNote.textContent='ranked by fit score';\n        show(listSec,true);\n      } else {\n        listNote.textContent='';\n        list.innerHTML='<div class=\"card note\">No new creators this run. Everything found was already in Airtable, or nothing cleared the follower threshold.</div>';\n        show(listSec,true);\n      }\n    })\n    .catch(function(err){\n      clearInterval(timer);\n      runState.textContent='failed';\n      drawStages([{name:'Request failed',detail:'',status:'failed'}]);\n      errMsg.textContent=String(err && err.message ? err.message : err);\n      errMsg.className='note bad';\n      show(errSec,true);\n    })\n    .then(function(){ go.disabled=false; });\n  });\n})();\n</script>\n</body>\n</html>\n";
const BASE = 'appREPLACE_WITH_BASE_ID';

const RUBRIC = [
  'You score TikTok creators on their fit for a paid partnership with ElevenLabs, an AI audio company.',
  'ElevenLabs makes text-to-speech, voice cloning, dubbing into 70+ languages, AI music, and voice agents.',
  'Their creator program wants people whose audience would plausibly use those tools.',
  '',
  'Score 0-100 using this rubric:',
  '85-100  already makes content about AI voice, TTS, dubbing, or AI content tooling',
  '70-84   creator economy, faceless content, video editing, voiceover, or audio production',
  '50-69   general AI, tech, or software audience, or heavily narration-driven content',
  '25-49   adjacent creative audience with no clear audio or AI hook',
  '0-24    no plausible connection',
  '',
  'Judge only from the bio text and follower count given. Never invent facts about a creator.',
  'If a bio is empty or uninformative, score no higher than 30 and say the bio was thin.',
  '',
  'Return strict JSON with a single key "scores", whose value is an array of objects.',
  'Each object has: handle (the exact handle from the input), score (integer 0-100), reasoning (one sentence, max 22 words, naming the specific signal you used).',
  'Include every handle from the input exactly once. If the input creator list is empty, return an empty scores array.'
].join('\n');

const NORMALIZE_CODE = [
  'const req = $("Read Request").first().json;',
  'const items = $input.all().map(function (i) { return i.json; });',
  'const byHandle = {};',
  'items.forEach(function (it) {',
  '  const a = it.authorMeta || it.author || it.user || it;',
  '  const raw = a.name || a.uniqueId || a.nickName || a.userName || a.handle || "";',
  '  const handle = String(raw).replace(/^@/, "").trim();',
  '  if (!handle) { return; }',
  '  const key = handle.toLowerCase();',
  '  const fRaw = a.fans != null ? a.fans : (a.followers != null ? a.followers : (a.followerCount != null ? a.followerCount : (a.stats && a.stats.followerCount)));',
  '  const followers = Number(fRaw) || 0;',
  '  const bRaw = a.signature != null ? a.signature : (a.bio != null ? a.bio : (a.desc != null ? a.desc : ""));',
  '  const bio = String(bRaw).replace(/\\s+/g, " ").trim();',
  '  const prev = byHandle[key];',
  '  const better = !prev || followers > prev.followers || (bio && !prev.bio);',
  '  if (better) { byHandle[key] = { handle: handle, followers: followers, bio: bio, profileUrl: "https://www.tiktok.com/@" + handle }; }',
  '});',
  'const profiles = Object.keys(byHandle).map(function (k) { return byHandle[k]; });',
  'const out = { t0: req.t0, tScrape: Date.now(), keyword: req.keyword, minFollowers: req.minFollowers, maxResults: req.maxResults, rawItemCount: items.length, profiles: profiles, profileCount: profiles.length };',
  'return [{ json: out }];'
].join('\n');

const FILTER_CODE = [
  'const p = $input.first().json;',
  'const passed = p.profiles.filter(function (x) { return x.followers >= p.minFollowers; });',
  'const extra = { tFilter: Date.now(), passed: passed, passedCount: passed.length, rejectedCount: p.profiles.length - passed.length };',
  'return [{ json: Object.assign({}, p, extra) }];'
].join('\n');

const DEDUPE_CODE = [
  'const prev = $("Filter By Follower Count").first().json;',
  'const RUBRIC = ' + JSON.stringify(RUBRIC) + ';',
  'const existing = {};',
  'let existingCount = 0;',
  '$input.all().forEach(function (i) {',
  '  const j = i.json || {};',
  '  const f = j.fields || {};',
  '  const h = j.Handle != null ? j.Handle : f.Handle;',
  '  if (h) { existing[String(h).replace(/^@/, "").toLowerCase().trim()] = true; existingCount++; }',
  '});',
  'const fresh = prev.passed.filter(function (c) { return !existing[c.handle.toLowerCase().trim()]; });',
  'const duplicatesBlocked = prev.passed.length - fresh.length;',
  'const capped = fresh.slice(0, prev.maxResults);',
  'const slim = capped.map(function (c) { return { handle: c.handle, followers: c.followers, bio: c.bio }; });',
  'const userPayload = JSON.stringify({ keyword: prev.keyword, creators: slim });',
  'const msgs = [];',
  'msgs.push({ role: "system", content: RUBRIC });',
  'msgs.push({ role: "user", content: userPayload });',
  'const openaiRequest = { model: "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: msgs };',
  'const extra = { tDedupe: Date.now(), existingCount: existingCount, newCreators: capped, newCount: capped.length, duplicatesBlocked: duplicatesBlocked, openaiRequest: openaiRequest };',
  'return [{ json: Object.assign({}, prev, extra) }];'
].join('\n');

const BUILD_RESULT_CODE = [
  'const d = $("Remove Duplicates").first().json;',
  'const tScore = Date.now();',
  'let scores = [];',
  'let aiError = null;',
  'try {',
  '  const msg = $input.first().json;',
  '  const hasChoice = msg && msg.choices && msg.choices[0] && msg.choices[0].message;',
  '  const content = hasChoice ? msg.choices[0].message.content : "{}";',
  '  const parsed = JSON.parse(content);',
  '  scores = Array.isArray(parsed.scores) ? parsed.scores : (Array.isArray(parsed) ? parsed : []);',
  '} catch (e) { aiError = String(e.message || e); scores = []; }',
  'const byHandle = {};',
  'scores.forEach(function (s) { if (s && s.handle) { byHandle[String(s.handle).replace(/^@/, "").toLowerCase().trim()] = s; } });',
  'const creators = d.newCreators.map(function (c) {',
  '  const s = byHandle[c.handle.toLowerCase().trim()];',
  '  let score = null;',
  '  const hasScore = s && s.score !== undefined && s.score !== null && !isNaN(Number(s.score));',
  '  if (hasScore) { score = Math.max(0, Math.min(100, Math.round(Number(s.score)))); }',
  '  const why = s && s.reasoning ? String(s.reasoning) : "Not scored.";',
  '  return { handle: c.handle, followers: c.followers, bio: c.bio, profileUrl: c.profileUrl, score: score, reasoning: why };',
  '});',
  'creators.sort(function (a, b) { return (b.score === null ? -1 : b.score) - (a.score === null ? -1 : a.score); });',
  'const scored = creators.filter(function (c) { return c.score !== null; });',
  'const avgScore = scored.length ? Math.round(scored.reduce(function (t, c) { return t + c.score; }, 0) / scored.length) : null;',
  'const ms = function (a, b) { return Math.max(0, Math.round(b - a)); };',
  'const minLabel = Number(d.minFollowers).toLocaleString("en-US");',
  'const dupeNote = d.duplicatesBlocked ? (" (" + d.duplicatesBlocked + " blocked)") : "";',
  'const aiDetail = aiError ? ("parse failed: " + aiError) : (scored.length + "/" + creators.length + " scored");',
  'const stages = [];',
  'stages.push({ name: "Kill switch", detail: "clear", status: "ok" });',
  'stages.push({ name: "Apify TikTok scrape", detail: d.rawItemCount + " posts, " + d.profileCount + " unique profiles", ms: ms(d.t0, d.tScrape), status: "ok" });',
  'stages.push({ name: "Follower filter (min " + minLabel + ")", detail: d.profileCount + " to " + d.passedCount, ms: ms(d.tScrape, d.tFilter), status: "ok" });',
  'stages.push({ name: "Dedupe against Airtable", detail: d.passedCount + " to " + d.newCount + dupeNote, ms: ms(d.tFilter, d.tDedupe), status: "ok" });',
  'stages.push({ name: "AI brand-fit scoring", detail: aiDetail, ms: ms(d.tDedupe, tScore), status: aiError ? "failed" : "ok" });',
  'stages.push({ name: "Airtable write", detail: creators.length + " records created", status: creators.length ? "ok" : "skipped" });',
  'const summary = { scanned: d.profileCount, passedFilter: d.passedCount, newCreators: creators.length, duplicatesBlocked: d.duplicatesBlocked, avgScore: avgScore };',
  'const out = { halted: false, keyword: d.keyword, summary: summary, stages: stages, creators: creators };',
  'return [{ json: out }];'
].join('\n');

const SPLIT_CODE = [
  'const d = $("Build Result").first().json;',
  'const rows = d.creators || [];',
  'return rows.map(function (c) {',
  '  const r = {};',
  '  r.Handle = c.handle;',
  '  r["Profile URL"] = c.profileUrl;',
  '  r.Followers = c.followers;',
  '  r.Bio = c.bio;',
  '  r["Fit Score"] = c.score;',
  '  r["Score Reasoning"] = c.reasoning;',
  '  r["Discovered At"] = new Date().toISOString();',
  '  return { json: r };',
  '});'
].join('\n');

const HALTED_CODE = [
  'const kw = $("Read Request").first().json.keyword;',
  'const names = ["Kill switch", "Apify TikTok scrape", "Follower filter", "Dedupe against Airtable", "AI brand-fit scoring", "Airtable write"];',
  'const stages = names.map(function (n, i) {',
  '  const detail = i === 0 ? "enabled in Airtable - run halted" : "not run";',
  '  return { name: n, detail: detail, status: "skipped" };',
  '});',
  'const out = { halted: true, keyword: kw, stages: stages, creators: [] };',
  'return [{ json: out }];'
].join('\n');

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
  output: [{ choices: [{ message: { content: 'json string with scores array' } }] }]
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
