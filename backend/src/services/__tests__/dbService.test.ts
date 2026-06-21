import fs from 'fs';
import path from 'path';
import { DbService } from '../dbService';

describe('DbService', () => {
  beforeEach(() => {
    // Reset database to default before each test
    DbService.resetDb();
  });

  it('should initialize and return the default user', () => {
    const user = DbService.getUser();
    expect(user).toBeDefined();
    expect(user.id).toBe('user-123');
    expect(user.name).toBe('Alex Eco-Warrior');
  });

  it('should update user properties and recalculate avatar state', () => {
    const updatedUser = DbService.updateUser({ name: 'New Name', avatarScore: 20 });
    expect(updatedUser.name).toBe('New Name');
    expect(updatedUser.avatarScore).toBe(20);
    expect(updatedUser.avatarState).toBe('polluted');

    const pristineUser = DbService.updateUser({ avatarScore: 90 });
    expect(pristineUser.avatarState).toBe('pristine');
  });

  it('should add a new activity and update user score', () => {
    const initialUser = DbService.getUser();
    const activity = DbService.addActivity({
      category: 'Food',
      description: 'Vegan Burger',
      carbonCostKg: 0.5,
      carbonSavedKg: 2.0
    });

    expect(activity.id).toBeDefined();
    expect(activity.category).toBe('Food');
    
    const activities = DbService.getActivities();
    expect(activities[0].id).toBe(activity.id);

    const updatedUser = DbService.getUser();
    expect(updatedUser.coins).toBe(initialUser.coins + 20); // Math.max(5, Math.round(2.0 * 10))
  });

  it('should mark a challenge as completed and add rewards', () => {
    const initialUser = DbService.getUser();
    const challenge = DbService.getChallenges()[0];
    
    const completed = DbService.completeChallenge(challenge.id);
    expect(completed).not.toBeNull();
    expect(completed?.completed).toBe(true);

    const updatedUser = DbService.getUser();
    expect(updatedUser.xp).toBeGreaterThan(initialUser.xp);
    expect(updatedUser.coins).toBeGreaterThan(initialUser.coins);
  });
  
  it('should redeem marketplace item if user has enough coins', () => {
    // Add 1000 coins to make sure they have enough
    DbService.updateUser({ coins: 1000 });
    const item = DbService.getMarketplace()[0];
    
    const redeemed = DbService.redeemMarketplaceItem(item.id);
    expect(redeemed).not.toBeNull();
    expect(redeemed?.redeemed).toBe(true);
    
    const updatedUser = DbService.getUser();
    expect(updatedUser.coins).toBeLessThan(1350); // initial 350 + 1000 - cost
  });
  
  it('should not redeem marketplace item if user has not enough coins', () => {
    // Reset coins to 0
    DbService.updateUser({ coins: -DbService.getUser().coins }); // Make it 0
    const item = DbService.getMarketplace()[0];
    
    const redeemed = DbService.redeemMarketplaceItem(item.id);
    expect(redeemed).toBeNull();
  });
});
