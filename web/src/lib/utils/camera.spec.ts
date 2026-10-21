import { captureFrame, getCameraFileName } from '$lib/utils/camera';

describe('camera utils', () => {
  describe('getCameraFileName', () => {
    it('should build a zero-padded jpg file name from local time', () => {
      expect(getCameraFileName(new Date(2024, 0, 3, 4, 5, 6, 7))).toBe('camera-20240103-040506-007.jpg');
    });

    it('should not zero-pad two digit values', () => {
      expect(getCameraFileName(new Date(2024, 10, 23, 14, 25, 36, 123))).toBe('camera-20241123-142536-123.jpg');
    });
  });

  describe('captureFrame', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should throw when the video has no frame yet', async () => {
      const video = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
      await expect(captureFrame(video)).rejects.toThrow('no video frame');
    });

    it('should return a jpeg file named after the capture time', async () => {
      const drawImage = vi.fn();
      const toBlob = vi.fn((callback: BlobCallback) => callback(new Blob(['x'], { type: 'image/jpeg' })));
      const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob } as unknown as HTMLCanvasElement;
      vi.spyOn(document, 'createElement').mockReturnValue(canvas);

      const video = { videoWidth: 640, videoHeight: 480 } as HTMLVideoElement;
      const date = new Date(2024, 0, 3, 4, 5, 6, 7);
      const file = await captureFrame(video, date);

      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
      expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
      expect(file.name).toBe('camera-20240103-040506-007.jpg');
      expect(file.type).toBe('image/jpeg');
      expect(file.lastModified).toBe(date.getTime());
    });

    it('should throw when the frame cannot be encoded', async () => {
      const toBlob = vi.fn((callback: BlobCallback) => callback(null));
      const canvas = { getContext: () => ({ drawImage: vi.fn() }), toBlob } as unknown as HTMLCanvasElement;
      vi.spyOn(document, 'createElement').mockReturnValue(canvas);

      await expect(captureFrame({ videoWidth: 10, videoHeight: 10 } as HTMLVideoElement)).rejects.toThrow(
        'Unable to encode',
      );
    });
  });
});
