# FOLk Coffee app

**Open the app: [kubo23609.github.io/folk-coffee](https://kubo23609.github.io/folk-coffee/)**

Bake, cost and production planner for FOLk Speciality Coffee. It is one self-contained web page, `index.html`, that runs in any modern browser.

## What it does

- **Today:** first start time and a ready check (what to bake, when to start, ingredients ticked off, oven capacity, expected profit), the to-make list, pickups and end-of-day sales.
- **Kitchen board:** To do, Doing and Done cards for every production step, with a big-screen mode for a tablet beside the oven.
- **Orders:** week view, customer orders with pickup time and notes, daily targets, a sales forecast based on past sales, and sales recording.
- **Recipes:** baker's percentages or amounts, weight per unit or units per batch, portions, photos, oven trays and temperature, saved recipe versions you can roll back to, a printable recipe, and cook mode with timers.
- **Costs:** ingredient prices, allergens and waste, plus margins across the menu.
- **Print:** bake plan with shopping list and oven loads, product labels, allergen sheet, and a chalkboard-style menu board.

## Using it

The app is live at [kubo23609.github.io/folk-coffee](https://kubo23609.github.io/folk-coffee/), published with GitHub Pages from the `main` branch. Every change pushed to `main` goes live within a few minutes.

On a phone or tablet, open that address and choose **Add to Home Screen** (iPhone: Share menu; Android: ⋮ menu). It then opens full screen with the FOLk icon, like an app.

## Loyalty card

The digital stamp card that replaces paper loyalty cards is in [`loyalty-card/`](loyalty-card/): [customer card](https://kubo23609.github.io/folk-coffee/loyalty-card/) and [staff till](https://kubo23609.github.io/folk-coffee/loyalty-card/staff.html). Setup steps are in its README.

## Your data

Everything you enter is saved in the browser on the device you use, and never in this repository. To share it between your phone, tablet and laptop, sign in to sync (see below). In **Settings → Backup**, press **Save backup** to download a backup file, and keep it somewhere safe such as Google Drive. **Load backup** restores it, on the same device or another one. The Today screen reminds you when your last backup is more than a week old.

## Syncing between devices

The planner can keep your phone, tablet and laptop in step through a free [Supabase](https://supabase.com) project:

1. Create a Supabase project.
2. In the SQL Editor, run `supabase-setup.sql` from this repository. It creates one private table that only your signed-in account can read or change.
3. Copy the project URL and the publishable key, and enter them under **Settings → Sync between devices** (or have them built into `index.html`).
4. Create an account in the planner on your main device first, then sign in with the same email and password on the other devices.
5. In Supabase, turn off new sign-ups once your account exists.

When you sign in on a device for the first time, it switches to the synced data and keeps its earlier data, which you can restore from the sync settings. If two devices change something at the same moment, the latest change wins.

Food labelling and allergen requirements in Ireland are set by the FSAI. Check your labels and allergen sheet with them or your local environmental health officer before selling.
