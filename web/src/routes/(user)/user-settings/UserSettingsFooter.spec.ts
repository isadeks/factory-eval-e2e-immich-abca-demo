import { websocketStore } from '$lib/stores/websocket';
import { render, screen } from '@testing-library/svelte';
import UserSettingsFooter from './UserSettingsFooter.svelte';

describe('UserSettingsFooter component', () => {
  afterEach(() => {
    websocketStore.serverVersion.set(undefined as never);
  });

  it('renders nothing while the server version is unknown', () => {
    render(UserSettingsFooter);
    expect(screen.queryByTestId('settings-footer-version')).not.toBeInTheDocument();
  });

  it('shows the server version', () => {
    websocketStore.serverVersion.set({ major: 1, minor: 2, patch: 3, prerelease: null } as never);
    render(UserSettingsFooter);
    expect(screen.getByTestId('settings-footer-version')).toHaveTextContent('v1.2.3');
  });

  it('shows the prerelease suffix', () => {
    websocketStore.serverVersion.set({ major: 2, minor: 0, patch: 0, prerelease: 4 } as never);
    render(UserSettingsFooter);
    expect(screen.getByTestId('settings-footer-version')).toHaveTextContent('v2.0.0-rc.4');
  });
});
