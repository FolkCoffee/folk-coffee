// FOLk gift vouchers: codes, dates, money and the shareable voucher image.

export const VOUCHER_QR_PREFIX = 'folkv:';
export const VOUCHER_YEARS = 5;          // Irish law: at least 5 years
export const AMOUNTS = [10, 15, 20, 25, 50];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O/0, I/1/L

export function newCode() {
  const r = crypto.getRandomValues(new Uint32Array(8));
  const ch = Array.from(r, (n) => ALPHABET[n % ALPHABET.length]).join('');
  return `FOLK-${ch.slice(0, 4)}-${ch.slice(4)}`;
}

// Accepts "folk-abcd-2345", "ABCD 2345", "abcd2345" … → "FOLK-ABCD-2345"
export function normalizeCode(input) {
  let s = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.startsWith('FOLK')) s = s.slice(4);
  return s.length === 8 ? `FOLK-${s.slice(0, 4)}-${s.slice(4)}` : null;
}

export const euro = (cents) => '€' + (cents / 100).toFixed(cents % 100 ? 2 : 0);
export function toCents(str) {
  const n = parseFloat(String(str).replace(',', '.').replace(/[^0-9.]/g, ''));
  return isFinite(n) ? Math.round(n * 100) : NaN;
}

// Today's date in Ireland as YYYY-MM-DD (en-CA formats dates that way)
export const todayISO = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export function addYears(iso, years) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y + years, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) dt.setUTCDate(0); // 29 Feb → 28 Feb
  return dt.toISOString().slice(0, 10);
}
export const formatDate = (iso) => iso ? iso.split('-').reverse().join('/') : '';
export const isExpired = (v, now) => v.expires < todayISO(now);

/* ───────── Shareable voucher image (1080 × 1350, matches the email design) ───────── */
const INK = '#111110', PAPER = '#f5f3ee', MUTED = '#55524b', BODY = '#33312c';

function loadImage(src) {
  return new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/), lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fit(ctx, text, font, size, maxW) {
  let s = size; ctx.font = font.replace('{s}', s);
  while (ctx.measureText(text).width > maxW && s > 20) { s -= 2; ctx.font = font.replace('{s}', s); }
  return s;
}
function qrCanvas(text) {
  const holder = document.createElement('div');
  new QRCode(holder, { text, width: 360, height: 360, colorDark: INK, colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  return holder.querySelector('canvas');
}

export async function voucherImage(v, logoSrc) {
  const SAIRA = '"Saira Condensed", "Arial Narrow", sans-serif', INTER = '"Inter Tight", system-ui, sans-serif';
  await Promise.all([
    document.fonts.load(`600 100px ${SAIRA}`), document.fonts.load(`400 50px ${SAIRA}`),
    document.fonts.load(`400 20px ${INTER}`), document.fonts.load(`600 20px ${INTER}`),
  ]).catch(() => {});
  const W = 1080, H = 1350, P = 88;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  // background + black header
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 560);

  // logo (white) + "Coffee"
  try {
    const logo = await loadImage(logoSrc);
    const lh = 48, lw = logo.width * lh / logo.height;
    const o = document.createElement('canvas'); o.width = lw; o.height = lh;
    const oc = o.getContext('2d'); oc.drawImage(logo, 0, 0, lw, lh);
    oc.globalCompositeOperation = 'source-in'; oc.fillStyle = '#fff'; oc.fillRect(0, 0, lw, lh);
    ctx.drawImage(o, P, 72);
    ctx.fillStyle = '#fff'; ctx.font = `400 50px ${SAIRA}`; ctx.fillText('Coffee', P + lw + 16, 118);
  } catch {
    ctx.fillStyle = '#fff'; ctx.font = `400 50px ${SAIRA}`; ctx.fillText('FOLk Coffee', P, 118);
  }
  ctx.fillStyle = '#bdbab3'; ctx.font = `400 20px ${INTER}`; ctx.textAlign = 'right';
  ctx.letterSpacing = '4px'; ctx.fillText('GIFT VOUCHER', W - P, 110); ctx.letterSpacing = '0px';

  // headline + amount
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `600 170px ${SAIRA}`;
  ctx.fillText('A COFFEE', P, 340); ctx.fillText('ON US.', P, 486);
  ctx.textAlign = 'right'; ctx.fillStyle = '#bdbab3'; ctx.font = `400 18px ${INTER}`;
  ctx.letterSpacing = '4px'; ctx.fillText('WORTH', W - P, 348); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff'; ctx.font = `600 150px ${SAIRA}`; ctx.fillText(euro(v.amount), W - P, 486);

  // to / from
  ctx.textAlign = 'left';
  const col2 = P + (W - 2 * P) / 2 + 16;
  ctx.fillStyle = MUTED; ctx.font = `400 18px ${INTER}`; ctx.letterSpacing = '4px';
  ctx.fillText('TO', P, 650); ctx.fillText('FROM', col2, 650); ctx.letterSpacing = '0px';
  ctx.fillStyle = INK;
  fit(ctx, v.toName || '–', `600 {s}px ${SAIRA}`, 52, col2 - P - 24); ctx.fillText(v.toName || '–', P, 708);
  fit(ctx, v.fromName || '–', `600 {s}px ${SAIRA}`, 52, W - P - col2); ctx.fillText(v.fromName || '–', col2, 708);

  // message
  let y = 790;
  if (v.message) {
    ctx.fillStyle = BODY; ctx.font = `400 30px ${INTER}`;
    for (const line of wrap(ctx, v.message, W - 2 * P).slice(0, 3)) { ctx.fillText(line, P, y); y += 44; }
  }

  // code box with QR
  const bx = P, by = 900, bw = W - 2 * P, bh = 250;
  roundRect(ctx, bx, by, bw, bh, 28); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = MUTED; ctx.font = `400 18px ${INTER}`; ctx.letterSpacing = '4px';
  ctx.fillText('VOUCHER CODE', bx + 40, by + 62); ctx.letterSpacing = '0px';
  ctx.fillStyle = INK;
  fit(ctx, v.code, `700 {s}px ui-monospace, Menlo, Consolas, monospace`, 54, bw - 300);
  ctx.fillText(v.code, bx + 40, by + 130);
  ctx.fillStyle = BODY; ctx.font = `400 22px ${INTER}`;
  ctx.fillText('Show this at the till · valid until', bx + 40, by + 190);
  const w1 = ctx.measureText('Show this at the till · valid until ').width;
  ctx.font = `600 22px ${INTER}`; ctx.fillText(formatDate(v.expires), bx + 40 + w1, by + 190);
  try { ctx.drawImage(qrCanvas(VOUCHER_QR_PREFIX + v.code), bx + bw - 40 - 190, by + 30, 190, 190); } catch {}

  // terms + footer
  ctx.fillStyle = '#45423c'; ctx.font = `400 20px ${INTER}`; y = 1210;
  const terms = `Spend it in store at FOLk Coffee, West End, Millstreet, all at once or over several visits: any balance stays on your voucher. Issued ${formatDate(v.issued)}, valid for 5 years. Not exchangeable for cash.`;
  for (const line of wrap(ctx, terms, W - 2 * P)) { ctx.fillText(line, P, y); y += 30; }
  ctx.fillStyle = '#cfcbc1'; ctx.fillRect(P, 1290, W - 2 * P, 1.5);
  ctx.fillStyle = '#45423c'; ctx.fillText('@folk.coffee', P, 1324);
  ctx.textAlign = 'right'; ctx.fillText('folkspecialitycoffee@gmail.com', W - P, 1324);

  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}

/* ───────── Voucher link (the voucher's details travel in the link itself:
   the page never reads the database, so customers can't look up other vouchers) ───────── */
export function voucherLink(v) {
  const data = { c: v.code, a: v.amount, t: v.toName || '', f: v.fromName || '', m: v.message || '', i: v.issued, e: v.expires };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return new URL('voucher.html?d=' + b64, location.href).href;
}
export function readVoucherLink(param) {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    const code = normalizeCode(d.c);
    if (!code || !(d.a > 0)) return null;
    return { code, amount: d.a, toName: d.t, fromName: d.f, message: d.m, issued: d.i, expires: d.e };
  } catch { return null; }
}

/* ───────── Voucher email (EmailJS) ───────── */
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
export function emailReady(cfg) {
  return !!(cfg && cfg.serviceId && cfg.templateId && cfg.publicKey && !/PASTE/.test(cfg.serviceId + cfg.templateId + cfg.publicKey));
}
function emailParams(v, to) {
  return {
    to_email: to.trim(),
    to_name: v.toName || 'there',
    from_name: v.fromName || 'Someone',
    amount: euro(v.amount),
    code: v.code,
    message: v.message || '',
    issued: formatDate(v.issued),
    expires: formatDate(v.expires),
    voucher_link: voucherLink(v),
  };
}
let sdk = null;
export async function sendVoucherEmail(v, to, cfg) {
  if (!emailReady(cfg)) throw new Error('Voucher emails are not set up yet');
  sdk ||= (await import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/+esm')).default;
  await sdk.send(cfg.serviceId, cfg.templateId, emailParams(v, to), { publicKey: cfg.publicKey });
}
// Fallback: a ready-made email in the phone's mail app
export function mailtoLink(v, to) {
  const p = emailParams(v, to);
  const subject = `${p.from_name} sent you a FOLk Coffee gift voucher`;
  const body = `Hi ${p.to_name},\n\n${p.from_name} sent you a ${p.amount} gift voucher for FOLk Coffee, West End, Millstreet.`
    + (p.message ? `\n\n"${p.message}"` : '')
    + `\n\nYour voucher code: ${p.code}\nValid until: ${p.expires}\n\nView and save your voucher: ${p.voucher_link}\n\nJust show the code at the till. You can spend it all at once or over several visits.\n\nSee you soon,\nFOLk Coffee`;
  return `mailto:${encodeURIComponent(p.to_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
