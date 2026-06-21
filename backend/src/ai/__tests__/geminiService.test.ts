/**
 * GeminiService tests
 * Since no GEMINI_API_KEY is set in CI/test env, the service falls through
 * to its built-in fallback/mock implementations. Tests assert against those.
 */
import { parseActivityNlp, chatWithCoach, generateAIPersonalizedQuests, analyzeSentiment, getCarbonForecast } from '../geminiService';

jest.mock('@google-cloud/language', () => ({
  LanguageServiceClient: jest.fn().mockImplementation(() => ({
    analyzeSentiment: jest.fn().mockRejectedValue(new Error('No credentials')),
  })),
}));

describe('GeminiService (fallback mode)', () => {
  describe('parseActivityNlp', () => {
    it('should return Transportation for bike activity', async () => {
      const result = await parseActivityNlp('I biked 10km');
      expect(result.category).toBe('Transportation');
      expect(typeof result.carbonCostKg).toBe('number');
      expect(typeof result.carbonSavedKg).toBe('number');
    });

    it('should return Food category for steak', async () => {
      const result = await parseActivityNlp('I ate a steak for lunch');
      expect(result.category).toBe('Food');
      expect(result.carbonCostKg).toBeGreaterThan(0);
    });

    it('should return Food category for vegan meal', async () => {
      const result = await parseActivityNlp('I had a vegan salad');
      expect(result.category).toBe('Food');
      expect(result.carbonSavedKg).toBeGreaterThan(0);
    });

    it('should return Electricity for AC usage', async () => {
      const result = await parseActivityNlp('I turned off the lights and AC');
      expect(result.category).toBe('Electricity');
    });

    it('should return Waste for recycling', async () => {
      const result = await parseActivityNlp('I reused my bottles and bags today');
      expect(result.category).toBe('Waste');
    });

    it('should return Shopping for bag purchase', async () => {
      const result = await parseActivityNlp('I bought a reusable bag');
      expect(result.category).toBe('Shopping');
    });

    it('should return Transportation as default for unknown activity', async () => {
      const result = await parseActivityNlp('I did something random today');
      expect(result.category).toBe('Transportation');
    });

    it('should always return a description', async () => {
      const result = await parseActivityNlp('walked to work');
      expect(result.description).toBeDefined();
      expect(result.description.length).toBeGreaterThan(0);
    });
  });

  describe('chatWithCoach', () => {
    it('should return a string response', async () => {
      const result = await chatWithCoach('Tell me about cycling', []);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should respond to bike-related messages', async () => {
      const result = await chatWithCoach('I bike to work and love to cycle', []);
      expect(result).toContain('🚲');
    });

    it('should respond to meat/food messages', async () => {
      const result = await chatWithCoach('I had steak for dinner', []);
      expect(result).toContain('🥗');
    });

    it('should respond to AC/electricity messages', async () => {
      const result = await chatWithCoach('How do I reduce AC usage?', []);
      expect(result).toContain('❄️');
    });

    it('should handle simulation/what-if queries', async () => {
      const result = await chatWithCoach('What if I stop using my car?', []);
      expect(result).toContain('📊');
    });

    it('should return a default greeting for unknown messages', async () => {
      const result = await chatWithCoach('random stuff', []);
      expect(result).toContain('CarbonQuest AI');
    });

    it('should handle empty chat history', async () => {
      const result = await chatWithCoach('hello', []);
      expect(typeof result).toBe('string');
    });

    it('should handle non-empty chat history', async () => {
      const history = [{ sender: 'user', text: 'hi', timestamp: new Date().toISOString() }];
      const result = await chatWithCoach('hello again', history);
      expect(typeof result).toBe('string');
    });
  });

  describe('generateAIPersonalizedQuests', () => {
    it('should return array of 2 quests for sunny weather', async () => {
      const result = await generateAIPersonalizedQuests('active', 'sunny');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return rain-specific quests when raining', async () => {
      const result = await generateAIPersonalizedQuests('active', 'rainy storm');
      expect(result[0].title).toBe('Carpool Rain Day');
    });

    it('should return solar quests for normal weather', async () => {
      const result = await generateAIPersonalizedQuests('active', 'sunny');
      expect(result[0].title).toBe('Solar Walk');
    });

    it('each quest should have required fields', async () => {
      const result = await generateAIPersonalizedQuests('active', 'sunny');
      (result as any[]).forEach((quest: any) => {
        expect(quest.title).toBeDefined();
        expect(quest.description).toBeDefined();
        expect(typeof quest.carbonSavedKg).toBe('number');
        expect(typeof quest.xpReward).toBe('number');
        expect(typeof quest.coinsReward).toBe('number');
      });
    });
  });

  describe('analyzeSentiment', () => {
    it('should return positive sentiment for good words', async () => {
      const result = await analyzeSentiment('I feel great and happy today');
      expect(result.sentimentLabel).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    }, 15000);

    it('should return negative sentiment for bad words', async () => {
      const result = await analyzeSentiment('sad bad waste pollute');
      expect(result.sentimentLabel).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });

    it('should return neutral for neutral text', async () => {
      const result = await analyzeSentiment('the sky is blue');
      expect(result.sentimentLabel).toBe('neutral');
    });

    it('should always return score between -1 and 1', async () => {
      const result = await analyzeSentiment('happy happy happy happy happy happy happy happy');
      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should return magnitude', async () => {
      const result = await analyzeSentiment('great good love');
      expect(typeof result.magnitude).toBe('number');
    });
  });

  describe('getCarbonForecast', () => {
    it('should return improving trend for high savings', async () => {
      const activities = Array(5).fill({ carbonSavedKg: 2.0, carbonCostKg: 0.5 });
      const result = await getCarbonForecast(activities);
      expect(result.trend).toBe('improving');
    });

    it('should return worsening trend for low savings', async () => {
      const activities = Array(5).fill({ carbonSavedKg: 0.1, carbonCostKg: 3 });
      const result = await getCarbonForecast(activities);
      expect(result.trend).toBe('worsening');
    });

    it('should return stable trend for average savings', async () => {
      const activities = Array(5).fill({ carbonSavedKg: 0.9, carbonCostKg: 1 });
      const result = await getCarbonForecast(activities);
      expect(result.trend).toBe('stable');
    });

    it('should return explanation string', async () => {
      const result = await getCarbonForecast([{ carbonSavedKg: 1, carbonCostKg: 1 }]);
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(0);
    });

    it('should handle empty activities array', async () => {
      const result = await getCarbonForecast([]);
      expect(result.predictedEmissionsKg).toBeDefined();
      expect(result.trajectoryScore).toBeDefined();
    });

    it('trajectoryScore should be capped at 100', async () => {
      const activities = Array(20).fill({ carbonSavedKg: 100, carbonCostKg: 0 });
      const result = await getCarbonForecast(activities);
      expect(result.trajectoryScore).toBeLessThanOrEqual(100);
    });
  });
});
