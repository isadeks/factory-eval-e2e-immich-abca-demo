import { isModalOpen, modalManager } from '@immich/ui';
import { fireEvent, render } from '@testing-library/svelte';
import KeyboardShortcutsHandler from '$lib/components/KeyboardShortcutsHandler.svelte';
import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';

vi.mock('@immich/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...actual,
    isModalOpen: vi.fn(() => false),
    modalManager: { ...actual.modalManager, show: vi.fn() },
  };
});

describe('KeyboardShortcutsHandler component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isModalOpen).mockReturnValue(false);
  });

  it('opens the keyboard shortcuts modal when "?" is pressed', async () => {
    render(KeyboardShortcutsHandler);
    await fireEvent.keyDown(document.body, { key: '?', shiftKey: true });
    expect(modalManager.show).toHaveBeenCalledExactlyOnceWith(ShortcutsModal, {});
  });

  it('does not open the modal for other keys', async () => {
    render(KeyboardShortcutsHandler);
    await fireEvent.keyDown(document.body, { key: '/' });
    await fireEvent.keyDown(document.body, { key: '?' });
    expect(modalManager.show).not.toHaveBeenCalled();
  });

  it('does not open the modal while typing in a text field', async () => {
    render(KeyboardShortcutsHandler);
    const input = document.createElement('input');
    input.type = 'text';
    document.body.append(input);
    await fireEvent.keyDown(input, { key: '?', shiftKey: true });
    input.remove();
    expect(modalManager.show).not.toHaveBeenCalled();
  });

  it('does not open a second modal when one is already open', async () => {
    vi.mocked(isModalOpen).mockReturnValue(true);
    render(KeyboardShortcutsHandler);
    await fireEvent.keyDown(document.body, { key: '?', shiftKey: true });
    expect(modalManager.show).not.toHaveBeenCalled();
  });
});
