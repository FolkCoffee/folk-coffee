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
