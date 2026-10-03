import { expect, test } from '@playwright/test';
import { createRequire } from 'node:module';
import type { AxeResults, RunOptions } from 'axe-core';

const require = createRequire(import.meta.url);

for (const width of [390, 1440]) {
  test(`opening plays the supplied clip, reveals and turns the card once at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const opening = page.getByRole('dialog', { name: 'A wedding invitation for you' });
    const clip = page.locator('.opening-video');
    await expect(opening).toBeVisible();
    await expect(opening).toHaveAttribute('data-phase', 'video');
    await expect(page.locator('.opening-card-motion')).toBeHidden();
    expect(await clip.evaluate((element: HTMLVideoElement) => element.muted && element.playsInline && !element.loop)).toBe(true);
    await page.screenshot({ path: `artifacts/opening-envelope-${width}.png` });
    await expect(opening).toHaveAttribute('data-phase', 'revealing', { timeout: 10000 });
    expect(await clip.evaluate((element: HTMLVideoElement) => element.ended)).toBe(true);
    const rotation = await page.locator('.opening-card').evaluate(element => {
      const effect = element.getAnimations()[0].effect as KeyframeEffect;
      return { iterations: effect.getTiming().iterations, lastFrame: effect.getKeyframes().at(-1)?.transform };
    });
    expect(rotation).toEqual({ iterations: 1, lastFrame: 'rotateX(0deg) rotateY(360deg)' });
    // Inspect the running animation at its half turn: the reverse must be a real card face.
    await page.locator('.opening-card').evaluate(element => {
      const spin = element.getAnimations()[0];
      spin.pause();
      spin.currentTime = 1900;
    });
    const midTurn = await page.locator('.opening-card').evaluate(element => getComputedStyle(element).transform);
    expect(midTurn).toContain('matrix3d');
    await page.screenshot({ path: `artifacts/opening-turn-${width}.png` });
    await page.locator('.opening-card').evaluate(element => element.getAnimations()[0].play());
    await expect(opening).toHaveAttribute('data-phase', 'ready');
    await expect(page.locator('.opening-card-names')).toHaveText('Isuru&Kaushalya');
    await expect(page.locator('.opening-card-details')).toHaveText('14 August 2026Colombo, Sri Lanka');
    await expect(page.getByRole('button', { name: 'View our invitation' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/opening-card-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.getByRole('button', { name: 'View our invitation' }).click();
    await expect(opening).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Isuru & Kaushalya' })).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect(page.locator('.brand')).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('intro supports skip, Escape, keyboard focus, and plays again on a fresh visit', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.invitation-opening')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.invitation-opening')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.invitation-opening')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation', exact: true })).toBeVisible();
});

test('reduced-motion card is accessible and fits small phones and landscape screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.invitation-opening')).toHaveAttribute('data-phase', 'ready');
    await expect(page.locator('.opening-video')).toHaveCount(0);
    expect(await page.locator('.opening-card').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    const card = await page.locator('.opening-card').boundingBox();
    expect(card!.y).toBeGreaterThanOrEqual(0);
    expect(card!.y + card!.height).toBeLessThan(viewport.height);
    expect(card!.x).toBeGreaterThanOrEqual(0);
    expect(card!.x + card!.width).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByRole('button', { name: 'View our invitation' })).toBeInViewport();
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(() => {
      const axe = (window as unknown as { axe: { run: (document: Document, options: RunOptions) => Promise<AxeResults> } }).axe;
      return axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    });
    expect(results.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
    await page.screenshot({ path: `artifacts/opening-reduced-${viewport.width}.png` });
  }
});

test('failed video still reveals the card and allows entry', async ({ page }) => {
  await page.route('**/*.mp4*', route => route.request().resourceType() === 'media' ? route.abort() : route.continue());
  await page.goto('/');
  await expect(page.locator('.invitation-opening')).toHaveAttribute('data-phase', 'ready', { timeout: 8000 });
  await page.getByRole('button', { name: 'View our invitation' }).click();
  await expect(page.locator('.invitation-opening')).toHaveCount(0);
});

test('blocked autoplay offers a working tap-to-play action', async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.autoplay = false;
      if (!navigator.userActivation.isActive) return Promise.reject(new DOMException('Playback needs a gesture', 'NotAllowedError'));
      return play.call(this);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open the envelope' }).click();
  await expect.poll(() => page.locator('.opening-video').evaluate((clip: HTMLVideoElement) => clip.currentTime)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Open the envelope' })).toHaveCount(0);
  await expect(page.locator('.invitation-opening')).toHaveAttribute('data-phase', 'ready', { timeout: 12000 });
});
