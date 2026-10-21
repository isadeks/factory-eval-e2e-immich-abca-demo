import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FACE_UNCERTAIN_DISTANCE_MARGIN } from 'src/constants';
import { JobName, JobStatus } from 'src/enum';
import { FaceSearchResult } from 'src/repositories/search.repository';
import { PersonService } from 'src/services/person.service';
import { AssetFaceFactory } from 'test/factories/asset-face.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { PersonFactory } from 'test/factories/person.factory';
import { getForFacialRecognitionJob } from 'test/mappers';
import { newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

// the repository returns people as JSON, i.e. with dates as strings
const asJson = <T extends object>(value: T) => JSON.parse(JSON.stringify(value));

describe(`${PersonService.name} (similar faces and cover photo)`, () => {
  let sut: PersonService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PersonService));
  });

  const setup = () => {
    const asset = AssetFactory.create();
    const face = AssetFaceFactory.create({ assetId: asset.id });
    mocks.systemMetadata.get.mockResolvedValue({ machineLearning: { facialRecognition: { minFaces: 1 } } });
    mocks.person.getFaceForFacialRecognitionJob.mockResolvedValue(getForFacialRecognitionJob(face, asset));
    return { asset, face };
  };

  describe('handleRecognizeFaces', () => {
    it('should ask the user to confirm when a new person is similar, but not similar enough, to an existing person', async () => {
      const { face } = setup();
      const existingPerson = PersonFactory.create();
      const newPerson = PersonFactory.create();
      const uncertainFace = { ...AssetFaceFactory.create({ personId: existingPerson.id }), distance: 0.55 };

      mocks.search.searchFaces
        .mockResolvedValueOnce([{ ...face, distance: 0 }] as FaceSearchResult[]) // only the face itself
        .mockResolvedValueOnce([]) // no match with a person
        .mockResolvedValueOnce([uncertainFace] as FaceSearchResult[]); // unsure match
      mocks.person.create.mockResolvedValue(newPerson);

      await sut.handleRecognizeFaces({ id: face.id });

      expect(mocks.search.searchFaces).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hasPerson: true,
          numResults: 1,
          maxDistance: 0.5 + FACE_UNCERTAIN_DISTANCE_MARGIN,
        }),
      );
      expect(mocks.person.create).toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({ faceIds: [face.id], newPersonId: newPerson.id });
      expect(mocks.person.createMatchSuggestion).toHaveBeenCalledWith(newPerson.id, existingPerson.id, 0.55);
    });

    it('should not ask the user when there is no similar person', async () => {
      const { face } = setup();
      const newPerson = PersonFactory.create();

      mocks.search.searchFaces
        .mockResolvedValueOnce([{ ...face, distance: 0 }] as FaceSearchResult[])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mocks.person.create.mockResolvedValue(newPerson);

      await sut.handleRecognizeFaces({ id: face.id });

      expect(mocks.person.create).toHaveBeenCalled();
      expect(mocks.person.createMatchSuggestion).not.toHaveBeenCalled();
    });

    it('should not ask the user when the face is a confident match', async () => {
      const { face } = setup();
      const existingPerson = PersonFactory.create();
      const confident = { ...AssetFaceFactory.create({ personId: existingPerson.id }), distance: 0.3 };

      mocks.search.searchFaces.mockResolvedValueOnce([confident] as FaceSearchResult[]);

      await expect(sut.handleRecognizeFaces({ id: face.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.person.create).not.toHaveBeenCalled();
      expect(mocks.person.createMatchSuggestion).not.toHaveBeenCalled();
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({ faceIds: [face.id], newPersonId: existingPerson.id });
    });

    it('should make a newer photo the cover of the person it is assigned to', async () => {
      const { face } = setup();
      const existingPerson = PersonFactory.create();
      const confident = { ...AssetFaceFactory.create({ personId: existingPerson.id }), distance: 0.3 };

      mocks.search.searchFaces.mockResolvedValueOnce([confident] as FaceSearchResult[]);
      mocks.person.updateFeatureFaceIfNewer.mockResolvedValue(true);

      await sut.handleRecognizeFaces({ id: face.id });

      expect(mocks.person.updateFeatureFaceIfNewer).toHaveBeenCalledWith(existingPerson.id, face.id);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.PersonGenerateThumbnail,
        data: { id: existingPerson.id },
      });
    });

    it('should not regenerate the thumbnail when the cover did not change', async () => {
      const { face } = setup();
      const existingPerson = PersonFactory.create();
      const confident = { ...AssetFaceFactory.create({ personId: existingPerson.id }), distance: 0.3 };

      mocks.search.searchFaces.mockResolvedValueOnce([confident] as FaceSearchResult[]);
      mocks.person.updateFeatureFaceIfNewer.mockResolvedValue(false);

      await sut.handleRecognizeFaces({ id: face.id });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('cover photo', () => {
    it('should remember that the user picked the cover', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();
      const face = AssetFaceFactory.create({ personId: person.id });

      mocks.person.update.mockResolvedValue(person);
      mocks.person.getForFeatureFaceUpdate.mockResolvedValue(face);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([face.assetId]));
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.id]));

      await sut.update(auth, person.id, { featureFaceAssetId: face.assetId });

      expect(mocks.person.setCustomCover).toHaveBeenCalledWith(person.id);
    });

    it('should not mark the cover as picked by the user when only the name changes', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create();

      mocks.person.update.mockResolvedValue(person);
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set([person.id]));

      await sut.update(auth, person.id, { name: 'Alice' });

      expect(mocks.person.setCustomCover).not.toHaveBeenCalled();
    });

    it('should go back to the latest photo when the cover face is replaced automatically', async () => {
      const person = PersonFactory.create();
      const latest = AssetFaceFactory.create({ personId: person.id });

      mocks.person.getRandomFace.mockResolvedValue(latest);
      mocks.person.update.mockResolvedValue(person);

      await sut.createNewFeaturePhoto([person.id]);

      expect(mocks.person.update).toHaveBeenCalledWith({ id: person.id, faceAssetId: latest.id });
      expect(mocks.person.clearCustomCover).toHaveBeenCalledWith(person.id);
    });
  });

  describe('match suggestions', () => {
    it('should list the suggestions of the user', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ ownerId: auth.user.id, name: '' });
      const suggestedPerson = PersonFactory.create({ ownerId: auth.user.id, name: 'Alice' });
      const id = newUuid();

      mocks.person.getMatchSuggestions.mockResolvedValue([
        {
          id,
          distance: 0.55,
          createdAt: new Date(),
          person: asJson(person),
          suggestedPerson: asJson(suggestedPerson),
        },
      ]);

      await expect(sut.getMatchSuggestions(auth)).resolves.toEqual([
        {
          id,
          distance: 0.55,
          person: expect.objectContaining({ id: person.id, name: '' }),
          suggestedPerson: expect.objectContaining({ id: suggestedPerson.id, name: 'Alice' }),
        },
      ]);
      expect(mocks.person.getMatchSuggestions).toHaveBeenCalledWith(auth.user.id);
    });

    it('should merge the new person into the existing person when confirmed', async () => {
      const auth = AuthFactory.create();
      const person = PersonFactory.create({ ownerId: auth.user.id });
      const suggestedPerson = PersonFactory.create({ ownerId: auth.user.id, name: 'Alice' });
      const id = newUuid();

      mocks.person.getMatchSuggestion.mockResolvedValue({
        id,
        personId: person.id,
        suggestedPersonId: suggestedPerson.id,
      });
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set([suggestedPerson.id]));
      mocks.access.person.checkOwnerAccess.mockResolvedValueOnce(new Set([person.id]));
      mocks.person.getById.mockImplementation((personId) =>
        Promise.resolve(personId === person.id ? person : suggestedPerson),
      );
      mocks.person.getForPeopleDelete.mockResolvedValue([]);

      await expect(sut.confirmMatchSuggestion(auth, id)).resolves.toEqual(
        expect.objectContaining({ id: suggestedPerson.id, name: 'Alice' }),
      );

      expect(mocks.person.getMatchSuggestion).toHaveBeenCalledWith(id, auth.user.id);
      expect(mocks.person.reassignFaces).toHaveBeenCalledWith({
        oldPersonId: person.id,
        newPersonId: suggestedPerson.id,
      });
    });

    it('should fail when the merge fails', async () => {
      const auth = AuthFactory.create();
      const id = newUuid();

      mocks.person.getMatchSuggestion.mockResolvedValue({ id, personId: newUuid(), suggestedPersonId: newUuid() });
      mocks.access.person.checkOwnerAccess.mockResolvedValue(new Set());

      await expect(sut.confirmMatchSuggestion(auth, id)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when confirming a suggestion of somebody else', async () => {
      const auth = AuthFactory.create();
      mocks.person.getMatchSuggestion.mockResolvedValue(undefined);

      await expect(sut.confirmMatchSuggestion(auth, newUuid())).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should keep the people apart when rejected', async () => {
      const auth = AuthFactory.create();
      const id = newUuid();

      mocks.person.getMatchSuggestion.mockResolvedValue({ id, personId: newUuid(), suggestedPersonId: newUuid() });

      await sut.rejectMatchSuggestion(auth, id);

      expect(mocks.person.deleteMatchSuggestion).toHaveBeenCalledWith(id);
      expect(mocks.person.reassignFaces).not.toHaveBeenCalled();
    });

    it('should throw when rejecting a suggestion of somebody else', async () => {
      const auth = AuthFactory.create();
      mocks.person.getMatchSuggestion.mockResolvedValue(undefined);

      await expect(sut.rejectMatchSuggestion(auth, newUuid())).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.person.deleteMatchSuggestion).not.toHaveBeenCalled();
    });
  });
});
