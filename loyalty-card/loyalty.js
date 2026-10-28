import { firebaseConfig, STAMPS_FOR_REWARD } from './config.js';
import { newCode, todayISO, addYears, isExpired, VOUCHER_YEARS } from './vouchers.js';

export const GOAL = STAMPS_FOR_REWARD;
export const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PASTE');
export const QR_PREFIX = 'folk:';
const FULL_MSG = 'Card is full: redeem the free coffee first';

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

/* ───────────── Birthdays ("MM-DD", no year stored) ───────────── */
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Today's date in Ireland, whatever timezone the phone is set to.
export function todayIE(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now).map((x) => [x.type, x.value]));
  return { year: +p.year, mmdd: `${p.month}-${p.day}` };
}
export function isBirthdayToday(bday, now) {
  if (!bday) return false;
  const { year, mmdd } = todayIE(now);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return bday === mmdd || (bday === '02-29' && !leap && mmdd === '02-28');
}
export const birthdayCoffeeAvailable = (c, now) => isBirthdayToday(c.birthday, now) && c.birthdayYear !== todayIE(now).year;
export const formatBirthday = (b) => b ? `${+b.slice(3)} ${MONTHS[+b.slice(0, 2) - 1]}` : '';
export function validBirthday(b) {
  if (!/^\d{2}-\d{2}$/.test(b)) return false;
  const [m, d] = b.split('-').map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
// Fills day + month <select>s
export function fillBirthdayPickers(daySel, monSel) {
  daySel.innerHTML = '<option value="">Day</option>' + Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('');
  monSel.innerHTML = '<option value="">Month</option>' + MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
  return () => (daySel.value && monSel.value ? `${monSel.value.padStart(2, '0')}-${daySel.value.padStart(2, '0')}` : '');
}

export async function getBackend(role) {
  return DEMO ? demoBackend(role) : firebaseBackend();
}

/* ───────────── Firebase (live) ───────────── */
async function firebaseBackend() {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const cardRef = (uid) => F.doc(db, 'cards', uid);
  const here = () => location.origin + location.pathname;
  const toUser = (u) => (u ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null);

  return {
    demo: false,
    onAuth: (cb) => A.onAuthStateChanged(auth, (u) => cb(toUser(u))),
    isEmailLink: () => A.isSignInWithEmailLink(auth, location.href),
    async completeLink(email) {
      await A.signInWithEmailLink(auth, email, location.href);
      history.replaceState(null, '', location.pathname);
    },
    sendLink: (email) => A.sendSignInLinkToEmail(auth, email, { url: here(), handleCodeInApp: true }),
    google: () => A.signInWithPopup(auth, new A.GoogleAuthProvider()),
    staffSignIn: (email, pw) => A.signInWithEmailAndPassword(auth, email, pw),
    signOut: () => A.signOut(auth),
    async isStaff(uid) { return (await F.getDoc(F.doc(db, 'staff', uid))).exists(); },
    async getCard(uid) { const s = await F.getDoc(cardRef(uid)); return s.exists() ? s.data() : null; },
    createCard: (uid, name, email, birthday) => F.setDoc(cardRef(uid), {
      name, email, stamps: 0, totalStamps: 0, rewardsRedeemed: 0, ...(birthday ? { birthday } : {}),
      createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(),
    }),
    watchCard: (uid, cb) => F.onSnapshot(cardRef(uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
    addStamp: (uid, by) => F.runTransaction(db, async (t) => {
      const ref = cardRef(uid); const s = await t.get(ref);
      if (!s.exists()) throw new Error('No card found');
      const d = s.data();
      if (d.stamps >= GOAL) throw new Error(FULL_MSG);
      t.update(ref, { stamps: d.stamps + 1, totalStamps: (d.totalStamps || 0) + 1, updatedAt: F.serverTimestamp() });
      t.set(F.doc(F.collection(ref, 'log')), { type: 'stamp', by, at: F.serverTimestamp() });
    }),
    redeem: (uid, by) => F.runTransaction(db, async (t) => {
      const ref = cardRef(uid); const s = await t.get(ref);
      if (!s.exists()) throw new Error('No card found');
      const d = s.data();
      if (d.stamps < GOAL) throw new Error('Not enough stamps yet');
      t.update(ref, { stamps: 0, rewardsRedeemed: (d.rewardsRedeemed || 0) + 1, updatedAt: F.serverTimestamp() });
      t.set(F.doc(F.collection(ref, 'log')), { type: 'redeem', by, at: F.serverTimestamp() });
    }),
    setBirthday: (uid, birthday) => F.updateDoc(cardRef(uid), { birthday, updatedAt: F.serverTimestamp() }),
    redeemBirthday: (uid, by) => F.runTransaction(db, async (t) => {
      const ref = cardRef(uid); const s = await t.get(ref);
      if (!s.exists()) throw new Error('No card found');
      const d = s.data();
      if (!birthdayCoffeeAvailable(d)) throw new Error('No birthday coffee available today');
      t.update(ref, { birthdayYear: todayIE().year, rewardsRedeemed: (d.rewardsRedeemed || 0) + 1, updatedAt: F.serverTimestamp() });
      t.set(F.doc(F.collection(ref, 'log')), { type: 'birthday', by, at: F.serverTimestamp() });
    }),
    async findByEmail(email) {
      const q = F.query(F.collection(db, 'cards'), F.where('email', '==', email.trim().toLowerCase()));
      return (await F.getDocs(q)).docs.map((d) => ({ uid: d.id, ...d.data() }));
    },

    /* gift vouchers (staff only: enforced by the database rules) */
    async createVoucher({ amount, toName, fromName, message }, by) {
      for (let tries = 0; tries < 5; tries++) {
        const code = newCode(), ref = F.doc(db, 'vouchers', code);
        const issued = todayISO();
        const v = { code, amount, balance: amount, toName, fromName, message, issued, expires: addYears(issued, VOUCHER_YEARS), createdBy: by };
        const ok = await F.runTransaction(db, async (t) => {
          if ((await t.get(ref)).exists()) return false;
          t.set(ref, { ...v, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() });
          t.set(F.doc(F.collection(ref, 'log')), { type: 'issue', amount, by, at: F.serverTimestamp() });
          return true;
        });
        if (ok) return v;
      }
      throw new Error('Could not create a voucher code, try again');
    },
    watchVoucher: (code, cb) => F.onSnapshot(F.doc(db, 'vouchers', code), (s) => cb(s.exists() ? s.data() : null), () => cb(null)),
    redeemVoucher: (code, amount, by) => F.runTransaction(db, async (t) => {
      const ref = F.doc(db, 'vouchers', code), s = await t.get(ref);
      if (!s.exists()) throw new Error('No voucher with that code');
      const d = s.data();
      if (isExpired(d)) throw new Error('This voucher has expired');
      if (!(amount > 0)) throw new Error('Enter an amount');
      if (amount > d.balance) throw new Error('That is more than the voucher balance');
      t.update(ref, { balance: d.balance - amount, updatedAt: F.serverTimestamp() });
      t.set(F.doc(F.collection(ref, 'log')), { type: 'redeem', amount, by, at: F.serverTimestamp() });
    }),
    async voucherLog(code) {
      const q = F.query(F.collection(db, 'vouchers', code, 'log'), F.orderBy('at', 'desc'), F.limit(30));
      return (await F.getDocs(q)).docs.map((d) => { const x = d.data(); return { ...x, at: x.at?.toDate?.() || null }; });
    },
    async recentVouchers() {
      const q = F.query(F.collection(db, 'vouchers'), F.orderBy('createdAt', 'desc'), F.limit(20));
      return (await F.getDocs(q)).docs.map((d) => d.data());
    },
  };
}

/* ───────────── Demo (this browser only) ───────────── */
function demoBackend(role) {
  const K = 'folk-demo-cards', UK = 'folk-demo-user-' + role;
  let mem = {};
  const read = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return mem; } };
  const watchers = new Set();
  const emit = () => watchers.forEach((f) => f());
  const write = (c) => { mem = c; store.set(K, JSON.stringify(c)); emit(); };
  addEventListener('storage', (e) => { if (e.key === K) emit(); });

  const authCbs = new Set();
  let user = null; try { user = JSON.parse(store.get(UK)); } catch {}
  const setUser = (u) => { user = u; u ? store.set(UK, JSON.stringify(u)) : store.del(UK); authCbs.forEach((f) => f(u)); };
  const VK = 'folk-demo-vouchers';
  const readV = () => { try { return JSON.parse(localStorage.getItem(VK)) || {}; } catch { return {}; } };
  const writeV = (v) => { store.set(VK, JSON.stringify(v)); emit(); };
  addEventListener('storage', (e) => { if (e.key === VK) emit(); });
  const mutate = (uid, fn) => { const c = read(); const d = c[uid]; if (!d) throw new Error('No card found'); fn(d); write(c); };

  return {
    demo: true,
    onAuth(cb) { authCbs.add(cb); setTimeout(() => cb(user)); return () => authCbs.delete(cb); },
    isEmailLink: () => false,
    async completeLink() {},
    async sendLink(email) { setUser({ uid: 'demo-customer', email, name: '' }); },
    async google() { setUser({ uid: 'demo-customer', email: 'demo@example.com', name: 'Demo Customer' }); },
    async staffSignIn(email) { setUser({ uid: 'demo-staff', email }); },
    async signOut() { setUser(null); },
    async isStaff() { return role === 'staff'; },
    async getCard(uid) { return read()[uid] || null; },
    async createCard(uid, name, email, birthday) { const c = read(); c[uid] = { name, email, stamps: 0, totalStamps: 0, rewardsRedeemed: 0, ...(birthday ? { birthday } : {}) }; write(c); },
    watchCard(uid, cb) { const f = () => cb(read()[uid] || null); watchers.add(f); f(); return () => watchers.delete(f); },
    async addStamp(uid) { mutate(uid, (d) => { if (d.stamps >= GOAL) throw new Error(FULL_MSG); d.stamps++; d.totalStamps++; }); },
    async redeem(uid) { mutate(uid, (d) => { if (d.stamps < GOAL) throw new Error('Not enough stamps yet'); d.stamps = 0; d.rewardsRedeemed++; }); },
    async setBirthday(uid, b) { mutate(uid, (d) => { if (d.birthday && role !== 'staff') throw new Error('Birthday already set'); d.birthday = b; }); },
    async redeemBirthday(uid) { mutate(uid, (d) => { if (!birthdayCoffeeAvailable(d)) throw new Error('No birthday coffee available today'); d.birthdayYear = todayIE().year; d.rewardsRedeemed++; }); },
    async findByEmail(email) {
      const e = email.trim().toLowerCase();
      return Object.entries(read()).filter(([, d]) => d.email === e).map(([uid, d]) => ({ uid, ...d }));
    },

    /* gift vouchers */
    async createVoucher({ amount, toName, fromName, message }, by) {
      if (role !== 'staff') throw new Error('Staff only');
      const all = readV(); let code; do { code = newCode(); } while (all[code]);
      const issued = todayISO();
      const v = { code, amount, balance: amount, toName, fromName, message, issued, expires: addYears(issued, VOUCHER_YEARS), createdBy: by, createdAt: Date.now() };
      all[code] = { ...v, log: [{ type: 'issue', amount, by, at: Date.now() }] }; writeV(all);
      return v;
    },
    watchVoucher(code, cb) { const f = () => cb(readV()[code] || null); watchers.add(f); f(); return () => watchers.delete(f); },
    async redeemVoucher(code, amount, by) {
      const all = readV(), d = all[code];
      if (!d) throw new Error('No voucher with that code');
      if (isExpired(d)) throw new Error('This voucher has expired');
      if (!(amount > 0)) throw new Error('Enter an amount');
      if (amount > d.balance) throw new Error('That is more than the voucher balance');
      d.balance -= amount; d.log.push({ type: 'redeem', amount, by, at: Date.now() }); writeV(all);
    },
    async voucherLog(code) { return (readV()[code]?.log || []).slice().reverse().map((x) => ({ ...x, at: new Date(x.at) })); },
    async recentVouchers() { return Object.values(readV()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20); },
  };
}

/* ───────────── Shared UI bits ───────────── */
const CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2.5M12 3v2.5"/></svg>';

export function renderStamps(el, count, prev) {
  el.innerHTML = '';
  for (let i = 1; i <= GOAL + 1; i++) {
    const s = document.createElement('div');
    const free = i === GOAL + 1;
    s.className = 'slot' + (free ? ' free' : '') + (i <= count ? ' on' : '') + (free && count >= GOAL ? ' ready' : '');
    if (i <= count) s.innerHTML = CUP;
    else s.textContent = free ? 'FREE' : i;
    if (prev != null && i > prev && i <= count) s.classList.add('pop');
    el.appendChild(s);
  }
}

export function toast(msg, kind = '') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast show ' + kind;
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
