'use strict';

const { ConflictError, NotFoundError, ValidationError } = require('../../../src/utils/errors');

// ─── Mock UserProfile model ───────────────────────────────────────────────────

const mockProfile = (overrides = {}) => ({
  id: 'profile-1',
  userId: 'user-1',
  name: 'Alice',
  fitnessGoal: 'weight_loss',
  workoutFrequency: 'medium',
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  ...overrides,
});

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock('../../../src/models/index', () => ({
  UserProfile: {
    findOne: (...args) => mockFindOne(...args),
    create: (...args) => mockCreate(...args),
  },
}));

const {
  createProfile,
  getProfile,
  updateProfile,
} = require('../../../src/services/userProfile.service');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('userProfile.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createProfile ───────────────────────────────────────────────────────────

  describe('createProfile', () => {
    it('throws ConflictError (409) when a profile for the userId already exists', async () => {
      // Requirement 8.5
      mockFindOne.mockResolvedValue(mockProfile());

      const err = await createProfile('user-1', { name: 'Bob' }).catch((e) => e);

      expect(err).toBeInstanceOf(ConflictError);
      expect(err.statusCode).toBe(409);
    });

    it('throws ValidationError (400) when fitnessGoal is invalid', async () => {
      // Requirement 8.7
      mockFindOne.mockResolvedValue(null);

      const err = await createProfile('user-1', { fitnessGoal: 'fly_to_moon' }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    it('throws ValidationError (400) when workoutFrequency is invalid', async () => {
      // Requirement 8.7
      mockFindOne.mockResolvedValue(null);

      const err = await createProfile('user-1', { workoutFrequency: 'extreme' }).catch((e) => e);

      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(400);
    });

    it('creates and returns the profile when data is valid', async () => {
      const created = mockProfile({ userId: 'user-2', fitnessGoal: 'muscle_gain', workoutFrequency: 'high' });
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(created);

      const result = await createProfile('user-2', {
        name: 'Bob',
        fitnessGoal: 'muscle_gain',
        workoutFrequency: 'high',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-2', fitnessGoal: 'muscle_gain', workoutFrequency: 'high' })
      );
      expect(result).toBe(created);
    });

    it('accepts all valid fitnessGoal values without throwing', async () => {
      const validGoals = ['weight_loss', 'muscle_gain', 'weight_maintenance', 'rehabilitation'];

      for (const goal of validGoals) {
        mockFindOne.mockResolvedValue(null);
        mockCreate.mockResolvedValue(mockProfile({ fitnessGoal: goal }));

        await expect(createProfile('user-1', { fitnessGoal: goal })).resolves.toBeDefined();
      }
    });

    it('accepts all valid workoutFrequency values without throwing', async () => {
      const validFrequencies = ['low', 'medium', 'high'];

      for (const freq of validFrequencies) {
        mockFindOne.mockResolvedValue(null);
        mockCreate.mockResolvedValue(mockProfile({ workoutFrequency: freq }));

        await expect(createProfile('user-1', { workoutFrequency: freq })).resolves.toBeDefined();
      }
    });
  });

  // ── getProfile ──────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns the profile when it exists', async () => {
      const profile = mockProfile();
      mockFindOne.mockResolvedValue(profile);

      const result = await getProfile('user-1');

      expect(result).toBe(profile);
    });

    it('throws NotFoundError (404) when profile does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      const err = await getProfile('user-1').catch((e) => e);

      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.statusCode).toBe(404);
    });
  });

  // ── updateProfile ───────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('applies changes and returns the updated profile', async () => {
      const profile = mockProfile();
      mockFindOne.mockResolvedValue(profile);

      const result = await updateProfile('user-1', { name: 'Updated Name', weight: 70 });

      expect(profile.update).toHaveBeenCalledWith({ name: 'Updated Name', weight: 70 });
      expect(result).toBe(profile);
    });

    it('throws NotFoundError (404) when profile does not exist', async () => {
      mockFindOne.mockResolvedValue(null);

      const err = await updateProfile('user-1', { name: 'X' }).catch((e) => e);

      expect(err).toBeInstanceOf(NotFoundError);
      expect(err.statusCode).toBe(404);
    });
  });
});
