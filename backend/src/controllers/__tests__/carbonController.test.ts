import { Request, Response } from 'express';
import * as carbonController from '../carbonController';
import { DbService } from '../../services/dbService';
import * as geminiService from '../../ai/geminiService';
import * as googleMapsService from '../../services/googleMapsService';
import { clearCache } from '../../middleware/cache';

jest.mock('../../services/dbService');
jest.mock('../../ai/geminiService');
jest.mock('../../services/googleMapsService');
jest.mock('../../middleware/cache');

describe('CarbonController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  // --- getProfile ---
  describe('getProfile', () => {
    it('should return user profile', async () => {
      (DbService.getUser as jest.Mock).mockReturnValue({ name: 'Test' });
      await carbonController.getProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { name: 'Test' } });
    });

    it('should handle errors', async () => {
      (DbService.getUser as jest.Mock).mockImplementation(() => { throw new Error('DB Error'); });
      await carbonController.getProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', error: 'DB Error' });
    });
  });

  // --- resetProfile ---
  describe('resetProfile', () => {
    it('should reset profile and clear cache', async () => {
      (DbService.getUser as jest.Mock).mockReturnValue({ name: 'Reset' });
      await carbonController.resetProfile(req as Request, res as Response);
      expect(DbService.resetDb).toHaveBeenCalled();
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: { name: 'Reset' } });
    });

    it('should handle errors', async () => {
      (DbService.resetDb as jest.Mock).mockImplementation(() => { throw new Error('DB Error'); });
      await carbonController.resetProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- updateProfile ---
  describe('updateProfile', () => {
    it('should update profile and clear cache', async () => {
      req.body = { name: 'New Name' };
      (DbService.updateUser as jest.Mock).mockReturnValue({ name: 'New Name' });
      await carbonController.updateProfile(req as Request, res as Response);
      expect(DbService.updateUser).toHaveBeenCalledWith({ name: 'New Name' });
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors when name is missing', async () => {
      req.body = {};
      // name is undefined → name.trim() throws TypeError
      await carbonController.updateProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors', async () => {
      req.body = { name: 'Name' };
      (DbService.updateUser as jest.Mock).mockImplementation(() => { throw new Error('DB Error'); });
      await carbonController.updateProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getActivities ---
  describe('getActivities', () => {
    it('should return activities', async () => {
      (DbService.getActivities as jest.Mock).mockReturnValue([{ id: '1' }]);
      await carbonController.getActivities(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: [{ id: '1' }] });
    });

    it('should handle errors', async () => {
      (DbService.getActivities as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getActivities(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- createActivity ---
  describe('createActivity', () => {
    it('should create activity and update stats', async () => {
      req.body = { description: 'Bike' };
      (geminiService.parseActivityNlp as jest.Mock).mockResolvedValue({
        category: 'Transportation', carbonCostKg: 0.1, carbonSavedKg: 2.4, description: 'Cycled'
      });
      (geminiService.analyzeSentiment as jest.Mock).mockResolvedValue({ score: 0.5, sentimentLabel: 'positive', magnitude: 1 });
      (DbService.addActivity as jest.Mock).mockReturnValue({ id: '1', carbonSavedKg: 2.4, description: 'Cycled', category: 'Transportation' });
      (DbService.getUser as jest.Mock).mockReturnValue({ level: 2 });

      await carbonController.createActivity(req as Request, res as Response);

      expect(geminiService.parseActivityNlp).toHaveBeenCalledWith('Bike');
      expect(DbService.addActivity).toHaveBeenCalled();
      expect(DbService.addJournalEntry).toHaveBeenCalled(); // carbonSavedKg > 0.5
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should not add journal entry for low carbon savings', async () => {
      req.body = { description: 'Bike' };
      (geminiService.parseActivityNlp as jest.Mock).mockResolvedValue({
        category: 'Transportation', carbonCostKg: 0.1, carbonSavedKg: 0.2, description: 'Short walk'
      });
      (geminiService.analyzeSentiment as jest.Mock).mockResolvedValue({ score: 0, sentimentLabel: 'neutral', magnitude: 0 });
      (DbService.addActivity as jest.Mock).mockReturnValue({ id: '2', carbonSavedKg: 0.2, description: 'Short walk', category: 'Transportation' });
      (DbService.getUser as jest.Mock).mockReturnValue({ level: 1 });

      await carbonController.createActivity(req as Request, res as Response);

      expect(DbService.addJournalEntry).not.toHaveBeenCalled(); // carbonSavedKg <= 0.5
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors', async () => {
      req.body = { description: 'Bike' };
      (geminiService.parseActivityNlp as jest.Mock).mockRejectedValue(new Error('Error'));
      await carbonController.createActivity(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getChatHistory ---
  describe('getChatHistory', () => {
    it('should return chat history', async () => {
      (DbService.getChatHistory as jest.Mock).mockReturnValue([]);
      await carbonController.getChatHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getChatHistory as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getChatHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- chatCoach ---
  describe('chatCoach', () => {
    it('should chat with coach', async () => {
      req.body = { message: 'Hi' };
      (DbService.getChatHistory as jest.Mock).mockReturnValue([]);
      (DbService.getUser as jest.Mock).mockReturnValue({ name: 'Alex' });
      (geminiService.chatWithCoach as jest.Mock).mockResolvedValue('Hello');
      (DbService.addChatMessage as jest.Mock).mockReturnValue({ text: 'Hello' });

      await carbonController.chatCoach(req as Request, res as Response);

      expect(DbService.addChatMessage).toHaveBeenCalledWith('user', 'Hi');
      expect(geminiService.chatWithCoach).toHaveBeenCalled();
      expect(DbService.addChatMessage).toHaveBeenCalledWith('ai', 'Hello');
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      req.body = { message: 'Hi' };
      (DbService.getChatHistory as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.chatCoach(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getForecast ---
  describe('getForecast', () => {
    it('should return forecast', async () => {
      (DbService.getActivities as jest.Mock).mockReturnValue([]);
      (geminiService.getCarbonForecast as jest.Mock).mockResolvedValue({ trend: 'stable' });
      await carbonController.getForecast(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getActivities as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getForecast(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getJournal ---
  describe('getJournal', () => {
    it('should return journal', async () => {
      (DbService.getJournal as jest.Mock).mockReturnValue([]);
      await carbonController.getJournal(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getJournal as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getJournal(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getChallenges ---
  describe('getChallenges', () => {
    it('should return challenges', async () => {
      (DbService.getChallenges as jest.Mock).mockReturnValue([]);
      await carbonController.getChallenges(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getChallenges as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getChallenges(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- completeChallenge ---
  describe('completeChallenge', () => {
    it('should complete challenge', async () => {
      req.params = { id: '1' };
      (DbService.completeChallenge as jest.Mock).mockReturnValue({
        id: '1', completed: true, title: 'Quest', carbonSavedKg: 2,
        xpReward: 10, coinsReward: 10
      });
      (DbService.getUser as jest.Mock).mockReturnValue({ level: 2 });

      await carbonController.completeChallenge(req as Request, res as Response);

      expect(DbService.completeChallenge).toHaveBeenCalledWith('1');
      expect(DbService.addJournalEntry).toHaveBeenCalled();
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if challenge not found', async () => {
      req.params = { id: '1' };
      (DbService.completeChallenge as jest.Mock).mockReturnValue(null);
      await carbonController.completeChallenge(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params = { id: '1' };
      (DbService.completeChallenge as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.completeChallenge(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- forceGenerateQuests ---
  describe('forceGenerateQuests', () => {
    it('should generate quests', async () => {
      req.body = { weather: 'sunny', lifestyle: 'active' };
      (geminiService.generateAIPersonalizedQuests as jest.Mock).mockResolvedValue([
        { title: 'Quest', description: 'Desc', carbonSavedKg: 1, xpReward: 10, coinsReward: 10, category: 'Transportation', type: 'daily' }
      ]);
      (DbService.addChallenge as jest.Mock).mockReturnValue({ id: '1' });

      await carbonController.forceGenerateQuests(req as Request, res as Response);

      expect(geminiService.generateAIPersonalizedQuests).toHaveBeenCalled();
      expect(DbService.addChallenge).toHaveBeenCalled();
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors', async () => {
      req.body = {};
      (geminiService.generateAIPersonalizedQuests as jest.Mock).mockRejectedValue(new Error('Error'));
      await carbonController.forceGenerateQuests(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- optimizeRoute ---
  describe('optimizeRoute', () => {
    it('should optimize route', async () => {
      req.body = { origin: 'A', destination: 'B' };
      (googleMapsService.getRouteOptions as jest.Mock).mockResolvedValue({
        driving: { legs: [{ distance: { text: '10 km', value: 10000 }, duration: { text: '15 mins', value: 900 } }] },
        transit: { legs: [{ distance: { text: '11 km', value: 11000 }, duration: { text: '25 mins', value: 1500 } }] },
        bicycling: { legs: [{ distance: { text: '9 km', value: 9000 }, duration: { text: '30 mins', value: 1800 } }] },
      });

      await carbonController.optimizeRoute(req as Request, res as Response);

      expect(googleMapsService.getRouteOptions).toHaveBeenCalledWith('A', 'B');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      req.body = { origin: 'A', destination: 'B' };
      (googleMapsService.getRouteOptions as jest.Mock).mockRejectedValue(new Error('Error'));
      await carbonController.optimizeRoute(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- autocompletePlaces ---
  // Controller reads req.query.q (not req.query.input)
  describe('autocompletePlaces', () => {
    it('should return autocomplete suggestions', async () => {
      req.query = { q: 'New' };
      (googleMapsService.getPlaceAutocomplete as jest.Mock).mockResolvedValue([]);

      await carbonController.autocompletePlaces(req as Request, res as Response);

      expect(googleMapsService.getPlaceAutocomplete).toHaveBeenCalledWith('New');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if no query param q', async () => {
      req.query = {};
      await carbonController.autocompletePlaces(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      req.query = { q: 'New' };
      (googleMapsService.getPlaceAutocomplete as jest.Mock).mockRejectedValue(new Error('Error'));
      await carbonController.autocompletePlaces(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getMarketplace ---
  describe('getMarketplace', () => {
    it('should return marketplace items', async () => {
      (DbService.getMarketplace as jest.Mock).mockReturnValue([]);
      await carbonController.getMarketplace(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getMarketplace as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getMarketplace(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- redeemMarketplaceItem ---
  // Controller: redeemMarketplaceItem returns null → 400 ("Redemption failed...")
  // It does NOT call updateUser or check coins separately.
  describe('redeemMarketplaceItem', () => {
    it('should redeem item successfully', async () => {
      req.body = { id: '1' };
      (DbService.redeemMarketplaceItem as jest.Mock).mockReturnValue({ id: '1', title: 'Item', costCoins: 10 });
      (DbService.getUser as jest.Mock).mockReturnValue({ coins: 20 });

      await carbonController.redeemMarketplaceItem(req as Request, res as Response);

      expect(DbService.redeemMarketplaceItem).toHaveBeenCalledWith('1');
      expect(DbService.addJournalEntry).toHaveBeenCalled();
      expect(clearCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if item not found or redemption fails', async () => {
      req.body = { id: '1' };
      (DbService.redeemMarketplaceItem as jest.Mock).mockReturnValue(null);
      await carbonController.redeemMarketplaceItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      req.body = { id: '1' };
      (DbService.redeemMarketplaceItem as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.redeemMarketplaceItem(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // --- getLeaderboard ---
  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      (DbService.getLeaderboard as jest.Mock).mockReturnValue([]);
      await carbonController.getLeaderboard(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      (DbService.getLeaderboard as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
      await carbonController.getLeaderboard(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
