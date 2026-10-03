import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { AxeResults, RunOptions } from 'axe-core';
import sharp from 'sharp';

const require = createRequire(import.meta.url);

async function visitInvitation(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('dialog', { name: 'A wedding invitation for you' })).toHaveCount(0);
}

test('responsive invitation loads its images without overflow or browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await visitInvitation(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: 'Isuru & Kaushalya' })).toBeVisible();
    for (const section of ['#invitation', '#details', '#venues', '#programme', '#dress-code', '#rsvp']) {
      await page.locator(section).scrollIntoViewIfNeeded();
    }
    await page.locator('.footer').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.page, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `artifacts/invitation-${width}.png`, fullPage: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `artifacts/hero-${width}.png` });
      await page.locator('#programme').screenshot({ path: `artifacts/programme-${width}.png` });
      await page.locator('#rsvp').screenshot({ path: `artifacts/rsvp-${width}.png` });
      await page.locator('#invitation').screenshot({ path: `artifacts/letter-${width}.png` });
      await page.locator('#venues').screenshot({ path: `artifacts/venues-${width}.png` });
    }
    if (width === 320) await page.locator('#programme').screenshot({ path: 'artifacts/programme-320.png' });
  }
  expect(errors).toEqual([]);
});

test('venue link and calendar use the remaining venue and correct daytime schedule', async ({ page }) => {
  await visitInvitation(page);
  const links = page.getByRole('link', { name: /on Google Maps/ });
  await expect(links).toHaveCount(1);
  const destinations = await links.evaluateAll(elements => elements.map(element => (element as HTMLAnchorElement).href));
  expect(decodeURIComponent(destinations[0])).toContain('Cinnamon Lakeside Colombo, 115, Sir Chittampalam A. Gardiner Mawatha, Colombo 02, Sri Lanka');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Add to my calendar' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('isuru-kaushalya-wedding.ics');
  const filePath = await download.path();
  const calendar = (await readFile(filePath!, 'utf-8')).replace(/\r\n /g, '');
  expect(calendar).toContain('DTSTART:20260814T033000Z');
  expect(calendar).toContain('DTEND:20260814T093000Z');
  expect(calendar).toContain('SUMMARY:Isuru & Kaushalya — Wedding day');
  expect(calendar).toContain('Cinnamon Lakeside Colombo');
  expect(calendar).toContain('Asia/Colombo');
});

test('RSVP validates and prepares encoded attending and declining messages without sending', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { openedUrls: string[] }).openedUrls = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { openedUrls: string[] }).openedUrls.push(String(url));
      return null;
    };
  });
  await visitInvitation(page);
  const submit = page.getByRole('button', { name: 'Send RSVP via WhatsApp' });
  await submit.click();
  expect(await page.locator('#guest-name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await page.getByLabel('Your full name').fill('   ');
  await page.getByLabel('Joyfully accept').check();
  await submit.click();
  await expect(page.getByRole('alert')).toHaveText('කරුණාකර ඔබේ නම ඇතුළත් කරන්න.');
  await page.getByLabel('Your full name').fill('අමාලි & Daniel පෙරේරා');
  await page.getByLabel('Number of guests').fill('0');
  await submit.click();
  expect(await page.locator('#guest-count').evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
  await page.getByLabel('Number of guests').fill('3');
  await page.getByLabel('A note for the couple').fill('ඔබ දෙපළට සුබ පැතුම්! Vegetarian meals, please. ♥');
  await submit.click();
  let opened = await page.evaluate(() => (window as unknown as { openedUrls: string[] }).openedUrls);
  expect(opened).toHaveLength(1);
  let destination = new URL(opened[0]);
  expect(destination.origin + destination.pathname).toBe('https://wa.me/94707001787');
  expect(destination.searchParams.get('text')).toContain('අමාලි & Daniel පෙරේරා');
  expect(destination.searchParams.get('text')).toContain('Joyfully accept / සතුටින් සහභාගී වෙමි.');
  expect(destination.searchParams.get('text')).toContain('Guests (including me) / මා ඇතුළු අමුත්තන්: 3');
  expect(destination.searchParams.get('text')).toContain('ඔබ දෙපළට සුබ පැතුම්! Vegetarian meals, please. ♥');
  await expect(page.getByRole('status')).toContainText('ඔබේ පණිවිඩය සූදානම්.');
  await page.getByLabel('Regretfully decline').check();
  await expect(page.getByLabel('Number of guests')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  await submit.click();
  opened = await page.evaluate(() => (window as unknown as { openedUrls: string[] }).openedUrls);
  destination = new URL(opened[1]);
  expect(destination.searchParams.get('text')).toContain('Regretfully decline / කනගාටුයි, මට සහභාගී වීමට නොහැක.');
  expect(destination.searchParams.get('text')).not.toContain('මා ඇතුළු අමුත්තන්');
});

test('mobile navigation traps focus, closes with Escape, and follows section links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visitInvitation(page);
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await trigger.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Kindly RSVP' }).click();
  await expect(page).toHaveURL(/#rsvp$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('desktop and mobile meet accessibility checks with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await visitInvitation(page);
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(() => {
      const axe = (window as unknown as { axe: { run: (document: Document, options: RunOptions) => Promise<AxeResults> } }).axe;
      return axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    });
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
    expect(await page.locator('.hero-pearl-right').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await expect(page.locator('.floating-hearts')).toBeHidden();
    expect(await page.locator('.floating-heart').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  }
});

test('mobile landscape and enlarged text remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 844, height: 390 });
  await visitInvitation(page);
  await expect(page.getByRole('heading', { name: 'Isuru & Kaushalya' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: 'p, label, input, textarea, legend, address, figcaption { font-size: 1.4em !important; }' });
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.getByLabel('Your full name').fill('Alexandra Francesca de Silva Wijesinghe and family');
  await page.getByLabel('Joyfully accept').check();
  await expect(page.getByRole('button', { name: 'Send RSVP via WhatsApp' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Sinhala uses the local font and native validation messages are localized', async ({ page }) => {
  await visitInvitation(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#invitation p[lang="si"]').first()).toContainText('මේ ආරාධනාව');
  expect(await page.locator('#invitation p[lang="si"]').first().evaluate(element => getComputedStyle(element).fontFamily)).toContain('Noto Serif Sinhala');
  expect(await page.evaluate(() => document.fonts.check('16px "Noto Serif Sinhala"', 'ආරාධනාව'))).toBe(true);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('noto-serif-sinhala-sinhala') && entry.name.startsWith(location.origin)))).toBe(true);
  await page.getByRole('button', { name: 'Send RSVP via WhatsApp' }).click();
  expect(await page.locator('#guest-name').evaluate((input: HTMLInputElement) => input.validationMessage)).toBe('කරුණාකර ඔබේ නම ඇතුළත් කරන්න.');
  await page.getByLabel('Your full name').fill('අමාලි පෙරේරා');
  await page.getByLabel('Joyfully accept').check();
  expect(await page.locator('.rsvp-form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
});

test('heart animation spans the page without blocking controls and pauses when hidden', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await visitInvitation(page);
  const overlay = page.locator('.floating-hearts');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.floating-heart:visible')).toHaveCount(12);
  expect(await overlay.evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none');
  const positions = await page.locator('.floating-heart').first().evaluate(async element => {
    const start = getComputedStyle(element).transform;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return [start, getComputedStyle(element).transform];
  });
  expect(positions[0]).not.toBe(positions[1]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.floating-heart:visible')).toHaveCount(6);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation' }).click();
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.getByLabel('Your full name').fill('අමාලි');
  await page.getByLabel('Joyfully accept').check();
  await expect(page.getByLabel('Your full name')).toHaveValue('අමාලි');
  const bounds = await overlay.boundingBox();
  expect(bounds).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(overlay).toHaveAttribute('data-paused', 'true');
  expect(await page.locator('.floating-heart').first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  expect(await page.locator('.floating-heart img').first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(overlay).toHaveAttribute('data-paused', 'false');
  expect(await page.locator('.floating-heart').first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
  await page.locator('#programme').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.programme-necklace').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).forEach(animation => animation.finish());
  });
  await page.screenshot({ path: 'artifacts/hearts-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'artifacts/hearts-desktop.png' });
});

test('pearl heart sprite has transparent interior and exterior pixels', async () => {
  const { data, info } = await sharp('public/assets/pearlheart.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
  expect(info.channels).toBe(4);
  expect(alphaAt(0, 0)).toBe(0);
  expect(alphaAt(info.width - 1, info.height - 1)).toBe(0);
  expect(alphaAt(Math.floor(info.width / 2), Math.floor(info.height / 2))).toBe(0);
  let opaquePixels = 0;
  for (let offset = 3; offset < data.length; offset += 4) if (data[offset] > 240) opaquePixels++;
  expect(opaquePixels).toBeGreaterThan(info.width * info.height * .1);
  expect(opaquePixels).toBeLessThan(info.width * info.height * .55);
});
