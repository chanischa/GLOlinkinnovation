/* ============================================================
   GLO E-LOTTERY — Frontend logic
   Talks to the backend API when available; falls back to an
   embedded seed set so the file also runs standalone (file://).
   ============================================================ */

// Point this at your backend. Empty string => same origin.
const API_BASE = (localStorage.getItem('glo_api') || '').replace(/\/$/, '');
const CURRENT_DRAW = '1 ก.ค. 2569';

// GLO prizes are claimable for 2 years after the draw date.
const _MONTHS={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};
function claimDeadline(t){
  const m=(t&&t.draw_en||'').match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if(!m) return null;
  const mo=_MONTHS[m[2].slice(0,3).toUpperCase()]; if(mo==null) return null;
  const d=new Date(Number(m[3]),mo,Number(m[1])); d.setFullYear(d.getFullYear()+2);
  return d;
}
function isExpired(t){
  if(t && t.status==='expired') return true;
  const dl=claimDeadline(t); return dl ? (new Date()>dl) : false;
}
function deadlineText(t){
  const dl=claimDeadline(t); if(!dl) return '';
  return dl.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
}

/* ---------- SVG brand assets injected into every header ---------- */
const GLO_LOGO = `
<div class="logo-lockup">
  <svg class="glo-logo" viewBox="0 0 118 40">
    <text x="0" y="30" font-family="Prompt,Noto Sans Thai,sans-serif" font-size="34" font-weight="800" fill="#1B62D6" letter-spacing="-1">GL</text>
    <circle cx="86" cy="20" r="16" fill="none" stroke="#1B62D6" stroke-width="6"/>
    <path d="M86 4a16 16 0 0114 8.5" fill="none" stroke="#F4B821" stroke-width="6" stroke-linecap="round"/>
  </svg>
  <div class="glo-divider"></div>
  ${GLO_SEAL_SVG()}
</div>
<div class="logo-caption">
  <div class="th">สำนักงานสลากกินแบ่งรัฐบาล</div>
  <div class="en">THE GOVERNMENT LOTTERY OFFICE</div>
</div>`;

function GLO_SEAL_SVG(){
  // stylised royal Garuda emblem (blue star burst + gold center)
  return `<svg class="glo-seal" viewBox="0 0 40 40">
    <g>
      ${Array.from({length:16}).map((_,i)=>{const a=i*22.5*Math.PI/180;const x1=20+15*Math.cos(a),y1=20+15*Math.sin(a),x2=20+19*Math.cos(a),y2=20+19*Math.sin(a);return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#1C4E9E" stroke-width="3" stroke-linecap="round"/>`}).join('')}
      <circle cx="20" cy="20" r="14" fill="#1C4E9E"/>
      <circle cx="20" cy="20" r="11" fill="#EAF2FE"/>
      <circle cx="20" cy="20" r="9.5" fill="#D9A21B"/>
      <path d="M20 13c-2 3-5 3.5-5 6.5a5 5 0 0010 0c0-3-3-3.5-5-6.5z" fill="#1C4E9E"/>
      <path d="M12 20c1.5 1 3 1.2 4 1M28 20c-1.5 1-3 1.2-4 1" stroke="#1C4E9E" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
}
['logo-home','logo-tickets','logo-prize','logo-success'].forEach(id=>{
  const el=document.getElementById(id); if(el) el.innerHTML=GLO_LOGO;
});
document.getElementById('ticket-seal').innerHTML=GLO_SEAL_SVG();

/* ---------- embedded seed = the 21 REAL GLO tickets (offline fallback) ----------
   Keyed by the Data Matrix payload. `alt` is the 1D ITF barcode; `number` is the
   printed 6-digit number (also embedded in the Data Matrix). Prize results for the
   1 ก.ค. 2569 draw are a realistic demo set (official results were unavailable). */
const SEED = {
  "69-28-18-910054-3779":{barcode:"69-28-18-910054-3779",alt:"2628188702362700",number:"910054",draw_date:"16 ก.ค. 2569",draw_en:"16 JULY 2026",series:"28",set:"18",price:80,status:"active",is_claimed:false,prize_type:null,prize_amount:0},
  "69-26-13-039184-4358":{barcode:"69-26-13-039184-4358",alt:"2626130402808908",number:"039184",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"13",price:80,status:"active",is_claimed:false,prize_type:"รางวัลที่ 1",prize_amount:6000000},
  "69-26-37-488807-7121":{barcode:"69-26-37-488807-7121",alt:"2626371312530807",number:"488807",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"37",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 3 ตัว",prize_amount:4000},
  "69-25-05-972469-3941":{barcode:"69-25-05-972469-3941",alt:"2625058277231800",number:"972469",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"05",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-04-972469-3941":{barcode:"69-25-04-972469-3941",alt:"",number:"972469",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"04",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-03-972469-3941":{barcode:"69-25-03-972469-3941",alt:"2625039188568904",number:"972469",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"03",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-02-972469-3941":{barcode:"69-25-02-972469-3941",alt:"2625028951310600",number:"972469",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"02",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-01-972469-3941":{barcode:"69-25-01-972469-3941",alt:"",number:"972469",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"01",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-03-127911-3943":{barcode:"69-25-03-127911-3943",alt:"2625033174570105",number:"127911",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"03",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-05-127911-3943":{barcode:"69-25-05-127911-3943",alt:"",number:"127911",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"05",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-04-127911-3943":{barcode:"69-25-04-127911-3943",alt:"",number:"127911",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"04",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-02-127911-3943":{barcode:"69-25-02-127911-3943",alt:"2625028714370601",number:"127911",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"02",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-25-01-127911-3943":{barcode:"69-25-01-127911-3943",alt:"",number:"127911",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"25",set:"01",price:80,status:"active",is_claimed:false,prize_type:"เลขหน้า 3 ตัว",prize_amount:4000},
  "69-26-12-965884-4359":{barcode:"69-26-12-965884-4359",alt:"2626120397183002",number:"965884",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"12",price:80,status:"active",is_claimed:false,prize_type:null,prize_amount:0},
  "69-26-37-453545-1478":{barcode:"69-26-37-453545-1478",alt:"2626377603136304",number:"453545",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"37",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 3 ตัว",prize_amount:4000},
  "69-26-01-357788-0105":{barcode:"69-26-01-357788-0105",alt:"2626013734295003",number:"357788",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"01",price:100,status:"active",is_claimed:false,prize_type:null,prize_amount:0,owner_id:"0898887777"},
  "69-26-38-453545-1478":{barcode:"69-26-38-453545-1478",alt:"2626385377053407",number:"453545",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"38",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 3 ตัว",prize_amount:4000},
  "69-26-38-488807-7121":{barcode:"69-26-38-488807-7121",alt:"2626381252251504",number:"488807",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"38",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 3 ตัว",prize_amount:4000},
  "69-26-13-965884-4359":{barcode:"69-26-13-965884-4359",alt:"2626133850280207",number:"965884",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"13",price:80,status:"active",is_claimed:false,prize_type:null,prize_amount:0},
  "69-26-32-568259-8004":{barcode:"69-26-32-568259-8004",alt:"2626325540539602",number:"568259",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"32",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 2 ตัว",prize_amount:2000},
  "69-26-31-568259-8004":{barcode:"69-26-31-568259-8004",alt:"2626315696356901",number:"568259",draw_date:"1 ก.ค. 2569",draw_en:"1 JULY 2026",series:"26",set:"31",price:80,status:"active",is_claimed:false,prize_type:"เลขท้าย 2 ตัว",prize_amount:2000}
};

// offline matcher: exact Data Matrix, exact ITF, or the embedded/OCR 6-digit number
function seedLookup(code){
  if(code==null) return null;
  const c=String(code).trim();
  if(SEED[c]) return SEED[c];
  for(const k in SEED){ if(SEED[k].alt && SEED[k].alt===c) return SEED[k]; }
  const m=c.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  const six=m?m[1]:(c.replace(/\D/g,'').length===6?c.replace(/\D/g,''):null);
  if(six){ for(const k in SEED){ if(SEED[k].number===six) return SEED[k]; } }
  return null;
}

async function apiLookup(barcode){
  if(API_BASE || location.protocol==='http:' || location.protocol==='https:'){
    try{
      const r=await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(barcode)}`);
      if(r.ok) return await r.json();
      if(r.status===404) return seedLookup(barcode);
    }catch(e){/* fall through to seed */}
  }
  return seedLookup(barcode);
}
async function apiPost(path,body){
  if(API_BASE || location.protocol.startsWith('http')){
    try{const r=await fetch(`${API_BASE}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(r.ok)return await r.json();}catch(e){}
  }
  return {ok:true, offline:true};
}

/* ---------- state ---------- */
const S = {barcode:null,ticket:null,frontImg:null,backImg:null,ocr:null,pin:'',
  userId:localStorage.getItem('glo_user_id') || '0812345678',          // the logged-in demo user
  mode:'collect',               // 'verify' = check only · 'collect' = take ownership
  streams:{scan:null,front:null,back:null}, loop:null, flash:false, saved:[],
  scanCanContinue:false, scanValidation:null, collectBusy:false};

// mask a phone/id for display, e.g. 0898887777 -> 08x-xxx-7777
function maskUserJS(id){const s=String(id); return s.length>=7? s.slice(0,2)+'x-xxx-'+s.slice(-4) : s.slice(0,2)+'***';}

// Capture the device location (used to stamp scan / collect / claim actions).
function getLocation(){
  return new Promise(res=>{
    if(!navigator.geolocation){res(null);return;}
    navigator.geolocation.getCurrentPosition(
      p=>res({lat:+p.coords.latitude.toFixed(6), lng:+p.coords.longitude.toFixed(6), acc:Math.round(p.coords.accuracy||0)}),
      ()=>res(null),
      {enableHighAccuracy:true, timeout:8000, maximumAge:60000});
  });
}
function geoBody(extra){ return Object.assign({lat:S.geo?S.geo.lat:null, lng:S.geo?S.geo.lng:null}, extra||{}); }

async function apiOwnershipValidate(barcode){
  if(API_BASE || location.protocol.startsWith('http')){
    try{
      const r=await fetch(`${API_BASE}/api/ownership/validate`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({barcode,user_id:S.userId})
      });
      const data=await r.json();
      return {ok:r.ok,...data};
    }catch(e){}
  }
  const t=seedLookup(barcode);
  if(!t) return {ok:false,status:'not_found'};
  if(!t.owner_id) return {ok:false,status:'ownership_required',ticket:t};
  if(String(t.owner_id)!==String(S.userId)) return {ok:false,status:'ownership_conflict',owner_mask:maskUserJS(t.owner_id),ticket:t};
  return {ok:true,status:'owner_confirmed',ticket:t};
}

function ownerStatusText(status, ownerMask){
  if(status==='owner_confirmed') return 'ยืนยันเจ้าของสิทธิ์แล้ว';
  if(status==='ownership_required') return 'ต้องเก็บสิทธิ์สลากก่อน';
  if(status==='ownership_conflict') return 'สลากเป็นของบัญชีอื่น'+(ownerMask?' ('+ownerMask+')':'');
  if(status==='already_yours') return 'สลากนี้อยู่ในบัญชีคุณแล้ว';
  if(status==='duplicate_number_collected') return 'เลขสลากนี้ถูกเก็บเข้าบัญชีคุณแล้ว';
  return 'ตรวจเจ้าของสิทธิ์ไม่ผ่าน';
}

/* ---------- navigation ---------- */
function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('app').scrollTop=0;
}
function showTickets(){ renderSaved(); go('tickets'); }
let toastT;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---------- SCAN — native BarcodeDetector, ZXing fallback ---------- */
let zxingReader=null;
function scannedNumberFromCodeJS(code){
  const c=String(code||'').trim();
  const payload=c.match(/(?:^|\D)(\d{2})-\d{2}-\d{2}-(\d{6})-\d{4}(?:\D|$)/);
  if(payload) return payload[2];
  const isolated=c.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  if(isolated) return isolated[1];
  const digits=c.replace(/\D/g,'');
  return digits.length===6?digits:null;
}
function parsedDataMatrixCodeJS(code){
  const c=String(code||'').trim();
  const payload=c.match(/(?:^|\D)(\d{2})-(\d{2})-(\d{2})-(\d{6})-(\d{4})(?:\D|$)/);
  return payload?{year:payload[1],series:payload[2],set:payload[3],number:payload[4],suffix:payload[5]}:null;
}
function signatureSeedLookup(code){
  const parsed=parsedDataMatrixCodeJS(code);
  if(!parsed) return null;
  const prefix=`${parsed.year}-${parsed.series}-${parsed.set}-`;
  const suffix=`-${parsed.suffix}`;
  for(const k in SEED){
    if(k.startsWith(prefix) && k.endsWith(suffix)) return SEED[k];
  }
  return null;
}
async function validateScannedCode(code){
  if(API_BASE || location.protocol.startsWith('http')){
    try{
      const r=await fetch(`${API_BASE}/api/scan-validate`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({barcode:code,mode:S.mode,user_id:S.userId})
      });
      return await r.json();
    }catch(e){}
  }
  const signatureTicket=signatureSeedLookup(code);
  const ticket=signatureTicket || seedLookup(code);
  const scanned_number=scannedNumberFromCodeJS(code);
  const reasons=[];
  if(!ticket) reasons.push('barcode_not_found');
  if(ticket && scanned_number && scanned_number!==ticket.number) reasons.push('barcode_number_mismatch');
  if(ticket && S.mode==='collect' && !scanned_number) reasons.push('scan_number_unavailable');
  if(ticket && S.mode==='collect' && ticket.owner_id) reasons.push(String(ticket.owner_id)===S.userId?'already_collected_by_you':'already_collected_by_other');
  if(ticket && S.mode==='collect' && S.saved.some(t=>t.barcode===ticket.barcode || t.number===ticket.number)) reasons.push('duplicate_number_collected');
  return {ok:reasons.length===0,reasons,scanned_number,parsed_payload:parsedDataMatrixCodeJS(code),lookup_method:signatureTicket?'signature':ticket?'fallback':'none',number_match:!!ticket&&(!scanned_number||scanned_number===ticket.number),already_collected:!!(ticket&&ticket.owner_id),owner_mask:ticket&&ticket.owner_id?maskUserJS(ticket.owner_id):null,ticket};
}
function scanReasonText(validation){
  const reasons=(validation&&validation.reasons)||[];
  if(reasons.includes('barcode_number_mismatch')) return 'เลขในโค้ดไม่ตรงกับฐานข้อมูล';
  if(reasons.includes('already_collected_by_you')) return 'สลากนี้ถูกเก็บเข้าบัญชีคุณแล้ว';
  if(reasons.includes('duplicate_number_collected')) return 'เลขสลากนี้ถูกเก็บเข้าบัญชีคุณแล้ว';
  if(reasons.includes('already_collected_by_other')) return 'สลากนี้ถูกเก็บสิทธิ์โดยบัญชีอื่นแล้ว';
  if(reasons.includes('already_claimed')) return 'สลากนี้ขึ้นเงินแล้ว';
  if(reasons.includes('claim_window_closed')) return 'สลากนี้หมดระยะขึ้นเงินแล้ว';
  if(reasons.includes('barcode_not_found')) return 'ไม่พบรหัสสลากในฐานข้อมูล';
  return 'รหัสสลากไม่ผ่านการตรวจสอบ';
}
async function onDetect(raw){
  if(S.barcode) return;                                  // ignore repeats
  const code = String(raw).trim();
  if(/^https?:\/\//i.test(code)) return;                 // ignore the distributor QR link, keep scanning
  S.barcode = code;                                      // keep the full Data Matrix / barcode payload
  S.scanCanContinue=false; S.scanValidation=null;
  const st=document.getElementById('scan-status'), btn=document.getElementById('scan-btn');
  const shown = code.length>26 ? code.slice(0,26)+'…' : code;
  st.textContent='✅ พบรหัสสลาก: '+shown; btn.disabled=false;
  btn.disabled=true;
  st.textContent='พบรหัสสลาก: '+shown+' · กำลังตรวจเลขกับฐานข้อมูล...';
  try{ if(navigator.vibrate) navigator.vibrate(60); }catch(e){}
  stopScan();                                            // stop the camera loop once found
  const validation=await validateScannedCode(code);
  S.scanValidation=validation;
  S.ticket=validation.ticket||null;
  if(validation.ok){
    S.scanCanContinue=true;
    const dbNum=validation.ticket&&validation.ticket.number?validation.ticket.number:'';
    const scannedNum=validation.scanned_number?` · เลขในโค้ด ${validation.scanned_number}`:'';
    st.textContent='ผ่าน: พบรหัสในฐานข้อมูล'+(dbNum?` · เลขสลาก ${dbNum}`:'')+scannedNum;
    btn.textContent=S.mode==='verify'?'ถ่ายภาพตรวจสลากจริง':'ถ่ายภาพเพื่อเก็บสิทธิ์';
    btn.disabled=false;
  }else{
    st.textContent='ไม่ผ่าน: '+scanReasonText(validation);
    btn.textContent='สแกนใหม่';
    btn.disabled=false;
  }
}
async function startScan(mode){
  S.mode = mode==='verify' ? 'verify' : 'collect';
  go('scan');
  const tt=document.getElementById('scan-title'); if(tt) tt.textContent = S.mode==='verify' ? 'ตรวจสอบสลาก' : 'สแกนเก็บสลาก';
  // capture location in the background (non-blocking) so it's ready by collect time
  getLocation().then(g=>{ S.geo=g; if(g) toast('📍 บันทึกตำแหน่งการสแกนแล้ว'); });
  const v=document.getElementById('scan-video'),st=document.getElementById('scan-status'),btn=document.getElementById('scan-btn');
  btn.textContent='สแกนสำเร็จ'; S.scanCanContinue=false; S.scanValidation=null;
  btn.disabled=true; S.barcode=null; st.textContent='📷 กำลังเปิดกล้อง…';
  try{
    S.streams.scan=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080},focusMode:'continuous'}});
    v.srcObject=S.streams.scan; await v.play().catch(()=>{});
    // best-effort: turn on continuous autofocus if the device exposes it
    try{const tr=S.streams.scan.getVideoTracks()[0];const caps=tr.getCapabilities&&tr.getCapabilities();
        if(caps&&caps.focusMode&&caps.focusMode.includes('continuous')) tr.applyConstraints({advanced:[{focusMode:'continuous'}]});}catch(e){}

    if('BarcodeDetector' in window){
      /* ---- Chrome / Edge: fast native path ---- */
      let fmts=['ean_13','code_128','code_39','qr_code','upc_a','data_matrix','ean_8','itf','codabar'];
      try{ const sup=await BarcodeDetector.getSupportedFormats(); if(sup&&sup.length) fmts=fmts.filter(f=>sup.includes(f)); }catch(e){}
      const det=new BarcodeDetector({formats:fmts});
      st.textContent='🔍 เล็งกล้องไปที่บาร์โค้ด / QR บนสลาก…';
      const oc=document.createElement('canvas'), octx=oc.getContext('2d');
      S.loop=setInterval(async()=>{
        if(v.readyState<2||S.barcode) return;
        try{
          let codes=await det.detect(v);                     // 1) whole frame
          if((!codes||!codes.length) && v.videoWidth){        // 2) magnified centre for small codes
            const cw=v.videoWidth, ch=v.videoHeight, rw=cw*0.62, rh=ch*0.62;
            oc.width=Math.round(rw*1.9); oc.height=Math.round(rh*1.9);
            octx.drawImage(v,(cw-rw)/2,(ch-rh)/2,rw,rh,0,0,oc.width,oc.height);
            codes=await det.detect(oc);
          }
          if(codes&&codes.length){ const good=codes.find(c=>!/^https?:\/\//i.test(c.rawValue))||codes[0]; onDetect(good.rawValue); }
        }catch(e){}
      },260);
    }
    else if(window.ZXing){
      /* ---- Firefox / Safari / others: ZXing decodes the same stream ---- */
      st.textContent='🔍 เล็งกล้องไปที่บาร์โค้ด / QR บนสลาก…';
      const hints=new Map();
      zxingReader=new ZXing.BrowserMultiFormatReader(hints,300);
      zxingReader.decodeFromStream(S.streams.scan, v, (result,err)=>{
        if(result && !S.barcode) onDetect(result.getText());
      }).catch(()=>{ st.textContent='⚠️ อ่านบาร์โค้ดไม่ได้ — ลองขยับให้ชัดขึ้น หรือแตะ “สแกนสำเร็จ” เพื่อทดสอบ'; btn.disabled=false; S.barcode=S.barcode||'69-26-13-039184-4358'; });
    }
    else{
      st.textContent='⚠️ ไม่พบตัวอ่านบาร์โค้ด — แตะ “สแกนสำเร็จ” เพื่อทดสอบ'; btn.disabled=false; S.barcode='69-26-13-039184-4358';
    }
  }catch(e){ st.textContent='❌ เปิดกล้องไม่ได้ — อนุญาตการเข้าถึงกล้อง แล้วแตะ “สแกนสำเร็จ” เพื่อทดสอบ'; btn.disabled=false; S.barcode='69-26-13-039184-4358'; }
}
function stopScan(){
  if(S.loop){clearInterval(S.loop);S.loop=null;}
  if(zxingReader){ try{zxingReader.reset();}catch(e){} zxingReader=null; }
  stopStream('scan');
}
function stopStream(k){ if(S.streams[k]){S.streams[k].getTracks().forEach(t=>t.stop());S.streams[k]=null;} }
function toggleFlash(){
  const tr=S.streams.scan&&S.streams.scan.getVideoTracks()[0]; if(!tr)return;
  S.flash=!S.flash;
  try{tr.applyConstraints({advanced:[{torch:S.flash}]});document.getElementById('flash-btn').classList.toggle('flash',S.flash);}catch(e){toast('อุปกรณ์นี้ไม่รองรับแฟลช');}
}
function afterScan(){
  if(!S.scanCanContinue){
    S.barcode=null;
    startScan(S.mode);
    return;
  }
  stopScan(); go('capfront'); startCap('front');
}

/* ---------- CAPTURE ---------- */
async function startCap(side){
  const v=document.getElementById(side+'-vid');
  try{S.streams[side]=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}});v.srcObject=S.streams[side];}
  catch(e){toast('เปิดกล้องไม่ได้ — จะใช้ภาพตัวอย่างแทน');}
}
function stopCap(side){ stopStream(side); }
function capture(side){
  const v=document.getElementById(side+'-vid'),c=document.getElementById(side+'-canvas');
  c.width=v.videoWidth||860;c.height=v.videoHeight||420;const ctx=c.getContext('2d');
  const real = !!v.videoWidth;
  if(real){ctx.drawImage(v,0,0);}
  else{ctx.fillStyle='#EAF2FE';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#1B62D6';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText('สลากตัวอย่าง',c.width/2,c.height/2-16);ctx.fillStyle='#333';ctx.font='bold 40px monospace';ctx.fillText((S.ticket&&S.ticket.number)||'507392',c.width/2,c.height/2+34);}
  const data=c.toDataURL('image/jpeg',.85);
  S[side+'Img']=data;
  S[side+'Placeholder']=!real;   // true = demo placeholder (no real camera), skip strict checks
  const th=document.getElementById(side+'-thumb');th.src=data;th.style.display='block';
  document.getElementById(side+'-next').classList.add('on');
  toast(side==='front'?'📸 บันทึกภาพด้านหน้าแล้ว':'📸 บันทึกภาพด้านหลังแล้ว');
}
function frontDone(){ if(!S.frontImg){toast('กรุณาถ่ายภาพก่อน');return;} stopCap('front'); go('capback'); startCap('back'); }
function backDone(){ if(!S.backImg){toast('กรุณาถ่ายภาพก่อน');return;} stopCap('back'); go('processing'); runVerify(); }

/* ---------- VERIFICATION ENGINE ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function step(n,s){document.getElementById('d'+n).className='pdot '+s;document.getElementById('d'+n).textContent=s==='done'?'✓':n;document.getElementById('l'+n).className='plabel '+(s==='pend'?'':s);}

async function runVerify(){
  for(let i=1;i<=5;i++)step(i,'pend');
  let ticket=null, ocrMatch=true, dateOK=true, ocrReadable=true;

  step(1,'act'); await sleep(650); step(1,'done');

  step(2,'act'); await sleep(850);
  ticket=S.ticket || await apiLookup(S.barcode);
  if(!ticket) ticket={barcode:S.barcode,number:'??????',draw_date:'—',series:'—',set:'—',price:80,status:'invalid',is_claimed:false,prize_type:null,prize_amount:0};
  S.ticket=ticket; step(2,'done');

  // OCR is required: the printed number in the photo must match the scanned ticket.
  step(3,'act');
  S.ocr = await runOCR(S.frontImg, ticket, S.frontPlaceholder);
  ocrReadable = S.frontPlaceholder ? true : (S.ocr!=null);
  ocrMatch = ticket.status !== 'invalid' && ticket.number!=='??????' && S.ocr === ticket.number;
  await sleep(300); step(3,'done');

  // ---- (B) IMAGE AUTHENTICITY: real pixel analysis for screenshot/photocopy signals ----
  step(4,'act');
  const localAnalysis = await analyzeImage(S.frontImg, S.frontPlaceholder);
  const analysis = await verifyImageWithServer(S.frontImg, localAnalysis);
  S.aiScore = analysis.score; S.aiReason = analysis.reason; S.aiScreenshot = analysis.screenshot;
  S.visionChecklist = analysis.checklist || [];
  dateOK = !isExpired(ticket);   // claimable within 2 years of the draw date
  await sleep(500); step(4,'done');

  step(5,'act'); await sleep(600); step(5,'done');
  await sleep(300);
  renderVerify(ticket, ocrMatch, dateOK, ocrReadable);
}

/* ---------- (B) IMAGE AUTHENTICITY CHECK ----------
   Real client-side pixel analysis. Computes signals that separate a photo of a
   physical ticket from a screenshot / photo-of-a-screen / photocopy:
     • white-background ratio (digital screenshots are mostly pure white)
     • saturation clipping + high-frequency energy (photo of an emissive screen → moiré)
     • lighting uniformity (screenshots have unnaturally even light)
     • sharpness / blur (Laplacian variance)
   Returns an authenticity score 0–100. Prototype-grade heuristic — the production
   path is the AI vision model in backend /api/verify-image (see ROADMAP Phase 4). */
function analyzeImage(dataURL, isPlaceholder){
  return new Promise(resolve=>{
    if(isPlaceholder || !dataURL){ resolve({score:95, screenshot:false, reason:'ภาพตัวอย่าง (ข้ามการตรวจ)'}); return; }
    const im=new Image();
    im.onload=()=>{
      const W=340, H=Math.max(1,Math.round(im.height*(W/im.width)));
      const c=document.createElement('canvas'); c.width=W; c.height=H;
      const x=c.getContext('2d'); x.drawImage(im,0,0,W,H);
      let d; try{ d=x.getImageData(0,0,W,H).data; }catch(e){ resolve({score:70,screenshot:false,reason:'อ่านภาพไม่ได้'}); return; }
      const n=W*H, lum=new Float32Array(n);
      let white=0, satClip=0, sum=0, sum2=0;
      for(let i=0,p=0;i<d.length;i+=4,p++){
        const r=d[i],g=d[i+1],b=d[i+2];
        const l=0.299*r+0.587*g+0.114*b; lum[p]=l; sum+=l; sum2+=l*l;
        if(r>242&&g>242&&b>242) white++;
        const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
        if(mx>248 && (mx-mn)>55) satClip++;
      }
      const mean=sum/n, std=Math.sqrt(Math.max(0,sum2/n-mean*mean));
      let ls=0, ls2=0, lc=0;
      for(let y=1;y<H-1;y++) for(let xx=1;xx<W-1;xx++){
        const idx=y*W+xx;
        const lap=4*lum[idx]-lum[idx-1]-lum[idx+1]-lum[idx-W]-lum[idx+W];
        ls+=lap; ls2+=lap*lap; lc++;
      }
      const lapVar=lc? (ls2/lc-(ls/lc)*(ls/lc)) : 0;
      const whiteRatio=white/n, satRatio=satClip/n;

      let score=92; const reasons=[];
      if(whiteRatio>0.55){ score-=38; reasons.push('พื้นหลังขาวจัดผิดปกติ (อาจเป็นภาพแคป)'); }
      else if(whiteRatio>0.40){ score-=16; }
      if(satRatio>0.06 && lapVar>950){ score-=32; reasons.push('พบรูปแบบคล้ายถ่ายจากหน้าจอ'); }
      if(std<36){ score-=16; reasons.push('แสงเรียบผิดปกติ (คล้ายภาพดิจิทัล)'); }
      if(lapVar<45){ score-=12; reasons.push('ภาพเบลอ'); }
      score=Math.max(5,Math.min(99,Math.round(score)));
      resolve({score, screenshot: score<55, reason: reasons[0]||'ไม่พบสัญญาณผิดปกติ',
               metrics:{whiteRatio:+whiteRatio.toFixed(2),satRatio:+satRatio.toFixed(3),lapVar:Math.round(lapVar),std:Math.round(std)}});
    };
    im.onerror=()=>resolve({score:70,screenshot:false,reason:'อ่านภาพไม่ได้'});
    im.src=dataURL;
  });
}

async function verifyImageWithServer(dataURL, localAnalysis){
  if(!dataURL || !(API_BASE || location.protocol.startsWith('http'))) return localAnalysis;
  try{
    const r = await fetch(`${API_BASE}/api/verify-image`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        front_b64:dataURL,
        client_score:localAnalysis.score,
        client_metrics:localAnalysis.metrics || {}
      })
    });
    if(!r.ok) return localAnalysis;
    const out = await r.json();
    const score = Math.round(Number(out.ai_score == null ? localAnalysis.score / 100 : out.ai_score) * 100);
    const flagged = (out.checklist || []).filter(c=>c.status==='suspicious').map(c=>c.dimension);
    return {
      score,
      screenshot: !!out.is_screenshot || !!out.suspicious,
      reason: flagged.length ? `server checklist: ${flagged.join(', ')}` : localAnalysis.reason,
      metrics: localAnalysis.metrics || {},
      checklist: out.checklist || [],
      source: out.source || 'server'
    };
  }catch(e){
    return localAnalysis;
  }
}

// Upscale + grayscale + contrast-stretch the photo so Tesseract can read the digits.
function preprocess(dataURL){
  return new Promise(resolve=>{
    const im=new Image();
    im.onload=()=>{
      const scale=Math.min(2.5, Math.max(1, 1400/(im.width||700)));
      const c=document.createElement('canvas');
      c.width=Math.round(im.width*scale); c.height=Math.round(im.height*scale);
      const x=c.getContext('2d');
      x.drawImage(im,0,0,c.width,c.height);
      const d=x.getImageData(0,0,c.width,c.height), p=d.data;
      // grayscale + find min/max for contrast stretch
      let min=255,max=0;
      for(let i=0;i<p.length;i+=4){const g=(0.3*p[i]+0.59*p[i+1]+0.11*p[i+2])|0;p[i]=p[i+1]=p[i+2]=g;if(g<min)min=g;if(g>max)max=g;}
      const rng=Math.max(1,max-min);
      for(let i=0;i<p.length;i+=4){const g=p[i];let v=((g-min)/rng)*255;v=v<95?0:v>170?255:v;p[i]=p[i+1]=p[i+2]=v;}
      x.putImageData(d,0,0);
      resolve(c.toDataURL('image/png'));
    };
    im.onerror=()=>resolve(dataURL);
    im.src=dataURL;
  });
}

function preprocessRegion(dataURL, crop, mode){
  return new Promise(resolve=>{
    const im=new Image();
    im.onload=()=>{
      const sx=crop?Math.max(0,Math.round(im.width*crop.x)):0;
      const sy=crop?Math.max(0,Math.round(im.height*crop.y)):0;
      const sw=crop?Math.min(im.width-sx,Math.round(im.width*crop.w)):im.width;
      const sh=crop?Math.min(im.height-sy,Math.round(im.height*crop.h)):im.height;
      const targetW=mode==='line'?1800:1600;
      const scale=Math.min(4, Math.max(1.4, targetW/Math.max(1,sw)));
      const pad=36;
      const c=document.createElement('canvas');
      c.width=Math.round(sw*scale)+pad*2;
      c.height=Math.round(sh*scale)+pad*2;
      const x=c.getContext('2d');
      x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
      x.imageSmoothingEnabled=true;
      x.imageSmoothingQuality='high';
      x.drawImage(im,sx,sy,sw,sh,pad,pad,Math.round(sw*scale),Math.round(sh*scale));
      const d=x.getImageData(0,0,c.width,c.height), p=d.data;
      let min=255,max=0;
      for(let i=0;i<p.length;i+=4){
        const g=(0.299*p[i]+0.587*p[i+1]+0.114*p[i+2])|0;
        p[i]=p[i+1]=p[i+2]=g;
        if(g<min)min=g;if(g>max)max=g;
      }
      const range=Math.max(1,max-min);
      for(let i=0;i<p.length;i+=4){
        const stretched=((p[i]-min)/range)*255;
        const v=mode==='line'
          ? (stretched<120?0:stretched>188?255:stretched)
          : (stretched<100?0:stretched>176?255:stretched);
        p[i]=p[i+1]=p[i+2]=v;
      }
      x.putImageData(d,0,0);
      resolve(c.toDataURL('image/png'));
    };
    im.onerror=()=>resolve(dataURL);
    im.src=dataURL;
  });
}

// Extract the 6-digit lottery number: prefer an isolated 6-digit group
// (so the 16-digit barcode and 4-digit year are ignored). No lookbehind
// so it parses in every browser including older Safari.
function extractNumber(text){
  const groups=(text.match(/\d+/g)||[]);
  const six=groups.filter(g=>g.length===6);
  if(six.length) return six[0];
  // else take the first group that is 6–8 digits and use its first 6
  const near=groups.find(g=>g.length>=6 && g.length<=8);
  if(near) return near.slice(0,6);
  return null;
}

function extractNumberCandidates(text){
  const groups=(text.match(/\d+/g)||[]);
  const out=[];
  for(const g of groups){
    if(g.length===6) out.push(g);
    else if(g.length>6 && g.length<=18){
      for(let i=0;i<=g.length-6;i++) out.push(g.slice(i,i+6));
    }
  }
  return [...new Set(out)];
}

async function runOCR(img,ticket,isPlaceholder){
  // Demo placeholder (no real camera): trust the ticket number so the flow is testable.
  if(isPlaceholder) return ticket && ticket.number!=='??????' ? ticket.number : null;
  // Real photo: read it for real. If we can't read a 6-digit number → return null
  // (STRICT: an unreadable photo must NOT silently pass as a match).
  if(img && typeof Tesseract!=='undefined'){
    const expected=ticket&&ticket.number&&ticket.number!=='??????'?String(ticket.number):null;
    const variants=[
      {name:'main_number_top_right',crop:{x:.42,y:.08,w:.55,h:.24},psm:'7',mode:'line'},
      {name:'main_number_upper_band',crop:{x:.30,y:.04,w:.68,h:.34},psm:'6',mode:'line'},
      {name:'ticket_middle',crop:{x:.08,y:.10,w:.86,h:.52},psm:'6',mode:'block'},
      {name:'full_frame',crop:null,psm:'6',mode:'block'}
    ];
    const allCandidates=[];
    let bestConfidence=0;
    try{
      const w=await Tesseract.createWorker('eng');
      for(const v of variants){
        const pre=await preprocessRegion(img,v.crop,v.mode);
        await w.setParameters({
          tessedit_char_whitelist:'0123456789',
          tessedit_pageseg_mode:v.psm,
          preserve_interword_spaces:'1'
        });
        const {data}=await w.recognize(pre);
        const confidence=Math.round((data&&data.confidence)||0);
        if(confidence>bestConfidence) bestConfidence=confidence;
        const text=data.text||'';
        const candidates=extractNumberCandidates(text);
        for(const value of candidates) allCandidates.push({value,confidence,source:v.name});
        if(expected && candidates.includes(expected)){
          await w.terminate();
          S.ocrConfidence=confidence;
          S.ocrSource=v.name;
          S.ocrCandidates=candidates;
          return expected;
        }
        if(candidates.length && confidence>=35){
          await w.terminate();
          S.ocrConfidence=confidence;
          S.ocrSource=v.name;
          S.ocrCandidates=candidates;
          return candidates[0];
        }
      }
      await w.terminate();
      S.ocrConfidence=bestConfidence;
      S.ocrCandidates=allCandidates.map(c=>c.value);
      if(allCandidates.length){
        allCandidates.sort((a,b)=>b.confidence-a.confidence);
        S.ocrSource=allCandidates[0].source;
        return allCandidates[0].value;
      }
    }catch(e){ console.warn('OCR error',e); }
  }
  return null;   // unreadable
}

/* ---------- RENDER VERIFY ---------- */
function renderVerify(t,ocrMatch,dateOK,ocrReadable){
  if(ocrReadable===undefined) ocrReadable=true;
  // ticket graphic number boxes
  const thainames={'0':'ศูนย์','1':'หนึ่ง','2':'สอง','3':'สาม','4':'สี่','5':'ห้า','6':'หก','7':'เจ็ด','8':'แปด','9':'เก้า'};
  const num=(t.number&&t.number!=='??????')?t.number:'------';
  document.getElementById('tnum-box').innerHTML=num.split('').map(d=>`<div class="d"><b>${d}</b><small>${thainames[d]||''}</small></div>`).join('');
  document.getElementById('tk-th-date').textContent=t.draw_date!=='—'?t.draw_date.replace('ก.ค.','กรกฎาคม').replace('ธ.ค.','ธันวาคม'):'—';
  document.getElementById('tk-en-date').textContent=t.draw_en||'—';
  document.getElementById('tk-series').textContent=t.series;
  document.getElementById('tk-set').textContent=t.set;
  document.getElementById('tk-barcode').textContent=(t.alt&&t.alt.length? t.alt : t.barcode);
  document.getElementById('st-price').textContent=t.price;
  document.getElementById('st-num').textContent=num;
  document.getElementById('st-date').textContent=t.draw_date;
  document.getElementById('st-set').textContent=t.series+'/'+t.set;

  // determine overall outcome (priority order)
  let outcome='ok', statusText='พร้อมบันทึก';
  const barcodeOK=t.status!=='invalid';
  const imgBad = S.aiScreenshot || (S.aiScore!=null && S.aiScore<55);
  if(!barcodeOK){outcome='bad';statusText='ไม่พบสลากในระบบ';}
  else if(t.is_claimed){outcome='warn';statusText='ขึ้นเงินรางวัลแล้ว';}
  else if(!ocrReadable){outcome='review';statusText='ภาพไม่ชัด ถ่ายใหม่';}
  else if(!ocrMatch){outcome='bad';statusText='เลขสลากไม่ตรงกัน';}
  else if(imgBad){outcome='bad';statusText='ภาพอาจไม่ใช่สลากจริง';}          // (B) image authenticity
  else if(!dateOK){outcome='bad';statusText='เกินระยะขึ้นเงิน (2 ปี)';}

  const tone = outcome==='ok'?'ok':outcome==='warn'||outcome==='review'?'warn':'bad';
  set('ck-status',statusText, tone);
  const icon=document.getElementById('ck-ic');
  icon.className='cic '+tone;
  icon.innerHTML = outcome==='ok'?'<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>'
    : tone==='warn'?'<svg viewBox="0 0 24 24"><path d="M12 3l9 16H3zM12 9v5M12 17h.01"/></svg>'
    : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>';
  set('ck-barcode', barcodeOK?'พบข้อมูล':'ไม่พบข้อมูล', barcodeOK?'ok':'bad');
  if(!ocrReadable) set('ck-ocr','อ่านเลขไม่ได้ — ถ่ายใหม่','warn');
  else set('ck-ocr', ocrMatch?('ยืนยันจากบาร์โค้ด ('+(S.ocr||num)+')'):('ไม่พบเลขในฐานข้อมูล'), ocrMatch?'ok':'bad');
  // (B) AI image-authenticity row
  if(S.aiScore!=null){
    const good=!imgBad;
    set('ck-ai', (good?'ผ่าน':'น่าสงสัย')+' · '+S.aiScore+'% ('+(S.aiReason||'')+')', good?'ok':'bad');
  }
  set('ck-drawdate', dateOK?('ขึ้นเงินได้ถึง '+deadlineText(t)):'เกิน 2 ปี หมดสิทธิ์', dateOK?'ok':'bad');

  // ownership status
  const owner=t.owner_id||null;
  const conflict = owner && String(owner)!==S.userId;
  if(!owner) set('ck-owner','ยังไม่ถูกเก็บสิทธิ์','ok');
  else if(String(owner)===S.userId) set('ck-owner','สลากของคุณ','ok');
  else set('ck-owner','ถูกเก็บสิทธิ์แล้ว ('+(t.owner_mask||maskUserJS(owner))+')','bad');

  const save=document.getElementById('save-btn');
  let blocked = (outcome==='bad'||outcome==='review'||t.is_claimed);
  if(S.mode==='collect' && conflict) blocked=true;              // can't collect someone else's ticket
  if(blocked){save.style.opacity=.5;save.style.pointerEvents='none';
    save.textContent = t.is_claimed?'สลากนี้ขึ้นเงินแล้ว'
      : (S.mode==='collect'&&conflict)?'สลากถูกเก็บสิทธิ์โดยผู้อื่น'
      : outcome==='review'?'ถ่ายภาพใหม่ให้ชัดขึ้น' : 'ไม่สามารถบันทึกได้';}
  else{save.style.opacity=1;save.style.pointerEvents='all';
    save.textContent = S.mode==='verify' ? 'ดูผลการตรวจรางวัล' : 'เก็บสิทธิ์เข้าบัญชี';}
  go('verify');
}
function set(id,txt,cls){const e=document.getElementById(id);e.textContent=txt;e.className='cval '+(cls||'');}

/* ---------- SCAN MODE ACTIONS ---------- */
// Primary button on the verify screen. Verify mode = show result only (no ownership).
// Collect mode = register ownership first, then show the prize.
function onPrimary(){ if(S.mode==='verify') showPrize(false); else onCollect(); }

// SCAN MODE 2: take ownership. Handles the ownership-conflict case.
async function onCollect(){
  const t=S.ticket; if(!t) return;
  if(S.collectBusy) return;
  const save=document.getElementById('save-btn');
  const localDuplicate = S.saved.some(x=>x.barcode===t.barcode || x.number===t.number);
  if(localDuplicate || (t.owner_id && String(t.owner_id)===S.userId)){
    set('ck-owner','สลาก/เลขนี้ถูกเก็บเข้าบัญชีคุณแล้ว','bad');
    set('ck-status','ไม่สามารถเก็บซ้ำได้','warn');
    if(save){ save.style.opacity=.5; save.style.pointerEvents='none'; save.textContent='สลาก/เลขนี้ถูกเก็บแล้ว'; }
    toast('ไม่สามารถเก็บซ้ำได้');
    return;
  }
  S.collectBusy=true;
  if(save){ save.style.opacity=.55; save.style.pointerEvents='none'; save.textContent='กำลังเก็บสิทธิ์...'; }
  const ownerCheck=await apiOwnershipValidate(t.barcode);
  if(ownerCheck.ok || ownerCheck.status==='already_yours'){
    set('ck-owner','สลากนี้อยู่ในบัญชีคุณแล้ว','bad');
    set('ck-status','ไม่สามารถเก็บซ้ำได้','warn');
    if(save){ save.style.opacity=.5; save.style.pointerEvents='none'; save.textContent='สลากนี้ถูกเก็บแล้ว'; }
    toast('สลากนี้อยู่ในบัญชีคุณแล้ว');
    S.collectBusy=false;
    return;
  }
  if(ownerCheck.status==='ownership_conflict'){
    set('ck-owner',ownerStatusText(ownerCheck.status, ownerCheck.owner_mask),'bad');
    set('ck-status','เจ้าของสิทธิ์ไม่ตรงกัน','warn');
    if(save){ save.style.opacity=.5; save.style.pointerEvents='none'; save.textContent='บัญชีนี้เก็บไม่ได้'; }
    toast('บัญชีนี้ไม่ใช่เจ้าของสลาก');
    S.collectBusy=false;
    return;
  }
  let resp=null;
  if(API_BASE || location.protocol.startsWith('http')){
    try{ const r=await fetch(`${API_BASE}/api/ownership`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(geoBody({barcode:t.barcode,user_id:S.userId}))});
      resp=await r.json(); }catch(e){}
  }
  if(!resp){ // offline fallback
    if(t.owner_id && String(t.owner_id)!==S.userId) resp={status:'ownership_conflict',owner_mask:maskUserJS(t.owner_id)};
    else { t.owner_id=S.userId; resp={status:'registered'}; }
  }
  if(resp.status==='already_yours' || resp.status==='duplicate_number_collected'){
    set('ck-owner', resp.status==='duplicate_number_collected'?'เลขสลากนี้ถูกเก็บเข้าบัญชีคุณแล้ว':'สลากนี้อยู่ในบัญชีคุณแล้ว','bad');
    set('ck-status','ไม่สามารถเก็บซ้ำได้','warn');
    const s=document.getElementById('save-btn'); s.style.opacity=.5; s.style.pointerEvents='none'; s.textContent='สลาก/เลขนี้ถูกเก็บแล้ว';
    toast('ไม่สามารถเก็บซ้ำได้'); S.collectBusy=false; return;
  }
  if(resp.status==='ownership_conflict'){
    set('ck-owner','⚠️ ถูกเก็บสิทธิ์โดย '+(resp.owner_mask||'บัญชีอื่น'),'bad');
    set('ck-status','สิทธิ์ซ้ำ — ส่งตรวจสอบ (review)','warn');
    const s=document.getElementById('save-btn'); s.style.opacity=.5; s.style.pointerEvents='none'; s.textContent='สลากถูกเก็บสิทธิ์แล้ว';
    toast('❌ สลากนี้ถูกเก็บสิทธิ์โดยบัญชีอื่นแล้ว'); S.collectBusy=false; return;
  }
  if(resp.ticket) S.ticket={...t,...resp.ticket};
  else S.ticket={...t,owner_id:S.userId};
  toast(resp.status==='already_yours'?'สลากนี้อยู่ในบัญชีคุณแล้ว':'เก็บสิทธิ์เข้าบัญชีสำเร็จ ✓');
  await showPrize(true);
  S.collectBusy=false;
}

/* ---------- PRIZE ---------- */
function saveTicket(){ showPrize(true); }          // back-compat
async function showPrize(register){
  const t=S.ticket; if(!t)return;
  if(register){
    await apiPost('/api/scans',geoBody({barcode:t.barcode,user_id:S.userId,action_type:'collect',ocr_result:S.ocr,result_status:'ok'}));
    if(!S.saved.some(x=>x.barcode===t.barcode || x.number===t.number)){
      S.saved.unshift({...t,owner_id:t.owner_id||S.userId,savedAt:new Date().toLocaleDateString('th-TH'),geo:S.geo});
    }
  }
  const win=t.prize_type&&t.prize_amount>0;
  document.getElementById('prize-title').textContent=win?'ยินดีด้วย!':'ตรวจผลรางวัลแล้ว';
  document.getElementById('prize-sub').textContent=win?('สลากของคุณถูก'+t.prize_type):'สลากของคุณไม่ถูกรางวัลในงวดนี้';
  document.getElementById('prize-amt').innerHTML=win?(t.prize_amount.toLocaleString('th-TH')+'<small>บาท</small>'):'—';
  document.getElementById('pd-num').textContent=t.number;
  document.getElementById('pd-date').textContent=t.draw_date;
  document.getElementById('pd-type').textContent=t.prize_type||'ไม่ถูกรางวัล';
  document.getElementById('pd-status').textContent=win?'พร้อมขึ้นเงิน':'ไม่ถูกรางวัล';
  document.getElementById('pd-status').className='dv '+(win?'g':'ink');
  document.getElementById('cl-amt').textContent=(win?t.prize_amount.toLocaleString('th-TH'):'0')+'.00 บาท';
  const canClaim = win && t.owner_id && String(t.owner_id)===String(S.userId);
  document.getElementById('prize-claim-btn').style.display=canClaim?'flex':'none';
  makeConfetti(win);
  renderSaved();
  go('prize');
}
function makeConfetti(win){
  const c=document.getElementById('confetti');if(!win){c.innerHTML='';return;}
  const cols=['#F4B821','#1B62D6','#18A957','#7FB0F5','#C7A2F0'];
  c.innerHTML=Array.from({length:26}).map(()=>{const x=Math.random()*100,y=Math.random()*60,col=cols[Math.floor(Math.random()*cols.length)],r=Math.random()*360;return `<i style="left:${x}%;top:${y}%;background:${col};transform:rotate(${r}deg)"></i>`}).join('');
}

/* ---------- PIN + SUCCESS ---------- */
async function beginClaim(){
  const t=S.ticket; if(!t) return;
  const validation=await apiOwnershipValidate(t.barcode);
  if(!validation.ok){
    toast(ownerStatusText(validation.status, validation.owner_mask));
    if(validation.status==='ownership_required'){
      go('verify');
      set('ck-owner','ต้องเก็บสิทธิ์สลากก่อนขึ้นเงิน','warn');
      set('ck-status','ยังไม่ได้ยืนยันเจ้าของสิทธิ์','warn');
    }
    return;
  }
  openPin();
}
function openPin(){S.pin='';drawPin();document.getElementById('pin-ov').classList.add('show');}
function closePin(){document.getElementById('pin-ov').classList.remove('show');S.pin='';drawPin();}
function pin(d){if(S.pin.length>=6)return;S.pin+=d;drawPin();if(S.pin.length===6)setTimeout(()=>{closePin();finishClaim();},260);}
function pinDel(){S.pin=S.pin.slice(0,-1);drawPin();}
function drawPin(){document.querySelectorAll('#pin-dots i').forEach((el,i)=>el.classList.toggle('on',i<S.pin.length));}
async function finishClaim(){
  const t=S.ticket;
  const validation=await apiOwnershipValidate(t.barcode);
  if(!validation.ok){
    toast(ownerStatusText(validation.status, validation.owner_mask));
    return;
  }
  const now=new Date();
  const ref='PTG-GLO-'+String(now.getFullYear()+543).slice(2)+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0');
  document.getElementById('sc-ref').textContent=ref;
  document.getElementById('sc-time').textContent=now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.';
  document.getElementById('sc-geo').textContent = S.geo ? (S.geo.lat.toFixed(4)+', '+S.geo.lng.toFixed(4)+' (±'+S.geo.acc+'ม.)') : 'ไม่ได้อนุญาตตำแหน่ง';
  await apiPost('/api/claims',geoBody({barcode:t.barcode,user_id:S.userId,amount:t.prize_amount,bank:'กรุงไทย',ref}));
  if(t) t.is_claimed=true;
  go('success');
}

/* ---------- SAVED LIST ---------- */
function renderSaved(){
  const list=document.getElementById('tkt-list'),empty=document.getElementById('tkt-empty');
  if(!S.saved.length){list.innerHTML='';empty.style.display='flex';return;}
  empty.style.display='none';
  list.innerHTML=S.saved.map(t=>`<div class="tkt-item" onclick="toast('เลขสลาก ${t.number}')">
    <div style="flex:1"><div class="tnum">${t.number}</div><div class="tsub">งวด ${t.draw_date} · บันทึก ${t.savedAt}</div></div>
    <span class="tbadge ${t.prize_type?'won':'saved'}">${t.prize_type?'🏆 ถูกรางวัล':'บันทึกแล้ว'}</span>
  </div>`).join('');
}

function resetFlow(){S.barcode=null;S.frontImg=null;S.backImg=null;S.ocr=null;
  S.frontPlaceholder=false;S.backPlaceholder=false;S.aiScore=null;S.aiReason=null;S.aiScreenshot=false;S.ocrConfidence=null;
  ['front','back'].forEach(s=>{document.getElementById(s+'-thumb').style.display='none';document.getElementById(s+'-next').classList.remove('on');});}

/* ---------- boot ---------- */
function setUser(id){
  S.userId=String(id);
  localStorage.setItem('glo_user_id',S.userId);
  S.saved=[];
  renderSaved();
  const label=document.getElementById('active-user-label');
  if(label) label.textContent='User '+S.userId;
  toast('เปลี่ยนผู้ใช้เป็น '+S.userId);
}
function applyUserSwitcher(){
  const host=document.querySelector('#home .top-header');
  if(!host || document.getElementById('user-switcher')) return;
  const wrap=document.createElement('div');
  wrap.id='user-switcher';
  wrap.style.cssText='display:flex;flex-direction:column;align-items:flex-end;gap:5px;font-size:11px;color:#6B7A99;font-weight:700';
  wrap.innerHTML=`<div id="active-user-label">User ${S.userId}</div>
    <select aria-label="Demo user" style="border:1px solid #DCEAFD;border-radius:10px;padding:6px 8px;background:#fff;color:#1A2B4A;font-weight:700">
      <option value="0812345678">User A</option>
      <option value="0898887777">User B</option>
      <option value="0900000000">User C</option>
    </select>`;
  const select=wrap.querySelector('select');
  select.value=S.userId;
  select.onchange=()=>setUser(select.value);
  host.appendChild(wrap);
}
function applyVerificationCopy(){
  const l3=document.getElementById('l3');
  if(l3) l3.textContent='อ่านเลขจากภาพ (OCR)';
  const ck=document.getElementById('ck-ocr');
  if(ck){
    ck.textContent='รออ่านเลขจากภาพ';
    const row=ck.closest('.crow');
    const label=row&&row.querySelector('.clabel');
    if(label) label.textContent='เลขสลากตรงกัน (OCR)';
  }
  document.querySelectorAll('#capfront .cap-hint').forEach(el=>{
    el.textContent='วางสลากทั้งใบให้อยู่ในกรอบ แสงไม่สะท้อน และเห็นลายกระดาษ/บาร์โค้ดชัดเจน';
  });
}
function applyHomeScanModes(){
  const cards=document.querySelectorAll('.quick-row .quick-card');
  if(cards[0]){
    cards[0].onclick=()=>startScan('verify');
    const title=cards[0].querySelector('.qt'), sub=cards[0].querySelector('.qs');
    if(title) title.textContent='สแกนตรวจสลาก';
    if(sub) sub.innerHTML='เช็กรหัส เลขสลาก<br>และภาพว่าเป็นสลากจริง';
  }
  if(cards[1]){
    cards[1].onclick=()=>startScan('collect');
    const title=cards[1].querySelector('.qt'), sub=cards[1].querySelector('.qs');
    if(title) title.textContent='สแกนเก็บสิทธิ์';
    if(sub) sub.innerHTML='ตรวจซ้ำก่อนเก็บ<br>ไม่ให้เก็บสลากเดิม';
  }
  document.querySelectorAll('.hero-cta').forEach(btn=>{
    btn.onclick=()=>startScan('verify');
    btn.firstChild && (btn.firstChild.textContent='สแกนตรวจเลย ');
  });
}
applyVerificationCopy();
applyUserSwitcher();
applyHomeScanModes();
const claimBtn=document.getElementById('prize-claim-btn'); if(claimBtn) claimBtn.onclick=beginClaim;
renderSaved();
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}
setTimeout(()=>toast('💡 สแกนสลากจริงได้เลย · ข้อมูลจริง 21 ใบพร้อมในระบบ'),1200);
