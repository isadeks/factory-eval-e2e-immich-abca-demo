import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe('change date modals changed-field indicator', () => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByRole('combobox', { name: /timezone/i }) as HTMLInputElement;

  const selectTimeZone = async (name: string) => {
    const input = getTimeZoneInput();
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: name } });
    await fireEvent.click(await screen.findByText(new RegExp(name, 'i')));
  };

  const changeDate = async (value: string) => {
    const input = getDateInput();
    await fireEvent.input(input, { target: { value } });
    await fireEvent.change(input, { target: { value } });
    await fireEvent.blur(input);
  };

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

  describe('AssetChangeDateModal', () => {
    beforeEach(() => {
      render(AssetChangeDateModal, {
        props: { initialDate, initialTimeZone, timezoneInput: true, asset: { id: 'asset-id' } as never, onClose },
      });
    });

    test('does not mark any field as changed initially', () => {
      expect(getDateInput()).not.toHaveAttribute('data-changed');
      expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
    });

    test('marks only the time zone as changed when the time zone is changed', async () => {
      await selectTimeZone('Pacific/Pitcairn');

      await waitFor(() => expect(getTimeZoneInput()).toHaveAttribute('data-changed', 'true'));
      expect(getDateInput()).not.toHaveAttribute('data-changed');
    });

    test('marks only the date as changed when the date is changed', async () => {
      await changeDate('2026-03-20T10:00:00.000');

      await waitFor(() => expect(getDateInput()).toHaveAttribute('data-changed', 'true'));
      expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
    });

    test('removes the mark when the date is reverted', async () => {
      await changeDate('2026-03-20T10:00:00.000');
      await waitFor(() => expect(getDateInput()).toHaveAttribute('data-changed', 'true'));

      await changeDate('2026-03-19T23:31:30.112');
      await waitFor(() => expect(getDateInput()).not.toHaveAttribute('data-changed'));
    });
  });

  describe('AssetSelectionChangeDateModal', () => {
    beforeEach(() => {
      render(AssetSelectionChangeDateModal, { props: { initialDate, initialTimeZone, assets: [], onClose } });
    });

    test('does not mark any field as changed initially', () => {
      expect(getDateInput()).not.toHaveAttribute('data-changed');
      expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
    });

    test('marks only the time zone as changed when the time zone is changed', async () => {
      await selectTimeZone('Pacific/Pitcairn');

      await waitFor(() => expect(getTimeZoneInput()).toHaveAttribute('data-changed', 'true'));
      expect(getDateInput()).not.toHaveAttribute('data-changed');
    });

    test('marks only the date as changed when the date is changed', async () => {
      await changeDate('2026-03-20T10:00:00.000');

      await waitFor(() => expect(getDateInput()).toHaveAttribute('data-changed', 'true'));
      expect(getTimeZoneInput()).not.toHaveAttribute('data-changed');
    });
  });
});
