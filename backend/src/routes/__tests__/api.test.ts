import request from 'supertest';
import app from '../../app';
import { DbService } from '../../services/dbService';

// Mock AI and Maps services
jest.mock('../../ai/geminiService', () => ({
  parseActivityNlp: jest.fn().mockResolvedValue({ category: 'Food', description: 'Vegan Meal', carbonCostKg: 0.5, carbonSavedKg: 1.5 }),
  analyzeSentiment: jest.fn().mockResolvedValue({ score: 0.8, magnitude: 0.9 }),
  chatWithCoach: jest.fn().mockResolvedValue('Hello, keep it up!'),
  getCarbonForecast: jest.fn().mockResolvedValue({ trend: 'down', predictedKg: 10 }),
  generateAIPersonalizedQuests: jest.fn().mockResolvedValue([{ title: 'AI Quest', description: 'test', category: 'Energy', carbonSavedKg: 1, xpReward: 10, coinsReward: 5 }])
}));

jest.mock('../../services/googleMapsService', () => ({
  getPlaceAutocomplete: jest.fn().mockResolvedValue([{ description: 'New York, NY', place_id: '123' }]),
  getRouteOptions: jest.fn().mockResolvedValue({
    driving: { legs: [{ distance: { text: '10 km' }, duration: { text: '15 mins' } }] },
    transit: { legs: [{ distance: { text: '12 km' }, duration: { text: '30 mins' } }] },
    bicycling: { legs: [{ distance: { text: '11 km' }, duration: { text: '45 mins' } }] },
  })
}));

describe('API Routes', () => {
  beforeEach(() => {
    DbService.resetDb();
  });

  describe('GET /api/v1/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app).get('/api/v1/profile');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBeDefined();
    });
  });

  describe('POST /api/v1/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app).post('/api/v1/profile').send({ name: 'New Avatar' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Avatar');
    });

    it('should fail if name is empty', async () => {
      const res = await request(app).post('/api/v1/profile').send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/activities', () => {
    it('should return activities', async () => {
      const res = await request(app).get('/api/v1/activities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/activities', () => {
    it('should create an activity and use AI parsing', async () => {
      const res = await request(app).post('/api/v1/activities').send({ description: 'I ate a vegan meal' });
      expect(res.status).toBe(201);
      expect(res.body.data.activity.description).toBe('Vegan Meal');
    });
  });

  describe('POST /api/v1/coach/chat', () => {
    it('should return AI chat response', async () => {
      const res = await request(app).post('/api/v1/coach/chat').send({ message: 'Hi coach' });
      expect(res.status).toBe(200);
      expect(res.body.data.text).toBe('Hello, keep it up!');
    });
  });

  describe('GET /api/v1/challenges', () => {
    it('should return challenges list', async () => {
      const res = await request(app).get('/api/v1/challenges');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/routes/optimize', () => {
    it('should return route options and carbon savings', async () => {
      const res = await request(app).post('/api/v1/routes/optimize').send({ origin: 'A', destination: 'B' });
      expect(res.status).toBe(200);
      expect(res.body.data.routes.driving.distance).toBe('10 km');
    });
  });
});
