'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Activity, 
  Loader2, 
  Flame, 
  Coins, 
  Trophy, 
  ShoppingBag, 
  User as UserIcon, 
  Send, 
  Compass, 
  RefreshCw, 
  Sparkles,
  TreePine,
  CheckCircle2,
  TrendingDown,
  Navigation,
  BookOpen
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'routes' | 'marketplace' | 'leaderboard'>('dashboard');

  // API State
  const [user, setUser] = useState<any>({
    name: 'Alex Eco-Warrior',
    level: 3,
    xp: 320,
    xpNeeded: 1000,
    coins: 350,
    greenPoints: 240,
    streakDays: 5,
    avatarState: 'healthy',
    avatarScore: 72
  });

  const [activities, setActivities] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [journal, setJournal] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>({
    predictedEmissionsKg: 180.5,
    trend: 'improving',
    trajectoryScore: 78,
    explanation: 'Emissions are decreasing. Keep logging to improve your score!'
  });

  // Action states
  const [logText, setLogText] = useState('');
  const [logging, setLogging] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [routeResult, setRouteResult] = useState<any>(null);

  const fetchSuggestions = async (input: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!input || input.trim().length < 3) {
      setter([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/places/autocomplete?q=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (data.data) {
        setter(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<string | null>(null);

  // Name Modal State
  const [showNameModal, setShowNameModal] = useState(false);
  const [enteredName, setEnteredName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

  // Load Initial Data
  const fetchData = async () => {
    try {
      // Fetch user profile
      const profRes = await fetch(`${API_URL}/profile`);
      const profData = await profRes.json();
      if (profData.data) {
        setUser(profData.data);
        if (profData.data.name === 'Alex Eco-Warrior' && typeof window !== 'undefined' && !localStorage.getItem('carbonquest_name_entered')) {
          setShowNameModal(true);
        }
      }

      // Fetch activities
      const actRes = await fetch(`${API_URL}/activities`);
      const actData = await actRes.json();
      if (actData.data) setActivities(actData.data);

      // Fetch challenges
      const chalRes = await fetch(`${API_URL}/challenges`);
      const chalData = await chalRes.json();
      if (chalData.data) setChallenges(chalData.data);

      // Fetch marketplace
      const markRes = await fetch(`${API_URL}/marketplace`);
      const markData = await markRes.json();
      if (markData.data) setMarketplaceItems(markData.data);

      // Fetch leaderboard
      const leadRes = await fetch(`${API_URL}/leaderboard`);
      const leadData = await leadRes.json();
      if (leadData.data) setLeaderboard(leadData.data);

      // Fetch journal
      const jourRes = await fetch(`${API_URL}/coach/journal`);
      const jourData = await jourRes.json();
      if (jourData.data) setJournal(jourData.data);

      // Fetch chat history
      const chatRes = await fetch(`${API_URL}/coach/history`);
      const chatData = await chatRes.json();
      if (chatData.data) setChatHistory(chatData.data);

      // Fetch forecast
      const foreRes = await fetch(`${API_URL}/coach/forecast`);
      const foreData = await foreRes.json();
      if (foreData.data) setForecast(foreData.data);

    } catch (error) {
      console.error('Failed to load backend data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Reset Profile Handler
  const handleResetProfile = async () => {
    if (confirm('Are you sure you want to reset your sustainability profile? This deletes your activities.')) {
      try {
        const res = await fetch(`${API_URL}/profile/reset`, { method: 'POST' });
        const data = await res.json();
        if (data.data) {
          setUser(data.data);
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Save Name Handler
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredName.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: enteredName })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUser(data.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('carbonquest_name_entered', 'true');
        }
        setShowNameModal(false);
        fetchData(); // Refresh to update leaderboard and other components
      } else {
        alert(data.error || 'Failed to save name.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user name.');
    }
    setSavingName(false);
  };

  // Log Activity Handler
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim()) return;
    setLogging(true);
    try {
      const res = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: logText })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLogText('');
        fetchData();
      } else {
        alert(data.error || 'Failed to parse activity.');
      }
    } catch (err) {
      console.error(err);
      alert('Error logging activity.');
    }
    setLogging(false);
  };

  // Quick Log Suggestions
  const quickLog = (text: string) => {
    setLogText(text);
  };

  // Complete Challenge Handler
  const handleCompleteChallenge = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Force Generate AI Quests
  const handleGenerateAIQuests = async () => {
    setGeneratingChallenges(true);
    try {
      const res = await fetch(`${API_URL}/challenges/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: 'overcast and breezy',
          lifestyle: 'commutes by car, works in office'
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
    setGeneratingChallenges(false);
  };

  // Chat with Coach Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setSendingChat(true);

    // Optimistically update frontend chat UI
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch(`${API_URL}/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Refresh full chat logs to verify state matches DB
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I lost connection to the coaching servers. Try again shortly!', timestamp: new Date().toISOString() }]);
    }
    setSendingChat(false);
  };

  // Send Preset Question to Coach
  const sendPreset = (question: string) => {
    setChatInput(question);
  };

  // Optimize Route Handler
  const handleOptimizeRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeOrigin.trim() || !routeDest.trim()) return;
    setOptimizingRoute(true);
    try {
      const res = await fetch(`${API_URL}/routes/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: routeOrigin, destination: routeDest })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setRouteResult(data.data);
      } else {
        alert(data.error || 'Failed to optimize routes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error calculating route carbon savings.');
    }
    setOptimizingRoute(false);
  };

  // Redeem Marketplace Item
  const handleRedeem = async (id: string, title: string) => {
    try {
      const res = await fetch(`${API_URL}/marketplace/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setRedemptionSuccess(`Success! Redeemed reward: "${title}".`);
        fetchData();
        setTimeout(() => setRedemptionSuccess(null), 5000);
      } else {
        alert(data.error || 'Insufficient coins or redeem limit hit.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Carbon Twin avatar helpers
  const getAvatarFace = (state: string) => {
    switch (state) {
      case 'pristine': return '✨🌲🌞💚🌳✨';
      case 'healthy': return '🌳🌞🐦';
      case 'average': return '🌾☁️🚲';
      case 'polluted': return '🏭🌫️🥀🚧';
      default: return '🌳';
    }
  };

  const getAvatarColors = (state: string) => {
    switch (state) {
      case 'pristine': return 'from-emerald-950 to-green-900 border-emerald-400 shadow-emerald-500/25';
      case 'healthy': return 'from-green-900 to-emerald-800 border-green-500 shadow-green-500/10';
      case 'average': return 'from-zinc-900 to-yellow-950 border-yellow-600 shadow-yellow-600/10';
      case 'polluted': return 'from-stone-950 to-red-950 border-red-700 shadow-red-700/20';
      default: return 'from-zinc-900 to-zinc-850 border-zinc-700';
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-extrabold shadow-lg shadow-emerald-500/20">
            <Leaf size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              CarbonQuest <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">AI COACH</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase">Active Sustainability Companion</p>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-4 py-2 text-sm">
          <div className="flex items-center gap-1 text-orange-400 font-bold" title="Sustainability Streak">
            <Flame size={16} className="fill-orange-400/20" />
            <span>{user.streakDays}d</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-yellow-400 font-bold" title="Green Coins">
            <Coins size={15} className="fill-yellow-400/15" />
            <span>{user.coins}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold" title="Green Points (Impact Score)">
            <Trophy size={15} />
            <span>{user.greenPoints} GP</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
              LVL {user.level}
            </span>
            <div className="w-14 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" 
                style={{ width: `${(user.xp / user.xpNeeded) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: User state, Carbon Twin, Forecast, Journal (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* Carbon Twin Digital Avatar */}
          <section className={`p-5 rounded-3xl border bg-gradient-to-b shadow-xl ${getAvatarColors(user.avatarState)} transition-all duration-500 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
            {/* Glossy background circle */}
            <div className="absolute w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl -top-10 -right-10 pointer-events-none" />
            
            <div className="w-full flex justify-between items-center mb-4">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-extrabold">Carbon Twin</span>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold border ${
                user.avatarState === 'pristine' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                user.avatarState === 'healthy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                user.avatarState === 'average' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {user.avatarState}
              </span>
            </div>

            {/* Virtual avatar graphic */}
            <div className="w-32 h-32 my-2 rounded-full border border-zinc-800 bg-black/40 flex flex-col items-center justify-center text-5xl relative animate-pulse shadow-inner">
              <span className="drop-shadow-lg">{getAvatarFace(user.avatarState)}</span>
            </div>

            <div className="w-full space-y-1 mt-4">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Ecosystem Health</span>
                <span className="font-bold text-white">{user.avatarScore}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/50 border border-zinc-800/80 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${
                    user.avatarState === 'pristine' || user.avatarState === 'healthy' ? 'from-emerald-500 to-green-400' :
                    user.avatarState === 'average' ? 'from-yellow-500 to-amber-400' :
                    'from-red-600 to-orange-500'
                  }`}
                  style={{ width: `${user.avatarScore}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 leading-relaxed">
                {user.avatarState === 'pristine' && "Your twin is a thriving pristine forest. Breathtakingly clean!"}
                {user.avatarState === 'healthy' && "Your twin is a healthy ecosystem with active wildlife. Keep growing!"}
                {user.avatarState === 'average' && "Your twin has minor air pollution. Consider cycling to clear the smog."}
                {user.avatarState === 'polluted' && "Warning: High emissions are clouding your twin. Log eco-actions to heal."}
              </p>
            </div>
          </section>

          {/* AI Carbon Forecast Trajectory */}
          <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <TrendingDown size={15} className="text-emerald-400" />
              AI Footprint Trajectory
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase block">Projected CO₂</span>
                <span className="text-lg font-black text-white">{forecast.predictedEmissionsKg} kg</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase block">Emissions Trend</span>
                <span className={`text-sm font-extrabold capitalize ${
                  forecast.trend === 'improving' ? 'text-emerald-400' : 'text-zinc-400'
                }`}>
                  {forecast.trend}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3">
              {forecast.explanation}
            </p>
          </section>

          {/* AI Sustainability Journal summaries */}
          <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl flex-1 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-emerald-400" />
              Sustainability Journal
            </h2>
            
            <div className="space-y-3 overflow-y-auto max-h-[220px] flex-1 pr-1 custom-scrollbar">
              {journal.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-6">Your daily summaries will show here once you start logging.</div>
              ) : (
                journal.map((j, idx) => (
                  <div key={idx} className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Daily Journal</span>
                      <span>{j.date}</span>
                    </div>
                    <p className="text-xs text-zinc-200">{j.summary}</p>
                    <div className="text-[11px] text-emerald-400 italic bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                      Coach: {j.comparison}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Profile Reset Button */}
          <button 
            onClick={handleResetProfile}
            aria-label="Reset User Profile"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 self-center pb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
          >
            <RefreshCw size={11} aria-hidden="true" /> Reset Profile Data
          </button>
        </div>

        {/* MIDDLE COLUMN: Carbon Journey logs & Route Optimizer & Marketplace (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex bg-zinc-950 border border-zinc-900 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Log Journey
            </button>
            <button 
              onClick={() => setActiveTab('routes')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'routes' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Route Optimizer
            </button>
            <button 
              onClick={() => setActiveTab('marketplace')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'marketplace' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Marketplace
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')} 
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              Leaderboard
            </button>
          </div>

          {/* TAB 1: Daily Carbon Journey Log */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Form Input */}
              <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400" />
                    Log Your Daily Action
                  </h2>
                  <span className="text-[10px] text-zinc-500">Gemini NLP Engine</span>
                </div>

                <form onSubmit={handleLogActivity} className="space-y-3">
                  <div className="relative">
                    <textarea 
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                      placeholder="e.g. 'I commuted 15 km to office by electric scooter' or 'Had a completely vegan dinner instead of meat'"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm h-28 focus:outline-none focus:border-emerald-500 text-zinc-100 placeholder-zinc-500 resize-none transition-colors"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={logging || !logText.trim()}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {logging ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {logging ? 'Analyzing action...' : 'Log & Calculate Carbon'}
                  </button>
                </form>

                {/* Quick log chips */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Quick Prompts</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Cycled 5km to local grocery store',
                      'Turned off all lights and AC for 2 hours',
                      'Had vegetarian lunch instead of burger',
                      'Recycled 5 plastic water bottles'
                    ].map((chip, idx) => (
                      <button 
                        key={idx}
                        onClick={() => quickLog(chip)}
                        className="text-xs bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 px-3 py-1.5 rounded-full text-zinc-300 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Logged Activities List */}
              <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4" aria-live="polite">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Activity Log History</h2>
                <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                  {activities.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-8">No activities logged yet. Type something above to start.</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            act.category === 'Transportation' ? 'bg-blue-500/10 text-blue-400' :
                            act.category === 'Food' ? 'bg-orange-500/10 text-orange-400' :
                            act.category === 'Electricity' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-purple-500/10 text-purple-400'
                          }`}>
                            {act.category}
                          </span>
                          <p className="text-xs font-semibold text-white">{act.description}</p>
                          <span className="text-[10px] text-zinc-500 block">
                            {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          {act.carbonSavedKg > 0 && (
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                              -{act.carbonSavedKg.toFixed(1)} kg CO₂
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500">Cost: {act.carbonCostKg.toFixed(1)}kg</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>
          )}

          {/* TAB 2: AI Route Optimizer */}
          {activeTab === 'routes' && (
            <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-5 shadow-lg">
              <div className="space-y-1">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Navigation size={18} className="text-emerald-400 animate-pulse" />
                  AI Carbon-Aware Route Optimizer
                </h2>
                <p className="text-xs text-zinc-400">Calculates lowest carbon routes using Google Maps API.</p>
              </div>

              <form onSubmit={handleOptimizeRoute} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative w-full">
                    <input 
                      type="text"
                      required
                      value={routeOrigin}
                      onChange={(e) => {
                        setRouteOrigin(e.target.value);
                        fetchSuggestions(e.target.value, setOriginSuggestions);
                      }}
                      placeholder="Origin (e.g. Downtown Office)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    {originSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto custom-scrollbar">
                        {originSuggestions.map((s, i) => (
                          <li 
                            key={i}
                            className="px-4 py-2.5 text-xs text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer border-b border-zinc-800 last:border-0"
                            onClick={() => {
                              setRouteOrigin(s.description);
                              setOriginSuggestions([]);
                            }}
                          >
                            {s.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="relative w-full">
                    <input 
                      type="text"
                      required
                      value={routeDest}
                      onChange={(e) => {
                        setRouteDest(e.target.value);
                        fetchSuggestions(e.target.value, setDestSuggestions);
                      }}
                      placeholder="Destination (e.g. Green Park)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    {destSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto custom-scrollbar">
                        {destSuggestions.map((s, i) => (
                          <li 
                            key={i}
                            className="px-4 py-2.5 text-xs text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer border-b border-zinc-800 last:border-0"
                            onClick={() => {
                              setRouteDest(s.description);
                              setDestSuggestions([]);
                            }}
                          >
                            {s.description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={optimizingRoute}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50"
                >
                  {optimizingRoute ? <Loader2 className="animate-spin" size={15} /> : <Compass size={15} />}
                  {optimizingRoute ? 'Optimizing Routes...' : 'Calculate Eco-Alternatives'}
                </button>
              </form>

              {routeResult && (
                <div className="space-y-4 border-t border-zinc-900 pt-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">AI Recommendation</span>
                    <p className="text-xs text-emerald-300 leading-relaxed">{routeResult.recommendation}</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'driving', label: 'Driving (Gasoline Car)', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
                      { key: 'transit', label: 'Public Transport', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', savings: true },
                      { key: 'bicycling', label: 'Bicycle Route', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', savings: true }
                    ].map(mode => {
                      const data = routeResult.routes[mode.key];
                      if (!data) return null;
                      return (
                        <div key={mode.key} className={`border p-3.5 rounded-2xl flex items-center justify-between ${mode.color}`}>
                          <div className="space-y-1">
                            <span className="text-xs font-bold block">{mode.label}</span>
                            <span className="text-[10px] text-zinc-400">{data.distance} • {data.duration}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs font-black">{data.carbon_kg} kg CO₂</span>
                            {mode.savings && Number(data.savings_kg) > 0 && (
                              <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Save -{data.savings_kg} kg
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: Eco Marketplace */}
          {activeTab === 'marketplace' && (
            <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-lg">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-400" />
                  Eco Marketplace
                </h2>
                <p className="text-xs text-zinc-400">Redeem CarbonQuest coins for real-world environmental actions.</p>
              </div>

              {redemptionSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl">
                  {redemptionSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {marketplaceItems.map(item => (
                  <div key={item.id} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.type === 'tree' ? 'bg-emerald-500/10 text-emerald-400' :
                        item.type === 'donation' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {item.type}
                      </span>
                      <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400">{item.description}</p>
                      {item.redeemed && item.code && (
                        <div className="mt-2 text-xs font-mono bg-zinc-900 text-yellow-400 border border-zinc-800 p-1.5 rounded inline-block">
                          Coupon Code: {item.code}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                        <Coins size={12} /> {item.costCoins}
                      </span>
                      <button 
                        disabled={item.redeemed || user.coins < item.costCoins}
                        onClick={() => handleRedeem(item.id, item.title)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${
                          item.redeemed 
                            ? 'bg-zinc-900 text-zinc-600 border-zinc-850' 
                            : user.coins >= item.costCoins 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-transparent' 
                              : 'bg-transparent text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {item.redeemed ? 'Redeemed' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: Community Leaderboard */}
          {activeTab === 'leaderboard' && (
            <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-lg">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Trophy size={18} className="text-emerald-400" />
                  Social Impact Leaderboard
                </h2>
                <p className="text-xs text-zinc-400">Compete with friends and local community carbon reduction.</p>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.rank} 
                    className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                      entry.isCurrentUser 
                        ? 'bg-emerald-500/5 border-emerald-500/30' 
                        : 'bg-zinc-900/30 border-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black w-6 text-center ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-zinc-400' :
                        entry.rank === 3 ? 'text-amber-600' :
                        'text-zinc-500'
                      }`}>
                        #{entry.rank}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {entry.name}
                          {entry.isCurrentUser && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-black uppercase">YOU</span>}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Quests Done: {entry.challengesCompleted}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-400 block">-{entry.carbonSavedKg.toFixed(1)} kg CO₂</span>
                      <span className="text-[10px] text-zinc-500">Score: {entry.sustainabilityScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN: AI Carbon Coach Chat & Active Quests (3 cols) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          
          {/* AI Carbon Coach Conversational Box */}
          <section className="bg-zinc-950 border border-zinc-900 rounded-3xl flex-1 flex flex-col shadow-lg overflow-hidden min-h-[400px]">
            {/* Header */}
            <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black text-white">AI COACH CHAT</span>
              </div>
              <span className="text-[9px] bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-400">Gemini 1.5 Flash</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs max-h-[350px] custom-scrollbar">
              {chatHistory.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user' 
                      ? 'bg-emerald-500 text-black font-semibold rounded-br-none' 
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Presets / Prompts shortcuts */}
            <div className="px-4 pb-2">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Simulate Scenarios</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What if I stop riding my bike?',
                  'AC saving tips',
                  'Simulate daily vegan savings'
                ].map((q, idx) => (
                  <button 
                    key={idx}
                    onClick={() => sendPreset(q)}
                    className="text-[9px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 px-2 py-1 rounded-full text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-900 flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask coach anything..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                aria-label="Send message to AI Coach"
                className="bg-emerald-500 text-black p-2 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                {sendingChat ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              </button>
            </form>
          </section>

          {/* Active Quests & Challenges */}
          <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl space-y-4 shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Quests</h2>
              <button 
                onClick={handleGenerateAIQuests}
                disabled={generatingChallenges}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50"
              >
                {generatingChallenges ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                Generate Quests
              </button>
            </div>

            <div className="space-y-3">
              {challenges.map(chal => (
                <div 
                  key={chal.id} 
                  className={`border p-3.5 rounded-2xl flex flex-col gap-2 transition-all ${
                    chal.completed 
                      ? 'bg-zinc-900/20 border-zinc-850 opacity-60' 
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-750'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase">{chal.type}</span>
                    <span className="text-[10px] text-emerald-400 font-extrabold">-{chal.carbonSavedKg} kg CO₂</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white leading-tight">{chal.title}</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{chal.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-yellow-400 font-bold flex items-center gap-0.5">🪙 {chal.coinsReward}</span>
                      <span className="text-zinc-400 font-medium">⚡ {chal.xpReward} XP</span>
                    </div>
                    {chal.completed ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleCompleteChallenge(chal.id)}
                        className="text-[9px] font-extrabold text-black bg-emerald-400 hover:bg-emerald-300 px-2 py-1 rounded transition-colors"
                      >
                        Claim Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles size={32} className="text-black" />
              </div>
              <h2 id="modal-title" className="text-2xl font-black text-white tracking-tight">Welcome to CarbonQuest AI</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">Your personal sustainability journey starts here. Please enter your name to customize your coach and join the leaderboard.</p>
            </div>
            
            <form onSubmit={handleSaveName} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="user-name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Your Name</label>
                <input 
                  id="user-name"
                  type="text"
                  required
                  maxLength={30}
                  value={enteredName}
                  onChange={(e) => setEnteredName(e.target.value)}
                  placeholder="e.g. Maya Green"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <button 
                type="submit"
                disabled={savingName || !enteredName.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {savingName ? <Loader2 className="animate-spin" size={18} /> : <UserIcon size={18} />}
                {savingName ? 'Saving...' : 'Begin Journey'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© 2026 CarbonQuest AI. Powered by Google Gemini 1.5 Flash and Google Cloud Services.</p>
      </footer>
    </main>
  );
}
