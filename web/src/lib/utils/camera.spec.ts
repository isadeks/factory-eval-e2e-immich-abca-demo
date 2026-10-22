import { canvasToFile, getCameraFileName } from '$lib/utils/camera';

describe('camera utils', () => {
  describe('getCameraFileName', () => {
    it('should build a sortable jpg file name from the date', () => {
      expect(getCameraFileName(new Date(2024, 0, 2, 3, 4, 5, 6))).toBe('camera-20240102-030405-006.jpg');
    });
  });

  describe('canvasToFile', () => {
    it('should create a jpeg file from the canvas', async () => {
      const date = new Date(2024, 5, 7, 8, 9, 10, 11);
      const canvas = document.createElement('canvas');
      canvas.toBlob = (callback) => callback(new Blob(['data'], { type: 'image/jpeg' }));

      const file = await canvasToFile(canvas, date);

      expect(file.name).toBe('camera-20240607-080910-011.jpg');
      expect(file.type).toBe('image/jpeg');
      expect(file.lastModified).toBe(date.getTime());
    });

    it('should reject when the canvas cannot be encoded', async () => {
      const canvas = document.createElement('canvas');
      canvas.toBlob = (callback) => callback(null);

      await expect(canvasToFile(canvas)).rejects.toThrow();
    });
  });
});
