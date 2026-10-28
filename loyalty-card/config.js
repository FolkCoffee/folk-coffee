// ─────────────────────────────────────────────────────────────
//  FOLk Coffee loyalty card — settings
//  Paste your Firebase web config below (see README.md, step 4).
//  While apiKey still says PASTE_..., the app runs in DEMO mode
//  (everything stays in this browser, nothing is saved online).
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyDWjJ85PQWdEC3-UXel3nQSv5QNRJK7H9U",
  authDomain: "folk-coffee.firebaseapp.com",
  projectId: "folk-coffee",
  appId: "1:713201566967:web:2037390bb3f342d3cbbff2",
};

// Stamps needed for a free coffee (the free one is the next one).
export const STAMPS_FOR_REWARD = 9;

// Voucher emails (EmailJS, free plan). Paste the three IDs from emailjs.com
// (see README → "Voucher emails"). While they say PASTE_..., the till offers
// a ready-made email in the phone's mail app instead.
export const emailjsConfig = {
  serviceId: "PASTE_SERVICE_ID",
  templateId: "PASTE_TEMPLATE_ID",
  publicKey: "PASTE_PUBLIC_KEY",
};
