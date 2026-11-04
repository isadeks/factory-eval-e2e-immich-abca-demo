import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { beforeAll, describe, expect, it } from 'vitest';
import AlbumTitle from './AlbumTitle.svelte';

describe('AlbumTitle component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  const props = { id: 'album-1', albumName: 'Holiday', onUpdate: () => {} };

  it('shows the plural asset count next to the title', () => {
    render(AlbumTitle, { ...props, isOwned: false, assetCount: 42 });
    expect(screen.getByText('Holiday')).toBeInTheDocument();
    expect(screen.getByTestId('album-asset-count')).toHaveTextContent('42 items');
  });

  it('uses the singular form for one asset', () => {
    render(AlbumTitle, { ...props, isOwned: false, assetCount: 1 });
    expect(screen.getByTestId('album-asset-count')).toHaveTextContent('1 item');
    expect(screen.getByTestId('album-asset-count')).not.toHaveTextContent('1 items');
  });

  it('shows the count for owned albums too', () => {
    render(AlbumTitle, { ...props, isOwned: true, assetCount: 7 });
    expect(screen.getByTestId('album-asset-count')).toHaveTextContent('7 items');
  });
});
