import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test } from '@playwright/test';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');

test.describe('hero', () => {
  test('renders headline, two-layer canvas grid, follow mode on desktop', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'See your life in weeks.',
    );
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Live them on purpose.',
    );
    await expect(page.locator('#hero')).toHaveAttribute('data-mode', 'follow');
    await expect(page.locator('canvas[data-canvas="cold"]')).toHaveCount(1);
    await expect(page.locator('canvas[data-canvas="warm"]')).toHaveCount(1);
    await expect(page.locator('canvas[data-canvas="pulse"]')).toHaveCount(1);

    // moving the pointer drives the spotlight vars (--mx/--my)
    await page.mouse.move(300, 400);
    await page.waitForTimeout(400);
    const mx = await page
      .locator('#hero')
      .evaluate((el) => el.style.getPropertyValue('--mx'));
    expect(mx).toMatch(/px$/);

    // the mobile-only copy scrim must not exist at desktop widths
    await expect(page.getByTestId('hero-scrim')).toBeHidden();
  });

  test('CTA copy is the Coming soon store state', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /App Store — coming soon/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Google Play — coming soon/i }).first(),
    ).toBeVisible();
    await expect(page.getByText('Coming soon', { exact: true }).first()).toBeVisible();
  });
});

test.describe('navigation', () => {
  test('nav anchors scroll to each section', async ({ page }) => {
    await page.goto('/');
    for (const href of ['#how', '#habits', '#science', '#download']) {
      await page.locator(`header nav a[href="${href}"]`).first().click();
      await expect(page.locator(href)).toBeInViewport();
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('renders the static pre-lit path with no rAF churn', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero')).toHaveAttribute('data-mode', 'static');
    // 2–3 static evidence chips are shown
    await expect(page.locator('.chip.on')).toHaveCount(3);
    // no rAF loop is running
    const rafCalls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let n = 0;
          const orig = window.requestAnimationFrame.bind(window);
          window.requestAnimationFrame = (cb: FrameRequestCallback) => {
            n += 1;
            return orig(cb);
          };
          setTimeout(() => resolve(n), 600);
        }),
    );
    expect(rafCalls).toBeLessThanOrEqual(1);
  });
});

test.describe('touch / coarse pointer', () => {
  const pixel = devices['Pixel 7'];
  test.use({
    viewport: pixel.viewport,
    userAgent: pixel.userAgent,
    deviceScaleFactor: pixel.deviceScaleFactor,
    isMobile: pixel.isMobile,
    hasTouch: pixel.hasTouch,
  });

  test('grid is never dead: auto-sweep spotlight moves on its own', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#hero')).toHaveAttribute('data-mode', 'sweep');
    await page.waitForTimeout(400);
    const mx1 = await page
      .locator('#hero')
      .evaluate((el) => el.style.getPropertyValue('--mx'));
    await page.waitForTimeout(900);
    const mx2 = await page
      .locator('#hero')
      .evaluate((el) => el.style.getPropertyValue('--mx'));
    expect(mx1).toMatch(/px$/);
    expect(mx2).toMatch(/px$/);
    expect(mx2).not.toBe(mx1);
  });
});

test.describe('mobile hero legibility (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a scrim backs the hero copy over the full-bleed grid', async ({ page }) => {
    await page.goto('/');
    const scrim = page.getByTestId('hero-scrim');
    await expect(scrim).toBeVisible();

    // the scrim paints an opaque-enough --bg gradient (not transparent)
    const bg = await scrim.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
    expect(bg).toContain('rgba(5, 5, 7, 0.9)');

    // it spans the hero, fully covering the headline + subhead + CTA zone,
    // and stacks above the grid canvases but below the copy
    const heroBox = await page.locator('#hero').boundingBox();
    const scrimBox = await scrim.boundingBox();
    const copyBox = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(scrimBox).not.toBeNull();
    expect(heroBox).not.toBeNull();
    expect(copyBox).not.toBeNull();
    expect(scrimBox!.width).toBeGreaterThanOrEqual(heroBox!.width - 1);
    expect(scrimBox!.y).toBeLessThanOrEqual(copyBox!.y);
    expect(scrimBox!.y + scrimBox!.height).toBeGreaterThanOrEqual(
      copyBox!.y + copyBox!.height,
    );
    const [scrimZ, gridZ] = await page.evaluate(() => {
      const scrimEl = document.querySelector('[data-testid="hero-scrim"]');
      const gridEl =
        document.querySelector('canvas[data-canvas="cold"]')?.closest('.grid-fade-in') ??
        null;
      return [
        scrimEl ? Number(getComputedStyle(scrimEl).zIndex) : NaN,
        gridEl ? Number(getComputedStyle(gridEl).zIndex) : NaN,
      ];
    });
    expect(scrimZ).toBeGreaterThan(gridZ);
  });
});

test.describe('build artifacts', () => {
  test('dist contains the GitHub Pages deploy files', () => {
    const required = [
      'index.html',
      'privacy.html',
      'terms.html',
      'CNAME',
      '.nojekyll',
      'robots.txt',
      'sitemap.xml',
      'site.webmanifest',
      'favicon.svg',
      'favicon.ico',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
    ];
    for (const f of required) {
      expect(fs.existsSync(path.join(dist, f)), `dist/${f} should exist`).toBe(true);
    }
    expect(fs.readFileSync(path.join(dist, 'CNAME'), 'utf8').trim()).toBe(
      '5kweeks.life',
    );
    // legal pages keep their ported content
    const privacy = fs.readFileSync(path.join(dist, 'privacy.html'), 'utf8');
    expect(privacy).toContain('Privacy Policy');
    const terms = fs.readFileSync(path.join(dist, 'terms.html'), 'utf8');
    expect(terms).toContain('Terms of Use');
  });
});
