import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpNeeded: number;
  coins: number;
  greenPoints: number;
  streakDays: number;
  lastActiveDate: string;
  avatarState: 'polluted' | 'average' | 'healthy' | 'pristine';
  avatarScore: number; // 0 to 100
}

export interface Activity {
  id: string;
  userId: string;
  category: 'Transportation' | 'Electricity' | 'Food' | 'Shopping' | 'Waste';
  description: string;
  carbonCostKg: number;
  carbonSavedKg: number;
  date: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  carbonSavedKg: number;
  xpReward: number;
  coinsReward: number;
  completed: boolean;
  type: 'daily' | 'weekly' | 'community';
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  costCoins: number;
  type: 'tree' | 'donation' | 'coupon';
  redeemed: boolean;
  image?: string;
  code?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  carbonSavedKg: number;
  challengesCompleted: number;
  sustainabilityScore: number;
  isCurrentUser?: boolean;
}

export interface JournalEntry {
  date: string;
  summary: string;
  comparison: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface DatabaseSchema {
  user: User;
  activities: Activity[];
  challenges: Challenge[];
  marketplaceItems: MarketplaceItem[];
  leaderboard: LeaderboardEntry[];
  journal: JournalEntry[];
  chatHistory: ChatMessage[];
}

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const defaultData: DatabaseSchema = {
  user: {
    id: 'user-123',
    name: 'Alex Eco-Warrior',
    level: 3,
    xp: 320,
    xpNeeded: 1000,
    coins: 350,
    greenPoints: 240,
    streakDays: 5,
    lastActiveDate: new Date().toISOString().split('T')[0],
    avatarState: 'healthy',
    avatarScore: 72
  },
  activities: [
    {
      id: 'act-1',
      userId: 'user-123',
      category: 'Transportation',
      description: 'Commuted 10km by electric bicycle',
      carbonCostKg: 0.1,
      carbonSavedKg: 1.9,
      date: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'act-2',
      userId: 'user-123',
      category: 'Food',
      description: 'Ate a fully plant-based lunch',
      carbonCostKg: 0.5,
      carbonSavedKg: 2.1,
      date: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: 'act-3',
      userId: 'user-123',
      category: 'Electricity',
      description: 'Turned off AC for 2 hours during peak time',
      carbonCostKg: 0.2,
      carbonSavedKg: 0.8,
      date: new Date(Date.now() - 3600000 * 26).toISOString()
    }
  ],
  challenges: [
    {
      id: 'ch-1',
      title: 'Pedal Power',
      description: 'Cycle or walk 5 km instead of driving',
      category: 'Transportation',
      carbonSavedKg: 1.2,
      xpReward: 100,
      coinsReward: 50,
      completed: false,
      type: 'daily'
    },
    {
      id: 'ch-2',
      title: 'Green Chef',
      description: 'Prepare two completely plant-based meals today',
      category: 'Food',
      carbonSavedKg: 3.5,
      xpReward: 200,
      coinsReward: 100,
      completed: false,
      type: 'daily'
    },
    {
      id: 'ch-3',
      title: 'Eco Commute Master',
      description: 'Use public transport for all commutes this week',
      category: 'Transportation',
      carbonSavedKg: 12.0,
      xpReward: 500,
      coinsReward: 250,
      completed: false,
      type: 'weekly'
    },
    {
      id: 'ch-4',
      title: 'Neighborhood Clean Sweep',
      description: 'Community-wide recycling challenge',
      category: 'Waste',
      carbonSavedKg: 5.0,
      xpReward: 300,
      coinsReward: 150,
      completed: false,
      type: 'community'
    }
  ],
  marketplaceItems: [
    {
      id: 'm-1',
      title: 'Plant a Native Tree',
      description: 'We will plant a native tree in your name with OneTreePlanted.',
      costCoins: 200,
      type: 'tree',
      redeemed: false
    },
    {
      id: 'm-2',
      title: 'Donate $10 to Clean Ocean Clean-up',
      description: 'Fund cleanup missions to remove plastic from oceans.',
      costCoins: 300,
      type: 'donation',
      redeemed: false
    },
    {
      id: 'm-3',
      title: '25% Off EarthHero Eco Products',
      description: 'Get a coupon code valid across the EarthHero catalog.',
      costCoins: 100,
      type: 'coupon',
      redeemed: false,
      code: 'CQ25HERO'
    }
  ],
  leaderboard: [
    { rank: 1, name: 'Sarah Greenlegend', carbonSavedKg: 142.5, challengesCompleted: 24, sustainabilityScore: 95 },
    { rank: 2, name: 'Marcus Cyclepath', carbonSavedKg: 118.2, challengesCompleted: 18, sustainabilityScore: 88 },
    { rank: 3, name: 'Alex Eco-Warrior', carbonSavedKg: 94.8, challengesCompleted: 14, sustainabilityScore: 72, isCurrentUser: true },
    { rank: 4, name: 'Emma Solar', carbonSavedKg: 76.4, challengesCompleted: 11, sustainabilityScore: 68 },
    { rank: 5, name: 'Liam Zero-Waste', carbonSavedKg: 42.1, challengesCompleted: 7, sustainabilityScore: 54 }
  ],
  journal: [
    {
      date: new Date().toISOString().split('T')[0],
      summary: 'You saved 4.8 kg CO₂ today by cycling and eating a plant-based meal.',
      comparison: 'You performed 15% better than yesterday.'
    }
  ],
  chatHistory: [
    {
      sender: 'ai',
      text: 'Hello! I am your CarbonQuest AI Coach. Log your daily actions or ask me for personalized eco-tips. Let\'s conquer carbon reduction together!',
      timestamp: new Date().toISOString()
    }
  ]
};

export class DbService {
  private static data: DatabaseSchema | null = null;

  private static init() {
    if (this.data) return;

    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Failed to parse database file, falling back to default', err);
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.save();
      }
    } else {
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.save();
    }
  }

  private static save() {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  public static getUser(): User {
    this.init();
    return this.data!.user;
  }

  public static updateUser(updates: Partial<User>): User {
    this.init();
    const user = this.data!.user;
    
    // Level up algorithm
    let newXp = (updates.xp !== undefined) ? user.xp + updates.xp : user.xp;
    let newLevel = user.level;
    let xpNeeded = user.xpNeeded;

    if (updates.xp !== undefined) {
      while (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        xpNeeded = Math.round(xpNeeded * 1.25); // increase xp required next level
      }
    }

    this.data!.user = {
      ...user,
      ...updates,
      xp: newXp,
      level: newLevel,
      xpNeeded,
      coins: (updates.coins !== undefined) ? user.coins + updates.coins : user.coins,
      greenPoints: (updates.greenPoints !== undefined) ? user.greenPoints + updates.greenPoints : user.greenPoints,
    };

    // Calculate avatar state dynamically based on user score
    let score = this.data!.user.avatarScore;
    if (updates.avatarScore !== undefined) {
      score = Math.max(0, Math.min(100, updates.avatarScore));
    }
    
    let state: 'polluted' | 'average' | 'healthy' | 'pristine' = 'healthy';
    if (score < 30) state = 'polluted';
    else if (score < 60) state = 'average';
    else if (score < 85) state = 'healthy';
    else state = 'pristine';

    this.data!.user.avatarScore = score;
    this.data!.user.avatarState = state;

    // Update leaderboard value
    const userIndex = this.data!.leaderboard.findIndex(e => e.isCurrentUser);
    if (userIndex !== -1) {
      this.data!.leaderboard[userIndex].sustainabilityScore = score;
      if (updates.name !== undefined) {
        this.data!.leaderboard[userIndex].name = updates.name;
      }
      // also increase saved carbon count on leaderboard
      if (updates.greenPoints !== undefined) {
        this.data!.leaderboard[userIndex].carbonSavedKg += Number((updates.greenPoints * 0.2).toFixed(1));
      }
    }

    this.save();
    return this.data!.user;
  }

  public static getActivities(): Activity[] {
    this.init();
    return this.data!.activities;
  }

  public static addActivity(activity: Omit<Activity, 'id' | 'userId' | 'date'>): Activity {
    this.init();
    const newAct: Activity = {
      ...activity,
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      userId: this.data!.user.id,
      date: new Date().toISOString()
    };
    this.data!.activities.unshift(newAct);

    // Calculate impact on avatar score and grant points
    const saved = newAct.carbonSavedKg;
    const coinsReward = Math.max(5, Math.round(saved * 10));
    const xpReward = Math.max(10, Math.round(saved * 15));
    const scoreIncrease = Math.max(1, Math.round(saved * 2));

    this.updateUser({
      xp: xpReward,
      coins: coinsReward,
      greenPoints: Math.round(saved * 5),
      avatarScore: Math.min(100, this.data!.user.avatarScore + scoreIncrease)
    });

    this.save();
    return newAct;
  }

  public static getChallenges(): Challenge[] {
    this.init();
    return this.data!.challenges;
  }

  public static addChallenge(challenge: Omit<Challenge, 'id' | 'completed'>): Challenge {
    this.init();
    const newCh: Challenge = {
      ...challenge,
      id: 'ch-' + Math.random().toString(36).substring(2, 9),
      completed: false
    };
    this.data!.challenges.push(newCh);
    this.save();
    return newCh;
  }

  public static completeChallenge(id: string): Challenge | null {
    this.init();
    const challenge = this.data!.challenges.find(c => c.id === id);
    if (challenge && !challenge.completed) {
      challenge.completed = true;

      // Update user stats
      const scoreIncrease = Math.max(2, Math.round(challenge.carbonSavedKg * 1.5));
      this.updateUser({
        xp: challenge.xpReward,
        coins: challenge.coinsReward,
        greenPoints: Math.round(challenge.carbonSavedKg * 10),
        avatarScore: Math.min(100, this.data!.user.avatarScore + scoreIncrease)
      });

      // Update leaderboard count
      const userIndex = this.data!.leaderboard.findIndex(e => e.isCurrentUser);
      if (userIndex !== -1) {
        this.data!.leaderboard[userIndex].challengesCompleted += 1;
        this.data!.leaderboard[userIndex].carbonSavedKg += challenge.carbonSavedKg;
      }

      this.save();
      return challenge;
    }
    return null;
  }

  public static getMarketplace(): MarketplaceItem[] {
    this.init();
    return this.data!.marketplaceItems;
  }

  public static redeemMarketplaceItem(id: string): MarketplaceItem | null {
    this.init();
    const item = this.data!.marketplaceItems.find(m => m.id === id);
    const user = this.data!.user;
    if (item && !item.redeemed && user.coins >= item.costCoins) {
      item.redeemed = true;
      
      // Deduct coins and add greenPoints if tree or donation
      const greenReward = item.type === 'tree' ? 100 : item.type === 'donation' ? 150 : 20;
      this.updateUser({
        coins: -item.costCoins,
        greenPoints: greenReward
      });

      this.save();
      return item;
    }
    return null;
  }

  public static getLeaderboard(): LeaderboardEntry[] {
    this.init();
    // Sort leaderboard dynamically based on carbon saved + score
    return this.data!.leaderboard.sort((a, b) => b.carbonSavedKg - a.carbonSavedKg);
  }

  public static getJournal(): JournalEntry[] {
    this.init();
    return this.data!.journal;
  }

  public static addJournalEntry(summary: string, comparison: string): JournalEntry {
    this.init();
    const entry: JournalEntry = {
      date: new Date().toISOString().split('T')[0],
      summary,
      comparison
    };
    this.data!.journal.unshift(entry);
    this.save();
    return entry;
  }

  public static getChatHistory(): ChatMessage[] {
    this.init();
    return this.data!.chatHistory;
  }

  public static addChatMessage(sender: 'user' | 'ai', text: string): ChatMessage {
    this.init();
    const msg: ChatMessage = {
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    this.data!.chatHistory.push(msg);
    // Keep chat history capped to prevent unbounded JSON size
    if (this.data!.chatHistory.length > 50) {
      this.data!.chatHistory.shift();
    }
    this.save();
    return msg;
  }

  public static resetDb() {
    this.data = JSON.parse(JSON.stringify(defaultData));
    this.data!.user.lastActiveDate = new Date().toISOString().split('T')[0];
    this.save();
  }
}
