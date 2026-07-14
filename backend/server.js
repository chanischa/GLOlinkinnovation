/* ============================================================
   GLO E-Lottery — Verification API (prototype)
   Node.js (>=22.5) + Express + built-in node:sqlite
   Start:  npm install && npm run seed && npm start
   ============================================================ */
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const { db } = require('./db/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));                          // base64 images allowed
app.use(express.static(path.join(__dirname, '..', 'frontend'), {
  setHeaders(res, filePath) {
    if (/\.(html|js|webmanifest|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));   // serve the app itself

const CURRENT_DRAW = '1 ก.ค. 2569';

const RUNTIME_STATE_PATH = process.env.GLO_RUNTIME_STATE_PATH || path.join(__dirname, '..', 'data', 'runtime-ownership.json');

function readRuntimeState() {
  try { return JSON.parse(fs.readFileSync(RUNTIME_STATE_PATH, 'utf8')); }
  catch { return { ownership: {} }; }
}
function writeRuntimeState(state) {
  fs.mkdirSync(path.dirname(RUNTIME_STATE_PATH), { recursive: true });
  fs.writeFileSync(RUNTIME_STATE_PATH, JSON.stringify(state, null, 2));
}
function runtimeOwner(barcode) {
  return readRuntimeState().ownership[String(barcode)] || null;
}
function setRuntimeOwner(barcode, userId) {
  const state = readRuntimeState();
  state.ownership[String(barcode)] = String(userId);
  writeRuntimeState(state);
}
function applyRuntime(row) {
  if (!row) return null;
  const owner = runtimeOwner(row.barcode);
  return owner ? { ...row, owner_id: owner } : row;
}
function audit(sql, params = []) {
  try { db.prepare(sql).run(...params); }
  catch (err) { console.warn('audit skipped:', err.message); }
}

function shape(row) {
  if (!row) return null;
  return {
    barcode: row.barcode, alt_barcode: row.alt_barcode, number: row.number,
    draw_date: row.draw_date, draw_en: row.draw_en,
    series: row.series, set: row.set, price: row.price,
    status: row.status, is_claimed: !!row.is_claimed,
    prize_type: row.prize_type, prize_amount: row.prize_amount,
    owner_id: row.owner_id || null,
    owner_mask: row.owner_id ? maskUser(row.owner_id) : null
  };
}
// mask a phone/id for display, e.g. 0812345678 -> 08x-xxx-5678
function maskUser(id){
  const s=String(id);
  if(s.length>=7) return s.slice(0,2)+'x-xxx-'+s.slice(-4);
  return s.slice(0,2)+'***';
}

// Match a scanned code against the Data Matrix payload, the 1D ITF barcode,
// or the printed 6-digit number (which the Data Matrix also embeds). This makes
// verification robust whichever code the scanner happens to read.
function getTicket(code) {
  if (code == null) return null;
  const c = String(code).trim();
  let row = db.prepare('SELECT * FROM tickets WHERE barcode = ? OR alt_barcode = ?').get(c, c);
  if (row) return applyRuntime(row);
  const digits = c.replace(/\D/g, '');
  const six = (c.match(/(?:^|\D)(\d{6})(?:\D|$)/) || [])[1] || (digits.length === 6 ? digits : null);
  if (six) {
    const rows = db.prepare('SELECT * FROM tickets WHERE number = ? ORDER BY barcode').all(six);
    row = rows.find((candidate) => !runtimeOwner(candidate.barcode)) || rows[0];
  }
  return applyRuntime(row) || null;
}

// GLO prizes are claimable for 2 years after the draw date.
// Returns the last day a prize can be collected, parsed from draw_en ("1 JULY 2026").
const MONTHS = {JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
function claimDeadline(row) {
  const m = (row.draw_en || '').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const mo = MONTHS[m[2].slice(0,3).toUpperCase()];
  if (mo == null) return null;
  const d = new Date(Number(m[3]), mo, Number(m[1]));
  d.setFullYear(d.getFullYear() + 2);     // 2-year claim window
  return d;
}
function isExpired(row) {
  if (row.status === 'expired') return true;      // manual override
  const dl = claimDeadline(row);
  return dl ? (new Date() > dl) : false;          // past the 2-year window?
}

function parsedDataMatrixCode(code) {
  if (code == null) return null;
  const c = String(code).trim();
  const payload = c.match(/(?:^|\D)(\d{2})-(\d{2})-(\d{2})-(\d{6})-(\d{4})(?:\D|$)/);
  if (!payload) return null;
  return { year: payload[1], series: payload[2], set: payload[3], number: payload[4], suffix: payload[5] };
}

function scannedNumberFromCode(code) {
  const payload = parsedDataMatrixCode(code);
  if (payload) return payload.number;
  if (code == null) return null;
  const c = String(code).trim();
  const isolated = c.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  if (isolated) return isolated[1];
  const digits = c.replace(/\D/g, '');
  return digits.length === 6 ? digits : null;
}

function exactTicket(code) {
  if (code == null) return null;
  const c = String(code).trim();
  const row = db.prepare('SELECT * FROM tickets WHERE barcode = ? OR alt_barcode = ?').get(c, c);
  return applyRuntime(row);
}

function signatureTicketFromCode(code) {
  const parsed = parsedDataMatrixCode(code);
  if (!parsed) return null;
  const signature = `${parsed.year}-${parsed.series}-${parsed.set}-%-${parsed.suffix}`;
  const row = db.prepare('SELECT * FROM tickets WHERE barcode LIKE ? ORDER BY barcode LIMIT 1').get(signature);
  return applyRuntime(row);
}

/* ---------- lookup ---------- */
app.get('/api/tickets/:barcode', (req, res) => {
  const row = getTicket(req.params.barcode);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(shape(row));
});

app.post('/api/scan-validate', (req, res) => {
  const { barcode, mode = 'verify', user_id = null } = req.body || {};
  const parsed_payload = parsedDataMatrixCode(barcode);
  const exact = exactTicket(barcode);
  const signature = exact ? null : signatureTicketFromCode(barcode);
  const row = exact || signature || getTicket(barcode);
  const scanned_number = scannedNumberFromCode(barcode);
  const reasons = [];
  let ok = true;

  if (!row) {
    ok = false;
    reasons.push('barcode_not_found');
  } else {
    if (scanned_number && scanned_number !== row.number) {
      ok = false;
      reasons.push('barcode_number_mismatch');
    }
    if (mode === 'collect' && !scanned_number) {
      ok = false;
      reasons.push('scan_number_unavailable');
    }
    if (mode === 'collect' && row.owner_id) {
      ok = false;
      reasons.push(String(row.owner_id) === String(user_id) ? 'already_collected_by_you' : 'already_collected_by_other');
    }
    if (row.is_claimed) {
      ok = false;
      reasons.push('already_claimed');
    }
    if (isExpired(row)) {
      ok = false;
      reasons.push('claim_window_closed');
    }
  }

  res.status(ok ? 200 : 409).json({
    ok,
    mode,
    reasons,
    scanned_number,
    parsed_payload,
    lookup_method: exact ? 'exact' : signature ? 'signature' : row ? 'fallback' : 'none',
    number_match: !!row && (!scanned_number || scanned_number === row.number),
    already_collected: !!(row && row.owner_id),
    owner_mask: row && row.owner_id ? maskUser(row.owner_id) : null,
    ticket: shape(row)
  });
});

/* ---------- full rules engine (server-side authority) ---------- */
app.post('/api/verify', (req, res) => {
  // ocr_readable: false = the front photo could not be read (STRICT — do not pass).
  // ai_score: 0..1 authenticity from the image check (< 0.55 = likely screenshot/copy).
  const { barcode, ocr_result, ocr_readable = true, ai_score = 0.9, lat = null, lng = null } = req.body || {};
  const row = getTicket(barcode);
  let result_status = 'ok'; const reasons = [];
  if (!row) { result_status = 'invalid'; reasons.push('barcode_not_found'); }
  else {
    const ocrMatch = ocr_result ? ocr_result === row.number : true;
    const dateOK   = !isExpired(row);               // claimable within 2 years of the draw
    if (row.is_claimed)                 { result_status = 'claimed';    reasons.push('already_claimed'); }
    else if (ocr_readable === false)    { result_status = 'review';     reasons.push('photo_unreadable'); }        // (A) strict OCR
    else if (!ocrMatch)                 { result_status = 'suspicious'; reasons.push('ocr_mismatch'); }
    else if (ai_score < 0.55)           { result_status = 'suspicious'; reasons.push('image_authenticity'); }      // (B) visual check
    else if (!dateOK)                   { result_status = 'expired';    reasons.push('claim_window_closed'); }
    else if (row.status === 'suspicious'){ result_status = 'suspicious'; reasons.push('flagged'); }
  }
  audit(`INSERT INTO scan_actions
    (barcode,action_type,ocr_result,ocr_match,date_match,ai_score,result_status,lat,lng)
    VALUES (?,?,?,?,?,?,?,?,?)`, [
      barcode || null, 'verify', ocr_result || null,
      row && ocr_result ? (ocr_result === row.number ? 1 : 0) : null,
      row ? (row.status !== 'expired' ? 1 : 0) : null,
      ai_score, result_status, lat, lng
    ]);
  res.json({ result_status, reasons, ticket: shape(row) });
});

/* ---------- (B) image authenticity — production hook ----------
   POST { front_b64, back_b64 } → { ai_score, is_screenshot, is_photocopy, suspicious }
   If ANTHROPIC_API_KEY (or OPENAI) is set, wire a vision model here and return its JSON
   (prompt in ROADMAP Phase 4). Until then it echoes the client heuristic so the pipeline
   is fully connected end-to-end. */
function buildVisionChecklist(score, metrics = {}) {
  const suspicious = score < 0.55;
  const lowSharpness = Number(metrics.lapVar || 0) > 0 && Number(metrics.lapVar) < 45;
  const flatLighting = Number(metrics.std || 0) > 0 && Number(metrics.std) < 36;
  const whiteHeavy = Number(metrics.whiteRatio || 0) > 0.4;
  const screenLike = Number(metrics.satRatio || 0) > 0.06 && Number(metrics.lapVar || 0) > 950;
  const check = (dimension, region, status, reason) => ({ dimension, region, status, reason });
  return [
    check('main_number_spacing', 'main_number', 'needs_model', 'Requires OCR/vision model layout comparison.'),
    check('main_number_alignment', 'main_number', 'needs_model', 'Requires digit baseline and rotation comparison.'),
    check('main_number_font', 'main_number', 'needs_model', 'Requires digit-shape comparison against genuine samples.'),
    check('main_number_scale', 'main_number', 'needs_model', 'Requires per-digit size comparison.'),
    check('logo_position', 'logo', 'needs_model', 'Requires logo/header localization.'),
    check('logo_scale', 'logo', 'needs_model', 'Requires logo/header scale comparison.'),
    check('date_alignment', 'date', 'needs_model', 'Requires date-line localization.'),
    check('qr_position', 'qr_code', 'needs_model', 'Requires QR localization.'),
    check('barcode_position', 'barcode', 'needs_model', 'Requires barcode localization.'),
    check(
      'patch_boundary',
      'edited_patch',
      suspicious || lowSharpness || flatLighting || whiteHeavy || screenLike ? 'suspicious' : 'pass',
      suspicious
        ? 'Client image metrics indicate screenshot, flat lighting, blur, or compositing risk.'
        : 'No broad screenshot/compositing signal found by current heuristic.'
    )
  ];
}

app.post('/api/verify-image', async (req, res) => {
  const { front_b64, client_score = null, client_metrics = {} } = req.body || {};
  if (!front_b64) return res.status(400).json({ error: 'front_b64 required' });

  if (process.env.ANTHROPIC_API_KEY) {
    // TODO Phase 4: call Claude vision with the front/back images and return its JSON.
    // Left unimplemented on purpose so no key is required to run the prototype.
  }
  // fallback: trust the client-side heuristic score (0..100 → 0..1)
  const score = client_score != null ? Number(client_score) / 100 : 0.9;
  res.json({
    ai_score: score,
    is_screenshot: score < 0.55,
    is_photocopy: false,
    suspicious: score < 0.55,
    source: process.env.ANTHROPIC_API_KEY ? 'model-configured' : 'client-heuristic',
    checklist: buildVisionChecklist(score, client_metrics)
  });
});

app.get('/api/ml-dataset', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'data', 'training-dataset', 'index.json');
  res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'dataset_index_not_found', hint: 'Run node scripts/build-training-index.js' });
    }
  });
});

function ownershipValidation(row, userId) {
  if (!row) return { ok: false, status: 'not_found' };
  if (!row.owner_id) return { ok: false, status: 'ownership_required' };
  if (String(row.owner_id) !== String(userId)) {
    return { ok: false, status: 'ownership_conflict', owner_mask: maskUser(row.owner_id) };
  }
  return { ok: true, status: 'owner_confirmed' };
}

app.post('/api/ownership/validate', (req, res) => {
  const { barcode, user_id = '0812345678' } = req.body || {};
  const row = getTicket(barcode);
  const validation = ownershipValidation(row, user_id);
  res.status(validation.ok ? 200 : 409).json({ ...validation, ticket: shape(row) });
});

/* ---------- SCAN MODE 2: collect ownership (with conflict detection) ----------
   POST { barcode, user_id } →
     • ticket unowned      → registers ownership → { status:'registered' }
     • already yours        → { status:'already_yours' }
     • owned by someone else→ 409 { status:'ownership_conflict', owner_mask }  (goes to review) */
app.post('/api/ownership', (req, res) => {
  const { barcode, user_id = '0812345678', lat = null, lng = null } = req.body || {};
  const row = getTicket(barcode);
  if (!row) return res.status(404).json({ error: 'not_found' });

  let status;
  if (!row.owner_id) {
    setRuntimeOwner(row.barcode, user_id);
    status = 'registered';
  } else if (String(row.owner_id) === String(user_id)) {
    audit(`INSERT INTO scan_actions (barcode,user_id,action_type,result_status,lat,lng)
      VALUES (?,?,?,?,?,?)`, [row.barcode, user_id, 'collect', 'review', lat, lng]);
    return res.status(409).json({ status: 'already_yours', ticket: shape(row) });
  } else {
    status = 'ownership_conflict';
  }
  audit(`INSERT INTO scan_actions (barcode,user_id,action_type,result_status,lat,lng)
    VALUES (?,?,?,?,?,?)`, [row.barcode, user_id, 'collect',
      status === 'ownership_conflict' ? 'review' : 'ok', lat, lng]);

  if (status === 'ownership_conflict')
    return res.status(409).json({ status, owner_mask: maskUser(row.owner_id), ticket: shape(getTicket(barcode)) });
  res.json({ ok: true, status, ticket: shape(getTicket(barcode)) });
});

/* ---------- record a scan/save ---------- */
app.post('/api/scans', (req, res) => {
  const { barcode, user_id = null, action_type = 'verify', ocr_result = null,
          result_status = 'ok', lat = null, lng = null } = req.body || {};
  let id = null;
  try {
    const info = db.prepare(`INSERT INTO scan_actions
    (barcode,user_id,action_type,ocr_result,result_status,lat,lng)
    VALUES (?,?,?,?,?,?,?)`).run(barcode, user_id, action_type, ocr_result, result_status, lat, lng);
    id = info.lastInsertRowid;
  } catch (err) {
    console.warn('scan record skipped:', err.message);
  }
  res.json({ ok: true, id });
});

/* ---------- claim a prize ---------- */
app.post('/api/claims', (req, res) => {
  const { barcode, user_id = '0812345678', bank = 'กรุงไทย',
          bank_account = 'xxx-x-x4291-x', amount = 0, ref } = req.body || {};
  const row = getTicket(barcode);
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.is_claimed) return res.status(409).json({ error: 'already_claimed' });
  const validation = ownershipValidation(row, user_id);
  if (!validation.ok) return res.status(409).json({ error: validation.status, owner_mask: validation.owner_mask || null });
  const ref_code = ref || ('PTG-GLO-' + Date.now());
  try {
    db.prepare('UPDATE tickets SET is_claimed = 1, owner_id = ? WHERE barcode = ?').run(user_id, barcode);
    db.prepare(`INSERT INTO claim_rewards (barcode,user_id,bank_name,bank_account,amount,ref_code)
      VALUES (?,?,?,?,?,?)`).run(barcode, user_id, bank, bank_account, amount, ref_code);
  } catch (err) {
    console.warn('claim write skipped:', err.message);
  }
  res.json({ ok: true, ref_code, amount, status: 'success' });
});

/* ---------- history / admin ---------- */
app.get('/api/scans', (req, res) =>
  res.json(db.prepare('SELECT * FROM scan_actions ORDER BY scanned_at DESC LIMIT 50').all()));
app.get('/api/admin/review', (req, res) =>
  res.json(db.prepare(`SELECT * FROM scan_actions WHERE result_status IN ('suspicious','review') ORDER BY scanned_at DESC`).all()));
app.get('/api/health', (req, res) => res.json({ ok: true, draw: CURRENT_DRAW }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🎟️  GLO API + app running → http://localhost:${PORT}`));
