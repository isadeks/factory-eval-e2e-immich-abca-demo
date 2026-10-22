import { modalManager } from '@immich/ui';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CameraButton from '$lib/components/shared-components/side-bar/CameraButton.svelte';
import CameraModal from '$lib/modals/CameraModal.svelte';

describe('CameraButton component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a camera button', () => {
    render(CameraButton);

    expect(screen.getByRole('button', { name: 'camera' })).toBeInTheDocument();
  });

  it('opens the camera dialog when clicked', async () => {
    const show = vi.spyOn(modalManager, 'show').mockResolvedValue(undefined as never);
    render(CameraButton);

    await fireEvent.click(screen.getByTestId('camera-button'));

    expect(show).toHaveBeenCalledWith(CameraModal, {});
  });
});
