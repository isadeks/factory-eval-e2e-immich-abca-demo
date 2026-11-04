import { screen } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import AssetSelectControlBar from './AssetSelectControlBar.svelte';

describe('AssetSelectControlBar component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  afterEach(() => {
    assetMultiSelectManager.clear();
  });

  it('shows "Selected: 1" with a single selected asset', () => {
    assetMultiSelectManager.selectAsset(timelineAssetFactory.build());

    renderWithTooltips(AssetSelectControlBar);

    expect(screen.getByText('Selected: 1')).toBeInTheDocument();
  });

  it('updates the counter as assets are selected and deselected', async () => {
    const assets = timelineAssetFactory.buildList(3);
    assetMultiSelectManager.selectAssets(assets);

    renderWithTooltips(AssetSelectControlBar);
    expect(screen.getByText('Selected: 3')).toBeInTheDocument();

    assetMultiSelectManager.removeAssetFromMultiselectGroup(assets[0].id);
    expect(await screen.findByText('Selected: 2')).toBeInTheDocument();
  });
});
