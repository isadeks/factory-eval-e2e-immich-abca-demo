const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** Builds a file name like `camera-20240131-142501-123.jpg` (local time). */
export const getCameraFileName = (date: Date = new Date()): string =>
  `camera-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
  `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}.jpg`;

/** Draws the current frame of a video element onto a canvas and returns it as a JPEG `File`. */
export const captureFrame = async (video: HTMLVideoElement, date: Date = new Date()): Promise<File> => {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error('Camera stream has no video frame yet');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create canvas context');
  }
  context.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92),
  );
  if (!blob) {
    throw new Error('Unable to encode captured frame');
  }

  return new File([blob], getCameraFileName(date), { type: 'image/jpeg', lastModified: date.getTime() });
};
