const pad = (value: number) => String(value).padStart(2, '0');

export const getCameraFileName = (date: Date = new Date()) =>
  `camera-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${String(date.getMilliseconds()).padStart(3, '0')}.jpg`;

export const canvasToFile = (canvas: HTMLCanvasElement, date: Date = new Date()): Promise<File> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to encode camera frame'));
          return;
        }
        resolve(new File([blob], getCameraFileName(date), { type: 'image/jpeg', lastModified: date.getTime() }));
      },
      'image/jpeg',
      0.92,
    );
  });
