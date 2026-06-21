import { 
  updateProfileSchema, 
  createActivitySchema, 
  chatMessageSchema, 
  generateQuestsSchema, 
  optimizeRouteSchema, 
  redeemItemSchema 
} from '../index';

describe('Validators', () => {
  describe('updateProfileSchema', () => {
    it('should validate valid name', () => {
      const result = updateProfileSchema.safeParse({ name: 'Alex' });
      expect(result.success).toBe(true);
    });
    it('should invalidate missing name', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it('should invalidate empty name', () => {
      const result = updateProfileSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
    it('should invalidate name too long', () => {
      const result = updateProfileSchema.safeParse({ name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });
    it('should allow exact max length name', () => {
      const result = updateProfileSchema.safeParse({ name: 'A'.repeat(100) });
      expect(result.success).toBe(true);
    });
    it('should invalidate non-string name', () => {
      const result = updateProfileSchema.safeParse({ name: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('createActivitySchema', () => {
    it('should validate valid description', () => {
      const result = createActivitySchema.safeParse({ description: 'Rode a bike' });
      expect(result.success).toBe(true);
    });
    it('should invalidate missing description', () => {
      const result = createActivitySchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it('should invalidate empty description', () => {
      const result = createActivitySchema.safeParse({ description: '' });
      expect(result.success).toBe(false);
    });
    it('should invalidate description too long', () => {
      const result = createActivitySchema.safeParse({ description: 'A'.repeat(501) });
      expect(result.success).toBe(false);
    });
    it('should allow exact max length description', () => {
      const result = createActivitySchema.safeParse({ description: 'A'.repeat(500) });
      expect(result.success).toBe(true);
    });
    it('should invalidate non-string description', () => {
      const result = createActivitySchema.safeParse({ description: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('chatMessageSchema', () => {
    it('should validate valid message', () => {
      const result = chatMessageSchema.safeParse({ message: 'Hello AI' });
      expect(result.success).toBe(true);
    });
    it('should invalidate missing message', () => {
      const result = chatMessageSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it('should invalidate empty message', () => {
      const result = chatMessageSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
    });
    it('should invalidate message too long', () => {
      const result = chatMessageSchema.safeParse({ message: 'A'.repeat(1001) });
      expect(result.success).toBe(false);
    });
    it('should allow exact max length message', () => {
      const result = chatMessageSchema.safeParse({ message: 'A'.repeat(1000) });
      expect(result.success).toBe(true);
    });
    it('should invalidate non-string message', () => {
      const result = chatMessageSchema.safeParse({ message: true });
      expect(result.success).toBe(false);
    });
  });

  describe('generateQuestsSchema', () => {
    it('should validate empty object', () => {
      const result = generateQuestsSchema.safeParse({});
      expect(result.success).toBe(true);
    });
    it('should validate with weather', () => {
      const result = generateQuestsSchema.safeParse({ weather: 'sunny' });
      expect(result.success).toBe(true);
    });
    it('should validate with lifestyle', () => {
      const result = generateQuestsSchema.safeParse({ lifestyle: 'active' });
      expect(result.success).toBe(true);
    });
    it('should validate with both', () => {
      const result = generateQuestsSchema.safeParse({ weather: 'sunny', lifestyle: 'active' });
      expect(result.success).toBe(true);
    });
    it('should invalidate non-string weather', () => {
      const result = generateQuestsSchema.safeParse({ weather: 123 });
      expect(result.success).toBe(false);
    });
    it('should invalidate non-string lifestyle', () => {
      const result = generateQuestsSchema.safeParse({ lifestyle: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('optimizeRouteSchema', () => {
    it('should validate valid origin and destination', () => {
      const result = optimizeRouteSchema.safeParse({ origin: 'A', destination: 'B' });
      expect(result.success).toBe(true);
    });
    it('should invalidate missing origin', () => {
      const result = optimizeRouteSchema.safeParse({ destination: 'B' });
      expect(result.success).toBe(false);
    });
    it('should invalidate missing destination', () => {
      const result = optimizeRouteSchema.safeParse({ origin: 'A' });
      expect(result.success).toBe(false);
    });
    it('should invalidate empty origin', () => {
      const result = optimizeRouteSchema.safeParse({ origin: '', destination: 'B' });
      expect(result.success).toBe(false);
    });
    it('should invalidate empty destination', () => {
      const result = optimizeRouteSchema.safeParse({ origin: 'A', destination: '' });
      expect(result.success).toBe(false);
    });
    it('should invalidate non-string origin', () => {
      const result = optimizeRouteSchema.safeParse({ origin: 123, destination: 'B' });
      expect(result.success).toBe(false);
    });
    it('should invalidate non-string destination', () => {
      const result = optimizeRouteSchema.safeParse({ origin: 'A', destination: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('redeemItemSchema', () => {
    it('should validate valid id', () => {
      const result = redeemItemSchema.safeParse({ id: 'item1' });
      expect(result.success).toBe(true);
    });
    it('should invalidate missing id', () => {
      const result = redeemItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it('should invalidate empty id', () => {
      const result = redeemItemSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
    it('should invalidate non-string id', () => {
      const result = redeemItemSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });
  });
});
