import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { addMessages, init } from 'svelte-i18n';
import en from '../../../../../i18n/en.json';
import Page from './+page.svelte';

vi.mock('$lib/managers/server-config-manager.svelte', () => ({
  serverConfigManager: { value: { loginPageMessage: '', isOnboarded: true, oauthButtonText: 'OAuth' } },
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: { value: { oauth: false, oauthAutoLaunch: false, passwordLogin: true } },
}));

describe('login page forgot password hint', () => {
  beforeAll(async () => {
    addMessages('en', en);
    await init({ fallbackLocale: 'en', initialLocale: 'en' });
  });

  it('shows a small grey hint directly under the sign-in button', async () => {
    render(Page, { props: { data: { meta: { title: 'Login' }, continueUrl: '/photos' } as never } });

    const button = await screen.findByRole('button', { name: 'Login' });
    const hint = screen.getByText('Forgot your password? Ask your admin.');

    expect(hint).toBeVisible();
    expect(hint).toHaveClass('text-xs', 'text-gray-500');
    expect(button.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button.nextElementSibling).toBe(hint);
  });
});
