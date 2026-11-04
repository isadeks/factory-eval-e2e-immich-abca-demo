import { expect, test, type Locator } from '@playwright/test';
import { highlight, shot } from './feval-annotate';

// Chromium does not toggle the real Caps Lock state from automation, so dispatch key events carrying the modifier state.
const pressKey = (input: Locator, type: 'keydown' | 'keyup', key: string, capsLock: boolean) =>
  input.evaluate(
    (element, args) => {
      element.dispatchEvent(
        new KeyboardEvent(args.type, { key: args.key, bubbles: true, modifierCapsLock: args.capsLock }),
      );
    },
    { type, key, capsLock },
  );

test('login page warns while Caps Lock is on in the password field', async ({ page }) => {
  await page.goto('/auth/login');
  const password = page.locator('#password');
  await password.waitFor({ state: 'visible' });
  const warning = page.getByText('Caps Lock is on');

  await password.focus();
  await expect(warning).toHaveCount(0);
  await shot(page, 'Login page without Caps Lock: no warning', { focus: password });

  await pressKey(password, 'keydown', 'A', true);
  await expect(warning).toBeVisible();
  await highlight(page, warning, 'New: Caps Lock warning');
  await shot(page, 'Caps Lock is on: warning shown under the password field', { focus: warning });

  await pressKey(password, 'keyup', 'CapsLock', false);
  await expect(warning).toHaveCount(0);
  await shot(page, 'Caps Lock turned off: warning gone', { focus: password });
});
