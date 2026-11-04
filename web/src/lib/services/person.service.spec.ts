import { deletePerson } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { vitest } from 'vitest';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleDeletePerson } from '$lib/services/person.service';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { personFactory } from '@test-data/factories/person-factory';

vitest.mock('@immich/ui', () => ({
  modalManager: { show: vitest.fn(), showDialog: vitest.fn() },
  toastManager: { primary: vitest.fn() },
}));

vitest.mock('$lib/utils/i18n', () => ({
  getFormatter: vitest.fn(),
  getPreferredLocale: vitest.fn(),
}));

vitest.mock('$lib/utils/handle-error', () => ({ handleError: vitest.fn() }));

vitest.mock('@immich/sdk');

vitest.mock('$lib/modals/PersonEditBirthDateModal.svelte', () => ({ default: {} }));

describe('PersonService', () => {
  describe('handleDeletePerson', () => {
    const person = personFactory.build({ name: 'Jane Doe' });

    beforeEach(() => {
      vitest.resetAllMocks();
      vitest.mocked(getFormatter).mockResolvedValue(((key: string) => key) as never);
    });

    it('should ask for confirmation and not delete the person when cancelled', async () => {
      vitest.mocked(modalManager.showDialog).mockResolvedValue(false);
      const emit = vitest.spyOn(eventManager, 'emit');

      await expect(handleDeletePerson(person)).resolves.toBe(false);

      expect(modalManager.showDialog).toHaveBeenCalledOnce();
      expect(deletePerson).not.toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
      expect(toastManager.primary).not.toHaveBeenCalled();
    });

    it('should delete the person after confirmation', async () => {
      vitest.mocked(modalManager.showDialog).mockResolvedValue(true);
      vitest.mocked(deletePerson).mockResolvedValue(undefined as never);
      const emit = vitest.spyOn(eventManager, 'emit');

      await expect(handleDeletePerson(person)).resolves.toBe(true);

      expect(deletePerson).toHaveBeenCalledWith({ id: person.id });
      expect(emit).toHaveBeenCalledWith('PersonDelete', person);
      expect(toastManager.primary).toHaveBeenCalledWith('deleted_person');
    });

    it('should report an error when deletion fails', async () => {
      vitest.mocked(modalManager.showDialog).mockResolvedValue(true);
      vitest.mocked(deletePerson).mockRejectedValue(new Error('nope'));
      const emit = vitest.spyOn(eventManager, 'emit');

      await expect(handleDeletePerson(person)).resolves.toBe(false);

      expect(handleError).toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
