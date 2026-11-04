import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import EditDateFormModal from './EditDateFormModal.svelte';

describe('EditDateFormModal component', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const children = createRawSnippet(() => ({ render: () => '<input aria-label="field" />' }));

  const renderModal = (disabled = false) =>
    render(EditDateFormModal, {
      props: { title: 'Edit', submitText: 'Confirm', disabled, onClose, onSubmit, children },
    });

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('shows a Ctrl+Enter hint on the submit button', () => {
    renderModal();

    const button = screen.getByRole('button', { name: /confirm/i });
    expect(button).toHaveTextContent('Ctrl+Enter');
    expect(screen.getByTestId('submit-shortcut-hint')).toHaveClass('opacity-60');
  });

  test('submits on Ctrl+Enter', async () => {
    renderModal();

    await fireEvent.keyDown(screen.getByLabelText('field'), { key: 'Enter', ctrlKey: true });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('does not submit on Ctrl+Enter when disabled', async () => {
    renderModal(true);

    await fireEvent.keyDown(screen.getByLabelText('field'), { key: 'Enter', ctrlKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
