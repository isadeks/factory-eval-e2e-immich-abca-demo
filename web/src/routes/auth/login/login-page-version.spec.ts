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

describe('login page server version', () => {
  beforeAll(async () => {
    addMessages('en', en);
    await init({ fallbackLocale: 'en', initialLocale: 'en' });
  });

  it('shows the server version in small grey text after the sign-in form', async () => {
    render(Page, {
      props: { data: { meta: { title: 'Login' }, continueUrl: '/photos', serverVersion: 'v1.2.3' } as never },
    });

    const version = await screen.findByText('v1.2.3');
    const button = screen.getByRole('button', { name: /login/i });

    expect(version).toBeVisible();
    expect(version).toHaveClass('text-center', 'text-[10px]', 'text-gray-500');
    expect(button.compareDocumentPosition(version) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows nothing when the version is unavailable', async () => {
    const { container } = render(Page, {
      props: { data: { meta: { title: 'Login' }, continueUrl: '/photos' } as never },
    });

    await screen.findByRole('heading', { name: 'Welcome back' });
    expect(container.querySelector('#login-server-version')).toBeNull();
  });
});
