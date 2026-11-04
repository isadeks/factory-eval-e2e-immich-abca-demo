import { render, screen } from '@testing-library/svelte';
import { addMessages } from 'svelte-i18n';
import { beforeEach, describe, expect, it } from 'vitest';
import { locale } from '$lib/stores/preferences.store';
import UserStorageUsage from './UserStorageUsage.svelte';

describe('UserStorageUsage', () => {
  beforeEach(() => {
    addMessages('dev', { storage_usage: '{used} of {available} used' });
    locale.set('en');
  });

  it('shows only the used storage when the user has no quota', () => {
    render(UserStorageUsage, { user: { quotaSizeInBytes: null, quotaUsageInBytes: 1536 } });
    expect(screen.getByTestId('user-storage-usage')).toHaveTextContent('1.5 KiB');
    expect(screen.getByTestId('user-storage-usage')).not.toHaveTextContent('of');
  });

  it('shows usage relative to the quota when the user has one', () => {
    render(UserStorageUsage, { user: { quotaSizeInBytes: 1024 ** 3, quotaUsageInBytes: 1024 ** 2 } });
    expect(screen.getByTestId('user-storage-usage')).toHaveTextContent('1 MiB of 1 GiB used');
  });

  it('treats missing usage as zero', () => {
    render(UserStorageUsage, { user: { quotaSizeInBytes: null, quotaUsageInBytes: null } });
    expect(screen.getByTestId('user-storage-usage')).toHaveTextContent('0 B');
  });
});
