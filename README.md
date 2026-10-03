# Pearl & Paper

A responsive wedding invitation for Isuru & Kaushalya, inspired by the supplied pearl-and-paper reference. Built with React, TypeScript, Vite, and local artwork and fonts.

## Run locally

Requires Node.js 22.12 or newer (Node.js 24 recommended).

```sh
npm install
npm run dev
```

Open the local address printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

The `dist` directory is ready for static hosting, including a subdirectory. No server, database, or environment variables are needed. Public deployment is not included.

## Customize

Edit `src/data/wedding.ts` for names, date, local start/end times, venue timezone, addresses, schedule, colour labels, and RSVP recipient. The current recipient is **+94707001787**. Keep `date`, `start`, and `end` consistent; the current schedule runs from 09.00 to 15.00 on the wedding day. Calendar downloads convert local venue time to UTC, including daylight-saving time.

The date **14 August 2026** is sample content from the reference. The site deliberately has no countdown. Venue links open Google Maps searches for the configured names and addresses.

The location is **Colombo, Sri Lanka**, with venue times in **Asia/Colombo (UTC+05:30)**. **Cinnamon Lakeside Colombo** is the only displayed venue and the venue used in the calendar download. Its address was checked against [Cinnamon Lakeside's official contact details](https://clflavours.cinnamonhotels.com/).

The RSVP form validates the response and opens a prefilled WhatsApp message. **The guest must press Send in WhatsApp.** The website neither sends nor stores responses. A fallback link appears if the new window does not open. No real messages are sent by the automated tests.

Colours and typography tokens are in `src/tokens.css`; layout and motion styles are in `src/styles.css`. Section components and invitation wording beyond the shared data are in `src/App.tsx`. Update the page title and social description in `index.html` and the initials in `public/favicon-ik.svg` when changing the couple. The favicon uses a new filename so browsers refresh the previous initials.

The invitation mixes English headings with Sinhala explanations and bilingual controls. Sinhala text uses the self-hosted Noto Serif Sinhala font; its language tags and spacing are in `src/localization.css`. RSVP validation and outgoing WhatsApp messages support Sinhala names and notes. Calendar downloads convert the Sri Lankan schedule to UTC for guests' calendars.

`src/components/FloatingHearts.tsx` and `src/hearts.css` provide the decorative pearl hearts: 12 on desktop, 6 on phones, with slow falling and drifting motion. The overlay never intercepts input, pauses in hidden tabs, and is disabled by reduced-motion preferences.

## Assets

Original files in `petals` remain unchanged. The page uses selected optimized WebP derivatives from `public/assets`. To regenerate them after changing the originals:

```sh
npm run assets
```

`scripts/prepare-assets.mjs` maps source files to descriptive output names, trims transparent borders, resizes artwork, and preserves alpha channels. Fonts are self-hosted through the installed Fontsource packages. Runtime page loading makes no third-party font or image requests.

Font license notices are included in `public/licenses` and in the production build.

The new `petals/pearlheart-transparent.png` is a cutout of the supplied `petals/pearlheart.jpg`, prepared with the built-in imagegen editing tool. The page uses the 7 KB `public/assets/pearlheart.webp` sprite. The original JPG is unchanged. The exact editing prompt is recorded in [scripts/pearlheart-cutout.md](scripts/pearlheart-cutout.md). Regenerate only this sprite with `npm run assets -- --only=pearlheart`.

## Verify

```sh
npm run typecheck
npm run build
npm test
```

Browser checks use locally installed Google Chrome. Alternatively, run `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.ts` to use Playwright's managed Chromium.

Tests cover responsive layouts, images, map links, calendar time conversion, Sinhala font loading and validation, bilingual WhatsApp encoding, mobile navigation focus, heart transparency and animation, hidden-tab pausing, reduced motion, enlarged text, and accessibility. Desktop/mobile screenshots are saved to the ignored `artifacts` directory.
