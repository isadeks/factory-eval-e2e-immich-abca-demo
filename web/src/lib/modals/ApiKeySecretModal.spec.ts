import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import ApiKeySecretModal from './ApiKeySecretModal.svelte';

describe('ApiKeySecretModal component', () => {
  const secret = 'super-secret-api-key';
  const onClose = vi.fn();
  const writeText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  test('copies the key to the clipboard and shows "Copied"', async () => {
    writeText.mockResolvedValue(undefined);
    render(ApiKeySecretModal, { props: { secret, onClose } });

    const button = await screen.findByTestId('api-key-copy-button');
    // translations are not loaded in unit tests, so the i18n keys are rendered
    expect(button).toHaveTextContent(/^\s*copy\s*$/);

    await fireEvent.click(button);

    await waitFor(() => expect(button).toHaveTextContent(/^\s*copied\s*$/));
    expect(writeText).toHaveBeenCalledWith(secret);
  });

  test('does not show "Copied" when copying fails', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(ApiKeySecretModal, { props: { secret, onClose } });

    const button = await screen.findByTestId('api-key-copy-button');
    await fireEvent.click(button);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(secret));
    expect(button).toHaveTextContent(/^\s*copy\s*$/);
  });
});
