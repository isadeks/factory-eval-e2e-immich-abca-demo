import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import EditedBadge from './EditedBadge.svelte';

describe('EditedBadge', () => {
  it('shows the badge for an edited asset', () => {
    render(EditedBadge, { props: { asset: assetFactory.build({ isEdited: true }) } });

    expect(screen.getByTestId('edited-badge')).toBeInTheDocument();
  });

  it('does not show the badge for an unedited asset', () => {
    render(EditedBadge, { props: { asset: assetFactory.build({ isEdited: false }) } });

    expect(screen.queryByTestId('edited-badge')).not.toBeInTheDocument();
  });

  it('updates when the asset changes', async () => {
    const { rerender } = render(EditedBadge, { props: { asset: assetFactory.build({ isEdited: false }) } });
    expect(screen.queryByTestId('edited-badge')).not.toBeInTheDocument();

    await rerender({ asset: assetFactory.build({ isEdited: true }) });
    expect(screen.getByTestId('edited-badge')).toBeInTheDocument();
  });
});
