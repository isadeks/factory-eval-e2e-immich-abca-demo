import { Permission, type ApiKeyResponseDto } from '@immich/sdk';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { dateFormats } from '$lib/constants';
import UserApiKeyList from './UserApiKeyList.svelte';

// the action buttons need a tooltip provider, which is irrelevant to what is tested here
vi.mock('$lib/components/TableButton.svelte', () => ({ default: () => {} }));

describe('UserApiKeyList', () => {
  const createdAt = '2024-03-15T12:00:00.000Z';
  const key: ApiKeyResponseDto = {
    id: 'key-1',
    name: 'My test key',
    permissions: [Permission.All],
    createdAt,
    updatedAt: createdAt,
  };

  it('shows a Created column header', () => {
    render(UserApiKeyList, { keys: [key] });

    expect(screen.getByRole('columnheader', { name: 'created' })).toBeInTheDocument();
  });

  it('shows the creation date of each API key', () => {
    const otherCreatedAt = '2023-11-02T12:00:00.000Z';
    render(UserApiKeyList, { keys: [key, { ...key, id: 'key-2', name: 'Other key', createdAt: otherCreatedAt }] });

    const format = (date: string) => new Date(date).toLocaleDateString(undefined, dateFormats.settings);

    const first = screen.getByRole('row', { name: /My test key/ });
    const second = screen.getByRole('row', { name: /Other key/ });
    expect(within(first).getByText(format(createdAt))).toBeInTheDocument();
    expect(within(second).getByText(format(otherCreatedAt))).toBeInTheDocument();
  });
});
