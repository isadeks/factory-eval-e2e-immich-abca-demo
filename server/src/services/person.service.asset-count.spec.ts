import { PersonService } from 'src/services/person.service';
import { AuthFactory } from 'test/factories/auth.factory';
import { PersonFactory } from 'test/factories/person.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(`${PersonService.name} asset count`, () => {
  let sut: PersonService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PersonService));
  });

  describe('getAll', () => {
    it('should include the number of assets each person appears in', async () => {
      const auth = AuthFactory.create();
      const [first, second] = [PersonFactory.create(), PersonFactory.create()];

      mocks.person.getAllForUser.mockResolvedValue({
        items: [
          { ...first, assetCount: 3 },
          // pg returns bigint counts as strings
          { ...second, assetCount: '12' as unknown as number },
        ],
        hasNextPage: false,
      });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 0 });

      const { people } = await sut.getAll(auth, { withHidden: false, page: 1, size: 10 });

      expect(people).toEqual([
        expect.objectContaining({ id: first.id, assetCount: 3 }),
        expect.objectContaining({ id: second.id, assetCount: 12 }),
      ]);
    });

    it('should not leak the count into other person responses', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.getAllForUser.mockResolvedValue({ items: [person], hasNextPage: false });
      mocks.person.getNumberOfPeople.mockResolvedValue({ total: 1, hidden: 0 });

      const { people } = await sut.getAll(auth, { withHidden: false, page: 1, size: 10 });

      expect(people[0]).not.toHaveProperty('assetCount');
    });
  });
});
