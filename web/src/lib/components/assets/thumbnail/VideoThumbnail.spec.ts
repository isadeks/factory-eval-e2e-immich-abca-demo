import { render } from '@testing-library/svelte';
import VideoThumbnail from '$lib/components/assets/thumbnail/VideoThumbnail.svelte';

describe('VideoThumbnail component', () => {
  it('shows the duration as m:ss in a badge', () => {
    const { getByTestId } = render(VideoThumbnail, { url: '/video.mp4', durationInSeconds: 75 });
    expect(getByTestId('video-duration-badge').textContent?.trim()).toBe('1:15');
  });

  it('pads seconds and does not pad minutes', () => {
    const { getByTestId } = render(VideoThumbnail, { url: '/video.mp4', durationInSeconds: 9 });
    expect(getByTestId('video-duration-badge').textContent?.trim()).toBe('0:09');
  });

  it('does not render the badge when showTime is false', () => {
    const { queryByTestId } = render(VideoThumbnail, { url: '/video.mp4', durationInSeconds: 75, showTime: false });
    expect(queryByTestId('video-duration-badge')).toBeNull();
  });
});
