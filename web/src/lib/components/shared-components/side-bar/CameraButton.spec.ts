import { fireEvent, render, screen } from '@testing-library/svelte';
import CameraButton from '$lib/components/shared-components/side-bar/CameraButton.svelte';
import * as fileUploader from '$lib/utils/file-uploader';

describe('CameraButton component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a camera button with a camera-capture file input', () => {
    render(CameraButton);

    expect(screen.getByRole('button', { name: 'camera' })).toBeInTheDocument();
    const input = screen.getByTestId('camera-input');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('capture');
  });

  it('opens the camera when clicked', async () => {
    render(CameraButton);
    const click = vi.spyOn(screen.getByTestId('camera-input'), 'click');

    await fireEvent.click(screen.getByTestId('camera-button'));

    expect(click).toHaveBeenCalledOnce();
  });

  it('uploads the captured picture immediately', async () => {
    const upload = vi.spyOn(fileUploader, 'fileUploadHandler').mockResolvedValue([]);
    render(CameraButton);

    const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
    await fireEvent.change(screen.getByTestId('camera-input'), { target: { files: [file] } });

    expect(upload).toHaveBeenCalledWith({ files: [file] });
  });

  it('does not upload when no picture was taken', async () => {
    const upload = vi.spyOn(fileUploader, 'fileUploadHandler').mockResolvedValue([]);
    render(CameraButton);

    await fireEvent.change(screen.getByTestId('camera-input'), { target: { files: [] } });

    expect(upload).not.toHaveBeenCalled();
  });
});
