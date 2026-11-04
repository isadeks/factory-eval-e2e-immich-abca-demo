import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import UserStorageUsage from '$lib/components/user-settings-page/UserStorageUsage.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { userAdminFactory } from '@test-data/factories/user-factory';

describe('UserStorageUsage component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows usage and quota in a human-readable form', () => {
    authManager.setUser(
      userAdminFactory.build({ quotaUsageInBytes: 1.2 * 1024 ** 3, quotaSizeInBytes: 10 * 1024 ** 3 }),
    );
    render(UserStorageUsage);

    expect(screen.getByTestId('storage-used')).toHaveValue('1.2 GiB of 10 GiB');
  });

  it('shows only the used amount when there is no quota', () => {
    authManager.setUser(userAdminFactory.build({ quotaUsageInBytes: 1536, quotaSizeInBytes: null }));
    render(UserStorageUsage);

    expect(screen.getByTestId('storage-used')).toHaveValue('1.5 KiB');
  });

  it('shows zero bytes when nothing is used', () => {
    authManager.setUser(userAdminFactory.build({ quotaUsageInBytes: null, quotaSizeInBytes: null }));
    render(UserStorageUsage);

    expect(screen.getByTestId('storage-used')).toHaveValue('0 B');
  });
});
