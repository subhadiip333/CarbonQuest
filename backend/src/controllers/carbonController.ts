import { Request, Response } from 'express';
import { DbService } from '../services/dbService';
import { 
  chatWithCoach, 
  parseActivityNlp, 
  generateAIPersonalizedQuests, 
  getCarbonForecast,
  analyzeSentiment 
} from '../ai/geminiService';
import { getRouteOptions, getPlaceAutocomplete } from '../services/googleMapsService';

// 1. User Profile Management
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = DbService.getUser();
    res.status(200).json({ status: 'success', data: user });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const resetProfile = async (req: Request, res: Response) => {
  try {
    DbService.resetDb();
    res.status(200).json({ status: 'success', data: DbService.getUser() });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ status: 'error', error: 'Name is required' });
      return;
    }
    const user = DbService.updateUser({ name: name.trim() });
    res.status(200).json({ status: 'success', data: user });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 2. Activities Logger
export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = DbService.getActivities();
    res.status(200).json({ status: 'success', data: activities });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    if (!description || description.trim() === '') {
      res.status(400).json({ status: 'error', error: 'Activity description is required' });
      return;
    }

    // 1. Perform Gemini parsing to extract category and carbon metrics
    const parsedData = await parseActivityNlp(description);

    // 2. Perform sentiment analysis of activity descriptions for emotional insights
    const sentiment = await analyzeSentiment(description);

    // 3. Save activity
    const activity = DbService.addActivity({
      category: parsedData.category || 'Transportation',
      description: parsedData.description || description,
      carbonCostKg: Number(parsedData.carbonCostKg ?? 0),
      carbonSavedKg: Number(parsedData.carbonSavedKg ?? 0)
    });

    // 4. Generate automated AI Sustainability Journal entry if we saved significant carbon
    if (activity.carbonSavedKg > 0.5) {
      const positiveMsgs = [
        "Incredible effort! You are making a measurable difference.",
        "Your green streak is heating up!",
        "The Earth is slightly cooler thanks to your choices today."
      ];
      const negativeMsgs = [
        "A small bump in the road, let's aim for a lower carbon commute next time.",
        "Keep your chin up, every day is a new chance to redeem your score."
      ];

      const motivationalComment = sentiment.score > 0.1
        ? positiveMsgs[Math.floor(Math.random() * positiveMsgs.length)]
        : sentiment.score < -0.1
          ? negativeMsgs[Math.floor(Math.random() * negativeMsgs.length)]
          : "Every sustainable action counts.";

      DbService.addJournalEntry(
        `You logged "${activity.description}" in ${activity.category}. Saved ${activity.carbonSavedKg.toFixed(1)}kg CO₂.`,
        motivationalComment
      );
    }

    res.status(201).json({ 
      status: 'success', 
      data: {
        activity,
        sentiment,
        user: DbService.getUser()
      } 
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 3. Carbon Coach Conversational Assistant
export const chatCoach = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      res.status(400).json({ status: 'error', error: 'Message is required' });
      return;
    }

    // Add user message to history
    DbService.addChatMessage('user', message);

    const history = DbService.getChatHistory();
    // Chat context consists of user profile + history
    const aiResponseText = await chatWithCoach(message, history.slice(0, -1));

    // Save AI message to history
    const aiMsg = DbService.addChatMessage('ai', aiResponseText);

    res.status(200).json({ status: 'success', data: aiMsg });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const history = DbService.getChatHistory();
    res.status(200).json({ status: 'success', data: history });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 4. Predict Emissions & Trajectory
export const getForecast = async (req: Request, res: Response) => {
  try {
    const activities = DbService.getActivities();
    const forecast = await getCarbonForecast(activities);
    res.status(200).json({ status: 'success', data: forecast });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 5. AI Sustainability Journal
export const getJournal = async (req: Request, res: Response) => {
  try {
    const journal = DbService.getJournal();
    res.status(200).json({ status: 'success', data: journal });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 6. Quests & Challenges
export const getChallenges = async (req: Request, res: Response) => {
  try {
    const challenges = DbService.getChallenges();
    res.status(200).json({ status: 'success', data: challenges });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const completeChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const completed = DbService.completeChallenge(id);
    if (!completed) {
      res.status(404).json({ status: 'error', error: 'Challenge not found or already completed' });
      return;
    }
    
    // Add to journal
    DbService.addJournalEntry(
      `Completed Quest: "${completed.title}". Saved ${completed.carbonSavedKg}kg CO₂!`,
      `Awarded +${completed.xpReward} XP and +${completed.coinsReward} Coins. Keep rolling!`
    );

    res.status(200).json({ 
      status: 'success', 
      data: {
        challenge: completed,
        user: DbService.getUser()
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const forceGenerateQuests = async (req: Request, res: Response) => {
  try {
    const { weather, lifestyle } = req.body;
    const currentWeather = weather || 'sunny';
    const userLifestyle = lifestyle || 'commutes by car, eats meat daily';
    
    const quests = await generateAIPersonalizedQuests(userLifestyle, currentWeather);

    // Save them to DB
    const savedQuests = [];
    for (const q of quests) {
      const saved = DbService.addChallenge({
        title: q.title,
        description: q.description,
        category: q.category,
        carbonSavedKg: Number(q.carbonSavedKg || 1),
        xpReward: Number(q.xpReward || 100),
        coinsReward: Number(q.coinsReward || 50),
        type: 'daily'
      });
      savedQuests.push(saved);
    }

    res.status(201).json({ status: 'success', data: savedQuests });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 7. Route Optimization
export const autocompletePlaces = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ status: 'error', error: 'Query parameter q is required' });
      return;
    }
    const predictions = await getPlaceAutocomplete(q);
    res.status(200).json({ status: 'success', data: predictions });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const optimizeRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      res.status(400).json({ status: 'error', error: 'Origin and destination are required' });
      return;
    }

    const routes = await getRouteOptions(origin, destination);
    
    const drivingDistanceStr = routes.driving?.legs?.[0]?.distance?.text || '0 km';
    const transitDistanceStr = routes.transit?.legs?.[0]?.distance?.text || '0 km';
    const bicyclingDistanceStr = routes.bicycling?.legs?.[0]?.distance?.text || '0 km';
    
    const drivingKm = parseFloat(drivingDistanceStr.replace(/[^0-9.]/g, '')) || 0;
    const transitKm = parseFloat(transitDistanceStr.replace(/[^0-9.]/g, '')) || 0;
    const bicyclingKm = parseFloat(bicyclingDistanceStr.replace(/[^0-9.]/g, '')) || 0;

    const drivingCarbon = drivingKm * 0.192; // 192g CO2/km for typical gas car
    const transitCarbon = transitKm * 0.041; // 41g CO2/km for standard bus/train
    const bicyclingCarbon = bicyclingKm * 0.005; // ~5g CO2/km from food fuel

    const savingsTransit = drivingCarbon - transitCarbon;
    const savingsBicycle = drivingCarbon - bicyclingCarbon;

    res.status(200).json({
      status: 'success',
      data: {
        origin,
        destination,
        routes: {
          driving: {
            distance: drivingDistanceStr,
            duration: routes.driving?.legs?.[0]?.duration?.text || 'N/A',
            carbon_kg: drivingCarbon.toFixed(2),
          },
          transit: {
            distance: transitDistanceStr,
            duration: routes.transit?.legs?.[0]?.duration?.text || 'N/A',
            carbon_kg: transitCarbon.toFixed(2),
            savings_kg: savingsTransit.toFixed(2)
          },
          bicycling: {
            distance: bicyclingDistanceStr,
            duration: routes.bicycling?.legs?.[0]?.duration?.text || 'N/A',
            carbon_kg: bicyclingCarbon.toFixed(2),
            savings_kg: savingsBicycle.toFixed(2)
          }
        },
        recommendation: bicyclingKm <= 10 
          ? `Pedal away! Taking a bicycle will save you ${savingsBicycle.toFixed(1)}kg CO₂ compared to driving, and takes just ${routes.bicycling?.legs?.[0]?.duration?.text}.`
          : `Taking public transit is your best green bet here, saving ${savingsTransit.toFixed(1)}kg CO₂.`
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 8. Eco Marketplace
export const getMarketplace = async (req: Request, res: Response) => {
  try {
    const items = DbService.getMarketplace();
    res.status(200).json({ status: 'success', data: items });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

export const redeemMarketplaceItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ status: 'error', error: 'Item ID is required' });
      return;
    }

    const item = DbService.redeemMarketplaceItem(id);
    if (!item) {
      res.status(400).json({ status: 'error', error: 'Redemption failed. Verify coins balance or if item is already claimed.' });
      return;
    }

    // Add to journal
    DbService.addJournalEntry(
      `Redeemed Marketplace Reward: "${item.title}"`,
      `Spent ${item.costCoins} CarbonQuest Coins. Thank you for contributing to actual green projects!`
    );

    res.status(200).json({ 
      status: 'success', 
      data: {
        item,
        user: DbService.getUser()
      } 
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

// 9. Community Leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const list = DbService.getLeaderboard();
    res.status(200).json({ status: 'success', data: list });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};
