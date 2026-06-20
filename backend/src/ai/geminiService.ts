import { GoogleGenAI } from '@google/genai';
import { LanguageServiceClient } from '@google-cloud/language';

let ai: GoogleGenAI | null = null;
let languageClient: LanguageServiceClient | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
};

const getLanguageClient = () => {
  if (!languageClient) {
    try {
      // Natural Language API usually authenticates via Application Default Credentials (ADC)
      // or GOOGLE_APPLICATION_CREDENTIALS environment variable.
      languageClient = new LanguageServiceClient();
    } catch (error) {
      console.warn("Could not initialize real Cloud Natural Language API. Using built-in sentiment engine instead.", error);
    }
  }
  return languageClient;
};

// 1. Core Coach Conversational Logic
export const chatWithCoach = async (userMessage: string, chatHistory: any[]) => {
  const systemPrompt = `
    You are CarbonQuest AI, an enterprise-grade, gamified AI Sustainability Coach.
    Your personality is highly encouraging, extremely knowledgeable, and slightly competitive (like a fitness coach mixed with Duolingo).
    You actively guide the user on how they can reduce their carbon footprint today.
    Keep your responses short, conversational, and format them with Markdown.
    If the user asks to simulate an action, explain the annual CO2 savings, financial savings, and wellness impact in a structured format.
  `;

  const client = getAI();
  if (!client) {
    return mockCoachResponse(userMessage);
  }

  try {
    // Format history for Gemini API
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...chatHistory.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as any,
      config: { temperature: 0.7 }
    });

    return response.text || "I am processing your carbon logs. Let's make today greener!";
  } catch (error) {
    console.error("Gemini Chat Error, invoking mock:", error);
    return mockCoachResponse(userMessage);
  }
};

// 2. Parse Free-Text Logs (e.g. "I rode 12km in a SUV" -> Category, carbonCost, carbonSaved)
export const parseActivityNlp = async (text: string) => {
  const prompt = `
    You are an eco-data extraction assistant. Analyze this action: "${text}"
    Extract:
    1. Category: One of ["Transportation", "Electricity", "Food", "Shopping", "Waste"]
    2. Carbon Cost: Estimated actual CO2 emitted in kg.
    3. Carbon Saved: Estimated CO2 saved in kg compared to the high-carbon alternative.
       (e.g., cycling instead of driving saves ~0.19kg per km. Eating plant-based instead of beef lunch saves ~2kg. Recycling saves ~0.5kg).
    4. Structured description: A clean summary of the action.

    Format strictly as a JSON object:
    {
      "category": "Transportation",
      "carbonCostKg": 0.2,
      "carbonSavedKg": 1.8,
      "description": "Rode bike for 10km instead of driving"
    }

    Do not include markdown or code blocks. Just the raw JSON.
  `;

  const client = getAI();
  if (!client) {
    return mockActivityNlp(text);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    });

    let cleaned = response.text || "";
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error("Gemini NLP parser error, using mock:", error);
    return mockActivityNlp(text);
  }
};

// 3. AI Challenge/Mission Generator (Context and weather aware)
export const generateAIPersonalizedQuests = async (userLifestyle: string, weather: string) => {
  const prompt = `
    Generate 2 personalized daily eco-quests for a user.
    Context:
    - User travel/lifestyle: ${userLifestyle}
    - Today's Weather: ${weather}

    Return strictly a JSON array of 2 objects, each containing:
    - "title": string (engaging, catchy title)
    - "description": string (specific task to do today)
    - "category": string (Transportation, Electricity, Food, Shopping, Waste)
    - "carbonSavedKg": number (CO2 saved, e.g. 1.2)
    - "xpReward": number (XP reward, e.g. 100)
    - "coinsReward": number (Coins reward, e.g. 50)
    - "type": "daily"

    Do not include markdown or code blocks. Just the raw JSON.
  `;

  const client = getAI();
  if (!client) {
    return mockChallenges(weather);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    let cleaned = response.text || "";
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error("Gemini Quest generator error, using mock:", error);
    return mockChallenges(weather);
  }
};

// 4. Forecast Engine with Gemini Explanations
export const getCarbonForecast = async (activities: any[]) => {
  const activitySummary = activities.map(a => `${a.category}: cost ${a.carbonCostKg}kg, saved ${a.carbonSavedKg}kg`).join(', ');

  const prompt = `
    Analyze the user's historical carbon activities: [${activitySummary}]
    Predict the user's carbon emissions trajectory for the next 30 days.
    Provide:
    1. "predictedEmissionsKg": Estimated monthly carbon footprint (number)
    2. "trend": "improving" | "stable" | "worsening"
    3. "trajectoryScore": Sustainability score projection from 0 to 100
    4. "explanation": A concise, expert, encouraging explanation of the trend and forecast.

    Format strictly as a JSON object:
    {
      "predictedEmissionsKg": 210.5,
      "trend": "improving",
      "trajectoryScore": 78,
      "explanation": "Your emissions are on a downward trend thanks to active commuting. Continue this trajectory to hit your green target next month!"
    }
    Do not include markdown or code blocks.
  `;

  const client = getAI();
  if (!client) {
    return mockForecast(activities);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.3 }
    });

    let cleaned = response.text || "";
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error("Gemini Forecast error, using mock:", error);
    return mockForecast(activities);
  }
};

// 5. Sentiment Analysis of Journal/Notes
export const analyzeSentiment = async (text: string) => {
  const client = getLanguageClient();
  if (client) {
    try {
      const [result] = await client.analyzeSentiment({
        document: {
          content: text,
          type: 'PLAIN_TEXT',
        },
      });
      const sentiment = result.documentSentiment;
      return {
        score: sentiment?.score ?? 0, // -1.0 to 1.0
        magnitude: sentiment?.magnitude ?? 0,
        sentimentLabel: (sentiment?.score ?? 0) > 0.25 ? 'positive' : (sentiment?.score ?? 0) < -0.25 ? 'negative' : 'neutral'
      };
    } catch (error) {
      console.warn("Cloud Natural Language API call failed. Using fallback sentiment engine.", error);
    }
  }

  // Fallback local sentiment analysis
  const positiveWords = ['happy', 'great', 'good', 'excited', 'proud', 'love', 'clean', 'save', 'saved', 'better', 'cycled', 'walked', 'plant-based'];
  const negativeWords = ['sad', 'bad', 'waste', 'wasted', 'pollute', 'sorry', 'failed', 'heavy', 'meat', 'drove', 'car', 'missed'];

  let score = 0;
  const words = text.toLowerCase().split(/\W+/);
  words.forEach(w => {
    if (positiveWords.includes(w)) score += 0.2;
    if (negativeWords.includes(w)) score -= 0.2;
  });

  score = Math.max(-1.0, Math.min(1.0, score));
  return {
    score,
    magnitude: Math.abs(score) * 2,
    sentimentLabel: score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'
  };
};


// --- HIGH-FIDELITY FALLBACK / MOCK IMPLEMENTATIONS ---

function mockCoachResponse(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('bike') || msg.includes('cycle')) {
    return `### Superb choice! 🚲
Cycling instead of driving saves approximately **0.19 kg CO₂** per kilometer. 
If you commute 15 km daily by bike:
* **Monthly Savings:** ~57 kg CO₂
* **Financial Savings:** ~$65 saved on fuel/parking
* **Health Impact:** Burn around ~450 calories/day!

Keep up the incredible work. What other commuting alternatives would you like to explore today?`;
  }

  if (msg.includes('meat') || msg.includes('vegetarian') || msg.includes('vegan') || msg.includes('steak')) {
    return `### The Power of Plant-Based Meals 🥗
Transitioning just one meal from beef to plant-based reduces emissions by over **2.1 kg CO₂**.
* **Annual Impact:** Over 750 kg CO₂ saved if done daily.
* **Water Savings:** ~1,500 liters of water saved per meal.
* **Pro Tip:** Try adding local lentils or chickpeas to boost your protein without the high carbon footprint of livestock.`;
  }

  if (msg.includes('ac') || msg.includes('electricity') || msg.includes('temperature')) {
    return `### Cool Savings on Air Conditioning ❄️
Reducing your air conditioner usage by just 1 hour today prevents around **0.8 kg CO₂** of power station emissions.
* **Streak tip:** Set your thermostat to 24°C (75°F) instead of lower. Every degree higher saves 6% on your electricity bill!
* **Challenge:** Can you open your windows for natural ventilation this evening?`;
  }

  if (msg.includes('what if') || msg.includes('simulate') || msg.includes('stop using')) {
    return `### Impact Simulation Report 📊
If you stop using your bike and switch to a standard gas car for a 15 km commute:
1. **Emissions Increase:** +1,050 kg CO₂ annually (that's equivalent to charging 130,000 smartphones!).
2. **Financial Cost:** Approx. +$980/year in gasoline and maintenance.
3. **Health Impact:** Loss of ~90,000 kcal of active exercise annually.
*Recommendation:* Consider a hybrid transit commute or an electric scooter if bike commuting is not viable today!`;
  }

  return `### Greetings from CarbonQuest AI! 🌿
I am analyzing your lifestyle profile. Here are three quick recommendations to boost your streak:
1. **Unplug Standby Devices:** Save 0.2 kg CO₂ by cutting phantom power.
2. **Shorter Shower Challenge:** A 5-minute shower saves 0.5 kg CO₂ and 30 liters of heated water.
3. **Walk local errands:** If you're going under 2km, walk to earn double green coins!

Tell me about your travel or food plans for today, and I'll optimize them for carbon savings.`;
}

function mockActivityNlp(text: string) {
  const msg = text.toLowerCase();
  let category: 'Transportation' | 'Electricity' | 'Food' | 'Shopping' | 'Waste' = 'Transportation';
  let cost = 0.5;
  let saved = 1.0;
  let description = text;

  if (msg.includes('bike') || msg.includes('bicycle') || msg.includes('cycled') || msg.includes('walked') || msg.includes('walk')) {
    category = 'Transportation';
    cost = 0.1;
    saved = 2.4;
    description = `Cycled/walked instead of driving`;
  } else if (msg.includes('steak') || msg.includes('beef') || msg.includes('meat')) {
    category = 'Food';
    cost = 3.2;
    saved = 0.0;
    description = `Had a high-impact beef meal`;
  } else if (msg.includes('salad') || msg.includes('vegan') || msg.includes('vegetarian') || msg.includes('plant-based')) {
    category = 'Food';
    cost = 0.4;
    saved = 1.8;
    description = `Chose an eco-friendly plant-based meal`;
  } else if (msg.includes('ac') || msg.includes('air conditioning') || msg.includes('lights') || msg.includes('turned off')) {
    category = 'Electricity';
    cost = 0.2;
    saved = 0.9;
    description = `Reduced home electricity usage`;
  } else if (msg.includes('recycle') || msg.includes('compost') || msg.includes('reused')) {
    category = 'Waste';
    cost = 0.05;
    saved = 0.7;
    description = `Recycled waste materials`;
  } else if (msg.includes('bought') || msg.includes('purchased') || msg.includes('bag')) {
    category = 'Shopping';
    cost = 0.6;
    saved = 0.4;
    description = `Purchased with a reusable shopping bag`;
  }

  return { category, carbonCostKg: cost, carbonSavedKg: saved, description };
}

function mockChallenges(weather: string): any[] {
  const isRain = weather.toLowerCase().includes('rain') || weather.toLowerCase().includes('storm');
  if (isRain) {
    return [
      {
        title: 'Carpool Rain Day',
        description: 'Coordinate with a colleague or use public transit instead of ride-hailing alone in the rain.',
        category: 'Transportation',
        carbonSavedKg: 1.5,
        xpReward: 120,
        coinsReward: 60,
        type: 'daily'
      },
      {
        title: 'Warm Brew',
        description: 'Brew your own coffee at home and use a reusable thermos instead of ordering single-use takeaway cups.',
        category: 'Waste',
        carbonSavedKg: 0.6,
        xpReward: 80,
        coinsReward: 40,
        type: 'daily'
      }
    ];
  }

  return [
    {
      title: 'Solar Walk',
      description: 'Take a 20-minute walk during lunch instead of driving to a food spot. Soak in the sun!',
      category: 'Transportation',
      carbonSavedKg: 1.0,
      xpReward: 100,
      coinsReward: 50,
      type: 'daily'
    },
    {
      title: 'Cool Ventilation',
      description: 'Open windows for evening cool air and keep the AC off for at least 3 consecutive hours.',
      category: 'Electricity',
      carbonSavedKg: 1.8,
      xpReward: 150,
      coinsReward: 75,
      type: 'daily'
    }
  ];
}

function mockForecast(activities: any[]) {
  const count = activities.length;
  const avgSaved = count > 0 ? activities.reduce((sum, a) => sum + a.carbonSavedKg, 0) / count : 1.5;
  const score = Math.round(50 + avgSaved * 10);
  const emissions = Math.max(100, Math.round(320 - avgSaved * 40));

  return {
    predictedEmissionsKg: emissions,
    trend: avgSaved > 1.2 ? 'improving' : avgSaved < 0.6 ? 'worsening' : 'stable',
    trajectoryScore: Math.min(100, score),
    explanation: `Based on your recent logs, you are saving an average of ${avgSaved.toFixed(1)}kg CO₂ per action. If you maintain this streak, your projected sustainability score will rise to ${Math.min(100, score)} and you will avoid over ${Math.round(avgSaved * 30)}kg CO₂ this month.`
  };
}
