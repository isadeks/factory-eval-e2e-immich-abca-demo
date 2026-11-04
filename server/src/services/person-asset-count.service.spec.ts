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

  it('should include the number of assets for each person', async () => {
    const auth = AuthFactory.create();
    const [named, unnamed] = [PersonFactory.create({ name: 'Alice' }), PersonFactory.create({ name: '' })];

    mocks.person.getAllForUser.mockResolvedValue({
      items: [
        { ...named, assetCount: 12 },
        // the database driver may return aggregate counts as strings
        { ...unnamed, assetCount: '3' as unknown as number },
      ],
      hasNextPage: false,
    });
    mocks.person.getNumberOfPeople.mockResolvedValue({ total: 2, hidden: 0 });

    const result = await sut.getAll(auth, { withHidden: false, page: 1, size: 10 });

    expect(result.people).toEqual([
      expect.objectContaining({ id: named.id, assetCount: 12 }),
      expect.objectContaining({ id: unnamed.id, assetCount: 3 }),
    ]);
  });

  it('should leave the asset count out when it is not known', async () => {
    const auth = AuthFactory.create();
    const person = PersonFactory.create();

    mocks.person.getAllForUser.mockResolvedValue({ items: [person], hasNextPage: false });
    mocks.person.getNumberOfPeople.mockResolvedValue({ total: 1, hidden: 0 });

    const result = await sut.getAll(auth, { withHidden: false, page: 1, size: 10 });

    expect(result.people[0]).not.toHaveProperty('assetCount');
  });
});
