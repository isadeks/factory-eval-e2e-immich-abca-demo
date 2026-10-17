// feval-annotate.ts: CI-owned helper for agent-written UI checks (copied next to the specs at run time; a committed
// copy is overwritten). Shows a reviewer WHAT CHANGED: an outlined, labelled element, a close-up of it and a small
// thumbnail of the whole page, one step per call, in order.
//
//   import { highlight, shot } from './feval-annotate';
//   await highlight(page, page.getByTestId('detail-panel-library'), 'new: Library row');
//   await shot(page, 'Library row in the info panel', { focus: page.getByTestId('detail-panel-library') });
//
// highlight(page, locator, label): draws an outline + label badge over the element (scrolled into view first); every
//   overlay is removed by the next shot(). Several highlights before one shot are fine.
// shot(page, caption, { focus?, compareWithBase? }): writes $UI_CHECK_SHOTS/NN-<slug>.png (with focus: a close-up of
//   the element with a 40 px margin; without: the viewport) and, with focus, NN-<slug>.thumb.png (the whole viewport),
//   and appends the step to steps.jsonl with its wall-clock time t (ms; CI places the step in the test's video with it
//   and holds that moment, ci/walkthrough.py); CI posts one row per step (caption, close-up, thumbnail) in call order.
//   compareWithBase is recorded but not used yet (no before image).
// Both wait (at most 1 s, never failing the check) until no CSS/Web animation is running and two frames have painted,
//   so an element is measured and captured after it has stopped moving (a panel sliding in, a dimmed overlay fading).
// signIn(page): logs the browser in as the preview's admin through immich's login form (agents cannot try selectors
//   before CI runs, and guessing them cost a CI round).
// openInfoPanel(page): on an asset viewer page (/photos/<id>), opens the info panel if it is closed and waits until it
//   shows; returns the panel (#detail-panel). The panel's open state carries over between viewer pages, and toggling it
//   before the viewer is ready was the most common first-round UI-check failure.
import type { Locator, Page } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.UI_CHECK_SHOTS || 'shots';
const MARGIN = 40;
let step = 0;

async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), undefined, { timeout: 1000 }).catch(() => {});
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))).catch(() => {});
}

export async function highlight(page: Page, target: Locator, label: string): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await settle(page);
  const box = await target.boundingBox();
  if (!box) throw new Error(`highlight(${label}): element is not visible`);
  await page.evaluate(
    ({ box, label }) => {
      const d = document.createElement('div');
      d.className = 'feval-annotate';
      Object.assign(d.style, {
        position: 'fixed', left: `${box.x - 4}px`, top: `${box.y - 4}px`, width: `${box.width + 8}px`,
        height: `${box.height + 8}px`, border: '3px solid #ff2d55', borderRadius: '6px', zIndex: '2147483647',
        pointerEvents: 'none', boxSizing: 'border-box',
      });
      const b = document.createElement('div');
      b.textContent = label;
      Object.assign(b.style, {
        position: 'absolute', left: '-3px', [box.y < 32 ? 'bottom' : 'top']: '-26px', background: '#ff2d55',
        color: '#fff', font: '600 13px/22px system-ui, sans-serif', padding: '0 8px', borderRadius: '4px', whiteSpace: 'nowrap',
      });
      d.appendChild(b);
      document.body.appendChild(d);
    },
    { box, label },
  );
}

export async function shot(page: Page, caption: string, opts: { focus?: Locator; compareWithBase?: boolean } = {}): Promise<void> {
  mkdirSync(DIR, { recursive: true });
  await settle(page);
  const t = Date.now();   // the highlight is on screen and the page is still
  step += 1;
  const slug = caption.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).toLowerCase() || 'step';
  const base = `${String(step).padStart(2, '0')}-${slug}`;
  const file = `${base}.png`;
  let thumb: string | undefined;
  const box = opts.focus ? await opts.focus.scrollIntoViewIfNeeded().then(() => opts.focus!.boundingBox()).catch(() => null) : null;
  if (box) {
    const vp = page.viewportSize() ?? { width: 1280, height: 800 };
    const x = Math.max(0, box.x - MARGIN), y = Math.max(0, box.y - MARGIN);
    const clip = { x, y, width: Math.max(1, Math.min(vp.width - x, box.width + 2 * MARGIN)), height: Math.max(1, Math.min(vp.height - y, box.height + 2 * MARGIN)) };
    await page.screenshot({ path: join(DIR, file), clip });
    thumb = `${base}.thumb.png`;
    await page.screenshot({ path: join(DIR, thumb) });
  } else {
    await page.screenshot({ path: join(DIR, file) });
  }
  await page.evaluate(() => document.querySelectorAll('.feval-annotate').forEach((e) => e.remove())).catch(() => {});
  appendFileSync(join(DIR, 'steps.jsonl'), JSON.stringify({ file, thumb, caption, t, compareWithBase: !!opts.compareWithBase }) + '\n');
}

export async function signIn(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('#email').fill(process.env.PREVIEW_ADMIN_EMAIL ?? '');
  await page.locator('#password').fill(process.env.PREVIEW_ADMIN_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'));
}

export async function openInfoPanel(page: Page): Promise<Locator> {
  const button = page.getByRole('button', { name: 'Info', exact: true }).first();
  const panel = page.locator('#detail-panel');
  await button.waitFor({ state: 'visible', timeout: 30_000 });
  await settle(page);
  if (!(await panel.isVisible())) await button.click();
  await panel.waitFor({ state: 'visible', timeout: 10_000 });
  await settle(page);
  return panel;
}
