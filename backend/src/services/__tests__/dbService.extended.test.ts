import { DbService } from '../dbService';

describe('DbService Extended', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DbService.resetDb();
  });

  describe('Exhaustive user mutations', () => {
    for (let i = 1; i <= 20; i++) {
      it(`should increase user coins by delta - mutation ${i}`, () => {
        const before = DbService.getUser().coins;
        const delta = i * 10;
        const user = DbService.updateUser({ coins: delta });
        expect(user.coins).toBe(before + delta);
      });
    }
  });

  describe('Edge cases', () => {
    it('should complete non-existent challenge without error', () => {
      const result = DbService.completeChallenge('invalid-id');
      expect(result).toBeNull();
    });

    it('should redeem non-existent marketplace item without error', () => {
      const result = DbService.redeemMarketplaceItem('invalid-item');
      expect(result).toBeNull();
    });
  });
});
