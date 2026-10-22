import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import CameraModal from '$lib/modals/CameraModal.svelte';
import * as fileUploader from '$lib/utils/file-uploader';

describe('CameraModal component', () => {
  const stop = vi.fn();
  const getUserMedia = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    stop.mockReset();
    getUserMedia.mockReset();
    const stream = Object.assign(new MediaStream(), { getTracks: () => [{ stop }] });
    getUserMedia.mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['jpeg'], { type: 'image/jpeg' }));
    });
  });

  const showVideo = async () => {
    const video = await screen.findByTestId('camera-video');
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    await fireEvent(video, new Event('loadeddata'));
    return video;
  };

  it('opens the device camera', async () => {
    render(CameraModal, { onClose: vi.fn() });
    await showVideo();

    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: expect.anything(), audio: false }));
  });

  it('uploads the picture as soon as it is taken and closes', async () => {
    const upload = vi.spyOn(fileUploader, 'fileUploadHandler').mockResolvedValue([]);
    const onClose = vi.fn();
    render(CameraModal, { onClose });
    await showVideo();

    const capture = await screen.findByTestId('camera-capture');
    await waitFor(() => expect(capture).toBeEnabled());
    await fireEvent.click(capture);

    await waitFor(() => expect(upload).toHaveBeenCalledOnce());
    const [{ files }] = upload.mock.calls[0];
    expect(files).toHaveLength(1);
    expect(files[0].type).toBe('image/jpeg');
    expect(files[0].name).toMatch(/^camera-.*\.jpg$/);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not allow taking a picture before the camera is ready', async () => {
    const upload = vi.spyOn(fileUploader, 'fileUploadHandler').mockResolvedValue([]);
    render(CameraModal, { onClose: vi.fn() });

    const capture = await screen.findByTestId('camera-capture');
    expect(capture).toBeDisabled();
    await fireEvent.click(capture);

    expect(upload).not.toHaveBeenCalled();
  });

  it('shows an error when the camera cannot be accessed', async () => {
    getUserMedia.mockRejectedValue(new Error('NotAllowedError'));
    render(CameraModal, { onClose: vi.fn() });

    expect(await screen.findByTestId('camera-error')).toBeInTheDocument();
    expect(screen.getByTestId('camera-capture')).toBeDisabled();
  });

  it('releases the camera when closed', async () => {
    const { unmount } = render(CameraModal, { onClose: vi.fn() });
    await showVideo();

    unmount();

    expect(stop).toHaveBeenCalled();
  });
});
