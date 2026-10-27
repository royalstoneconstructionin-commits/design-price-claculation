# Building Design Cost Calculator

A simple, mobile-friendly Next.js 15 website that calculates building design charges floor by floor
and creates a quotation (PDF, print, copy, WhatsApp).

## Where to extract and how to run

1. Install **Node.js 20 or newer** (LTS) from https://nodejs.org (one time only).
2. **Extract the zip anywhere you like**, for example:
   - Windows: `C:\Projects\`
   - Mac/Linux: `~/Projects/`

   You will get a folder called `building-design-calculator`.
3. Open a terminal **inside that folder**.
   - Windows: open the folder in File Explorer, click the address bar, type `cmd`, press Enter.
   - Mac: right-click the folder, choose "New Terminal at Folder".
4. Run these commands:

```bash
npm install      # first time only, needs internet
npm run dev      # starts the website
```

5. Open **http://localhost:3000** in your browser.

To see it on your phone: connect the phone to the same Wi-Fi and open the "Network" address
that `npm run dev` prints (for example `http://192.168.1.10:3000`).

### Other commands

| Command | What it does |
|---|---|
| `npm test` | Runs the pricing tests |
| `npm run typecheck` | Checks TypeScript |
| `npm run build` then `npm start` | Production build and run |

To put it online, upload the folder to GitHub and import it in Vercel (free). No settings needed.

## Change your rates and business details

- **Rates:** `src/lib/pricing-config.ts` (the only place prices live).
- **Company name, phone, email, address, logo letters, payment terms, notes, validity days:** `src/lib/branding.ts`.

## How pricing works

**Original quotation** – every rate is applied to the total area of all floors (G+1 on 1,200 sqft = ₹32,200).

**Unique design** – architecture is charged only on new plans; repeated plans cost ₹0 for architecture
(configurable). Structural and electrical/plumbing are still charged for every physical floor.

**Additional floor service (₹4/sqft)** – the reference quotation is ambiguous, so the area it applies to is
selectable under *More options*. The default convention is: total area of every floor from the second floor onward.
Choose *Custom area* to type any area (for example 2,400 sqft to match the PDF's ₹9,600 example).

Open **Detailed breakdown** in the app to see every formula and floor.

## Notes

- The PDF writes amounts as `Rs.` because the PDF font has no ₹ symbol. The on-screen quotation uses ₹.
- Your inputs are remembered in the browser (localStorage) so the quotation page can read them.
- Project structure follows `src/app`, `src/components`, `src/lib` (pure pricing logic), `src/types`.
