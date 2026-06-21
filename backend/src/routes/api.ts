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

import { validateRequest } from '../middleware/validate';
import { cacheMiddleware } from '../middleware/cache';
import { 
  updateProfileSchema, 
  createActivitySchema, 
  chatMessageSchema, 
  generateQuestsSchema, 
  optimizeRouteSchema, 
  redeemItemSchema 
} from '../validators';

const router = Router();

// User Profile
router.get('/profile', cacheMiddleware(30), getProfile);
router.post('/profile', validateRequest(updateProfileSchema), updateProfile);
router.post('/profile/reset', resetProfile);

// Activities Journal
router.get('/activities', cacheMiddleware(30), getActivities);
router.post('/activities', validateRequest(createActivitySchema), createActivity);

// AI Coach Chat
router.get('/coach/history', cacheMiddleware(10), getChatHistory);
router.post('/coach/chat', validateRequest(chatMessageSchema), chatCoach);
router.get('/coach/forecast', cacheMiddleware(300), getForecast);
router.get('/coach/journal', cacheMiddleware(30), getJournal);

// Gamified Challenges
router.get('/challenges', cacheMiddleware(30), getChallenges);
router.post('/challenges/:id/complete', completeChallenge);
router.post('/challenges/generate', validateRequest(generateQuestsSchema), forceGenerateQuests);

// Route Planner Optimization
router.post('/routes/optimize', validateRequest(optimizeRouteSchema), optimizeRoute);
router.get('/places/autocomplete', cacheMiddleware(300), autocompletePlaces);

// Eco Marketplace
router.get('/marketplace', cacheMiddleware(300), getMarketplace);
router.post('/marketplace/redeem', validateRequest(redeemItemSchema), redeemMarketplaceItem);

// Leaderboard
router.get('/leaderboard', cacheMiddleware(30), getLeaderboard);

export default router;
