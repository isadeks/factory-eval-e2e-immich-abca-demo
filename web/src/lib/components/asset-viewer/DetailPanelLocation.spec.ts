import '@testing-library/jest-dom';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { copyToClipboard } from '$lib/utils';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanelLocation from './DetailPanelLocation.svelte';

vi.mock('$lib/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/utils')>()),
  copyToClipboard: vi.fn(),
}));

describe('DetailPanelLocation', () => {
  it('shows the GPS coordinates and copies them', async () => {
    const user = userEvent.setup();
    const asset = assetFactory.build({
      exifInfo: { latitude: 48.8584, longitude: 2.2945, city: 'Paris', state: 'Île-de-France', country: 'France' },
    });

    renderWithTooltips(DetailPanelLocation, { asset, isOwner: false });

    expect(screen.getByTestId('detail-panel-coordinates-text')).toHaveTextContent('48.8584, 2.2945');

    await user.click(screen.getByTestId('detail-panel-coordinates-copy'));
    expect(copyToClipboard).toHaveBeenCalledWith('48.8584, 2.2945');
  });

  it('shows coordinates of 0 and rounds to 7 decimals', () => {
    const asset = assetFactory.build({ exifInfo: { latitude: 0, longitude: -12.123456789 } });

    renderWithTooltips(DetailPanelLocation, { asset, isOwner: false });

    expect(screen.getByTestId('detail-panel-coordinates-text')).toHaveTextContent('0, -12.1234568');
  });

  it('does not show coordinates when the asset has no GPS data', () => {
    const asset = assetFactory.build({ exifInfo: { latitude: null, longitude: null } });

    renderWithTooltips(DetailPanelLocation, { asset, isOwner: false });

    expect(screen.queryByTestId('detail-panel-coordinates')).not.toBeInTheDocument();
  });
});
