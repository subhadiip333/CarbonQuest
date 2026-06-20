import { Router } from 'express';
import { 
  getProfile, 
  updateProfile,
  resetProfile, 
  getActivities, 
  createActivity, 
  chatCoach, 
  getChatHistory, 
  getForecast, 
  getJournal, 
  getChallenges, 
  completeChallenge, 
  forceGenerateQuests, 
  optimizeRoute, 
  autocompletePlaces,
  getMarketplace, 
  redeemMarketplaceItem, 
  getLeaderboard 
} from '../controllers/carbonController';

const router = Router();

// User Profile
router.get('/profile', getProfile);
router.post('/profile', updateProfile);
router.post('/profile/reset', resetProfile);

// Activities Journal
router.get('/activities', getActivities);
router.post('/activities', createActivity);

// AI Coach Chat
router.get('/coach/history', getChatHistory);
router.post('/coach/chat', chatCoach);
router.get('/coach/forecast', getForecast);
router.get('/coach/journal', getJournal);

// Gamified Challenges
router.get('/challenges', getChallenges);
router.post('/challenges/:id/complete', completeChallenge);
router.post('/challenges/generate', forceGenerateQuests);

// Route Planner Optimization
router.post('/routes/optimize', optimizeRoute);
router.get('/places/autocomplete', autocompletePlaces);

// Eco Marketplace
router.get('/marketplace', getMarketplace);
router.post('/marketplace/redeem', redeemMarketplaceItem);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;
