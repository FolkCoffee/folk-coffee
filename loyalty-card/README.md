# FOLk Coffee digital stamp card

Replaces the paper loyalty card. Customers keep their card on their phone; staff scan it at the till.

- **index.html**: the customer card (sign up, stamps, QR code to show at the till)
- **staff.html**: the till page (scan QR, +1 stamp, redeem free coffee, find by email)
**Live links (once Firebase is connected):**
- Customers: [folkcoffee.github.io/folk-coffee/loyalty-card/](https://folkcoffee.github.io/folk-coffee/loyalty-card/)
- Staff till: [folkcoffee.github.io/folk-coffee/loyalty-card/staff.html](https://folkcoffee.github.io/folk-coffee/loyalty-card/staff.html)

**Owner and contact:** FOLk Coffee, folkspecialitycoffee@gmail.com. The code lives in the [FolkCoffee/folk-coffee](https://github.com/FolkCoffee/folk-coffee) repository (moved from Kubo23609 in October 2026, which changed the web address from `kubo23609.github.io` to `folkcoffee.github.io`). The Firebase project is `folk-coffee`; add folkspecialitycoffee@gmail.com as an Owner under Project settings → Users and permissions.

It uses the FOLk logo from `../brand` and the app icons from `../icons`.

- **Reward:** 9 stamps, 10th coffee free (change `STAMPS_FOR_REWARD` in `config.js`)

## Try it first (demo mode)
Open the two links above in two tabs of the same browser. Sign up on the customer tab, then on the staff tab tap **Open the demo customer's card** and add stamps: they appear live on the customer card. Nothing is saved online in demo mode.

## Going live (about 20 minutes, free)

1. **Create a Firebase project.** Go to console.firebase.google.com → Add project → name it `folk-coffee`. You can turn off Google Analytics. The free Spark plan is plenty for a café.
2. **Turn on sign-in.** Build → Authentication → Get started → Sign-in method. Enable:
   - **Email/Password**, and inside it also tick **Email link (passwordless sign-in)**
   - **Google**
3. **Create the database.** Build → Firestore Database → Create database → choose a European location (e.g. `europe-west1`) → start in production mode. Then open the **Rules** tab, paste the whole of `firestore.rules`, and click **Publish**.
4. **Connect the app.** Project settings (gear icon) → Your apps → Web (`</>`) → register it. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `config.js`.
5. **Allow your website.** Authentication → Settings → Authorized domains → Add `folkcoffee.github.io` (and your own domain later, if you get one). After the repository moved, this replaced `kubo23609.github.io`.
6. **Make a staff login.** Authentication → Users → Add user (e.g. `till@folkcoffee.ie` + a strong password). Copy its **User UID**. Then in Firestore → Start collection → name it `staff` → Document ID = that UID → add any field (e.g. `name` = `Till`) → Save.
   Tip: if you sign in on `staff.html` before doing this, the page shows the UID for you to copy.
7. **Publish.** Commit the edited `config.js` to `main`. It goes live within a few minutes. Bookmark the staff link on the shop phone or tablet.

## Gift vouchers (staff only)
On the staff till, tap **Gift vouchers**:
- **New voucher:** choose the amount (€10–€50 or other), add To / From / message, tap Create. You get a unique code like `FOLK-ABCD-2345`, valid for 5 years (Irish law requires at least 5).
- **Giving it out:** paper voucher → write the code and dates on the back of the printed card. Digital → **Share digital voucher** makes an image (with a QR code) to send by email or WhatsApp.
- **Using it:** scan the QR on the digital voucher, or type the code, then enter the amount and tap **Take off**. It can be used over several visits; the balance and history are shown.
- Only accounts in the `staff` collection can see, create or use vouchers (enforced by `firestore.rules`). Balances can only go down and vouchers can't be deleted.
- **Emailing it:** type the customer's email when creating the voucher (or later, in the voucher's *Email* box). They get a FOLk-branded email with the code and a **View & save your voucher** link (`voucher.html`), which shows the voucher with its QR code. That page reads nothing from the database: the details travel in the link, and the till always checks the real balance.
- After updating, paste the new `firestore.rules` into Firebase → Firestore → Rules → Publish.

Voucher designs (printed DL card front/back and the email version) are on the FOLk Gift Vouchers design canvas.

## On the customer's card
- Vouchers emailed to a customer's address appear on their loyalty card (code, balance, expiry). Customers can also **add a paper voucher** by typing its code.
- When you scan a loyalty card at the till, that customer's vouchers show underneath: tap one to use it.

## Reports (staff only)
Till → **Reports**: stamps, free and birthday coffees, new customers, vouchers sold and spent for any period, plus the unspent voucher total (what you still owe in coffee). **Download voucher list** gives a spreadsheet for your accountant.
The first time, Firebase may ask for a one-time search index: the Reports page shows a button to open it. Click **Save** in Firebase and wait a few minutes.

## Voucher emails: one-time setup (EmailJS, free: 200 emails/month)
Until this is done, the till opens a ready-made email in the phone's mail app instead.
1. Sign up at [emailjs.com](https://www.emailjs.com) with folkspecialitycoffee@gmail.com.
2. **Email Services → Add New Service → Gmail → Connect Account**, choose folkspecialitycoffee@gmail.com and allow sending. Click **Create Service** and note the **Service ID**.
3. **Email Templates → Create New Template.**
   - Subject: `{{from_name}} sent you a FOLk Coffee gift voucher ☕`
   - Content: open the code view (`<>`) and paste everything from [`email-template.html`](email-template.html) (below its first comment).
   - To Email: `{{to_email}}` · From Name: `FOLk Coffee` · Reply To: `folkspecialitycoffee@gmail.com`
   - Save and note the **Template ID**.
4. **Account → General**: note the **Public Key**.
5. **Account → Security → API Settings**: make sure **Use Private Key** is *unticked* (with it ticked, emails sent from the website are blocked). Domain restriction is a paid feature; it isn't needed.
6. Put the three IDs into `emailjsConfig` in `config.js` (they're safe to be public).

## Print files
In [`print/`](print/):
- `folk-counter-sign-a4.pdf`: the designed counter sign, ready to print (A4, also fine scaled to A5)
- `folk-counter-sign-a4.png`: the same sign as a high-resolution image
- `folk-instagram-post.png`: square Instagram post announcing the digital card (1080×1080)
- `folk-loyalty-qr-sign.png`: simple printable sign (logo, QR code, "Scan for your digital coffee card")
- `folk-loyalty-qr.png` / `folk-loyalty-qr.svg`: the QR code on its own (SVG scales to any size for print shops or Canva)

The QR code opens https://folkcoffee.github.io/folk-coffee/loyalty-card/

## In the shop
- Print a small sign with a QR code linking to the customer page: "Ditch the paper card: scan to get your FOLk card".
- Customers can add the page to their home screen so it opens like an app.
- If a customer's phone is dead, find them by email on the staff page.
- Moving customers off paper: stamp their new digital card with however many stamps their paper card had, then take the paper card.

## Birthday coffee
- Customers can add their birthday (day and month only, no year) when signing up or later on their card.
- On their birthday the card shows a birthday message, and the staff page shows **Give birthday coffee**. It works once per birthday and doesn't touch their stamps.
- Customers can only set their birthday once, so nobody can change it daily for free coffees. If someone typed it wrong, fix it in Firestore → `cards` → their card → `birthday` (format `MM-DD`, e.g. `03-14`).

## Good to know
- Sign-in emails sometimes land in spam at first. You can edit the email text under Authentication → Templates.
- Every stamp and redeem is logged (who and when) under each card's `log` in Firestore.
- Customers can't give themselves stamps: the database rules only let staff accounts do that.
- If a staff phone is lost, delete that user in Authentication → Users and remove it from `staff`.
