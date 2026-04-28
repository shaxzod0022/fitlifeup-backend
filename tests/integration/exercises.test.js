'use strict';

/**
 * Integration tests for /exercises routes.
 * Validates: Requirements 1.9, 9.2
 *
 * Uses an in-memory SQLite database to avoid touching the real database file.
 */

// Use in-memory SQLite for tests — must be set before any app/model imports
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Exercise } = require('../../src/models/index');

const USER_A = 'user-a';
const USER_B = 'user-b';

// ─── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Create all tables in the in-memory DB
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  // Wipe exercises between tests for isolation
  await Exercise.destroy({ where: {}, truncate: true });
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Create an exercise directly via the DB (bypasses HTTP layer).
 */
async function seedExercise(overrides = {}) {
  return Exercise.create({
    name: 'Squat',
    visibility: 'private',
    creatorId: USER_A,
    ...overrides,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /exercises', () => {
  it('creates an exercise and returns 201 with the created object', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('X-User-Id', USER_A)
      .send({ name: 'Push-up', visibility: 'private' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Push-up',
      visibility: 'private',
      creatorId: USER_A,
    });
    expect(res.body.id).toBeDefined();
  });

  it('returns 401 when X-User-Id header is missing', async () => {
    const res = await request(app)
      .post('/exercises')
      .send({ name: 'Push-up' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when name field is missing', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('X-User-Id', USER_A)
      .send({ visibility: 'public' });

    expect(res.status).toBe(400);
  });
});

describe('GET /exercises', () => {
  it('returns 200 with an array of exercises visible to the user', async () => {
    await seedExercise({ name: 'Squat', visibility: 'private', creatorId: USER_A });
    await seedExercise({ name: 'Deadlift', visibility: 'public', creatorId: USER_B });

    const res = await request(app)
      .get('/exercises')
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should see own private + public from other user
    const names = res.body.map((e) => e.name);
    expect(names).toContain('Squat');
    expect(names).toContain('Deadlift');
  });

  it('does not return another user\'s private exercises', async () => {
    await seedExercise({ name: 'Secret', visibility: 'private', creatorId: USER_B });

    const res = await request(app)
      .get('/exercises')
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(200);
    const names = res.body.map((e) => e.name);
    expect(names).not.toContain('Secret');
  });

  it('returns 401 when X-User-Id header is missing', async () => {
    const res = await request(app).get('/exercises');
    expect(res.status).toBe(401);
  });
});

describe('GET /exercises/:id', () => {
  it('returns 200 with the exercise when it belongs to the user', async () => {
    const ex = await seedExercise({ name: 'Lunge', creatorId: USER_A, visibility: 'private' });

    const res = await request(app)
      .get(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ex.id);
    expect(res.body.name).toBe('Lunge');
  });

  it('returns 200 for a public exercise owned by another user', async () => {
    const ex = await seedExercise({ name: 'Burpee', creatorId: USER_B, visibility: 'public' });

    const res = await request(app)
      .get(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ex.id);
  });

  it('returns 403 for another user\'s private exercise', async () => {
    const ex = await seedExercise({ name: 'Secret Move', creatorId: USER_B, visibility: 'private' });

    const res = await request(app)
      .get(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent exercise', async () => {
    const res = await request(app)
      .get('/exercises/00000000-0000-0000-0000-000000000000')
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(404);
  });

  it('returns 401 when X-User-Id header is missing', async () => {
    const ex = await seedExercise();

    const res = await request(app).get(`/exercises/${ex.id}`);
    expect(res.status).toBe(401);
  });
});

describe('PUT /exercises/:id', () => {
  it('updates and returns 200 with the updated exercise', async () => {
    const ex = await seedExercise({ name: 'Old Name', creatorId: USER_A });

    const res = await request(app)
      .put(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('returns 403 when trying to update another user\'s exercise', async () => {
    const ex = await seedExercise({ name: 'Owned by B', creatorId: USER_B });

    const res = await request(app)
      .put(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A)
      .send({ name: 'Hijacked' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent exercise', async () => {
    const res = await request(app)
      .put('/exercises/00000000-0000-0000-0000-000000000000')
      .set('X-User-Id', USER_A)
      .send({ name: 'Whatever' });

    expect(res.status).toBe(404);
  });

  it('returns 401 when X-User-Id header is missing', async () => {
    const ex = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${ex.id}`)
      .send({ name: 'No Auth' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /exercises/:id', () => {
  it('deletes the exercise and returns 204', async () => {
    const ex = await seedExercise({ creatorId: USER_A });

    const res = await request(app)
      .delete(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(204);

    // Verify it's actually gone
    const found = await Exercise.findByPk(ex.id);
    expect(found).toBeNull();
  });

  it('returns 403 when trying to delete another user\'s exercise', async () => {
    const ex = await seedExercise({ creatorId: USER_B });

    const res = await request(app)
      .delete(`/exercises/${ex.id}`)
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent exercise', async () => {
    const res = await request(app)
      .delete('/exercises/00000000-0000-0000-0000-000000000000')
      .set('X-User-Id', USER_A);

    expect(res.status).toBe(404);
  });

  it('returns 401 when X-User-Id header is missing', async () => {
    const ex = await seedExercise();

    const res = await request(app).delete(`/exercises/${ex.id}`);
    expect(res.status).toBe(401);
  });
});
