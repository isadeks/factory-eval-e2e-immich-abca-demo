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

describe('login page', () => {
  beforeAll(async () => {
    addMessages('en', en);
    await init({ fallbackLocale: 'en', initialLocale: 'en' });
  });

  it('shows a Welcome back heading above the email field', async () => {
    render(Page, { props: { data: { meta: { title: 'Login' }, continueUrl: '/photos' } as never } });

    const heading = await screen.findByRole('heading', { name: 'Welcome back' });
    const email = screen.getByLabelText(/email/i);

    expect(heading).toBeVisible();
    expect(heading).toHaveClass('text-center');
    expect(heading.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
