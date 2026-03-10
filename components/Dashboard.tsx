
import React, { useState, useEffect } from 'react';
import { Platform, Lead, ViewState, BrandContext, User } from '../types';
import { gemini } from '../services/geminiService';
import LeadCard from './LeadCard';
import LeadDetail from './LeadDetail';
import ContextView from './ContextView';
import { Search, Loader2, Zap, LayoutDashboard, Settings as SettingsIcon, Database, ShieldCheck, Cpu, Target, MessageSquare, Clock, Plus, LogOut, LogIn } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('LEADS');
  const [niche, setNiche] = useState('CRM software for startups');
  const [platform, setPlatform] = useState<Platform>(Platform.REDDIT);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [brandContext, setBrandContext] = useState<BrandContext>({
    websiteUrl: 'https://leadengine.ai',
    productName: 'LeadEngine',
    productDescription: 'An elite social media lead generation platform that identifies high-intent prospects.',
    audienceSegments: ['Founders', 'SDRs', 'Agencies']
  });

  // Auth Check
  const checkAuth = async (token?: string) => {
    console.log("Checking authentication status...");
    const authToken = token || localStorage.getItem('auth_token');
    const headers: any = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const res = await fetch('/api/me', { 
        credentials: 'include',
        headers
      });
      const data = await res.json();
      console.log("Auth status response:", data);
      setUser(data);
      if (data) {
        // Fetch user data from DB
        const [leadsRes, contextRes] = await Promise.all([
          fetch('/api/leads', { credentials: 'include', headers }),
          fetch('/api/context', { credentials: 'include', headers })
        ]);
        const leadsData = await leadsRes.json();
        const contextData = await contextRes.json();
        if (leadsData) setLeads(leadsData);
        if (contextData) setBrandContext(contextData);
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      setIsAuthChecking(false);
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from window:", event.data);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log("OAuth success message received, refreshing auth state...");
        if (event.data.token) {
          localStorage.setItem('auth_token', event.data.token);
        }
        checkAuth(event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = () => {
    console.log("Initiating Google Login...");
    setIsLoggingIn(true);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authWindow = window.open('/auth/google', 'google_login', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (!authWindow) {
      setIsLoggingIn(false);
      alert("Popup blocked! Please allow popups for this site.");
    }
  };

  const handleLogout = async () => {
    const authToken = localStorage.getItem('auth_token');
    const headers: any = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    await fetch('/api/logout', { credentials: 'include', headers });
    localStorage.removeItem('auth_token');
    setUser(null);
    setLeads([]);
  };

  const handleDiscover = async () => {
    setIsLoading(true);
    const authToken = localStorage.getItem('auth_token');
    const authHeaders: any = {};
    if (authToken) {
      authHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const results = await gemini.discoverLeads(niche, platform);
      setLeads(results);
      if (results.length > 0) {
        handleAnalyze(results[0]);
      }
      // Save leads to DB
      for (const lead of results) {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(lead),
          credentials: 'include'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (lead: Lead) => {
    if (lead.analysis) {
      setSelectedLead(lead);
      return;
    }

    setIsAnalyzing(true);
    setSelectedLead(lead);
    const authToken = localStorage.getItem('auth_token');
    const authHeaders: any = {};
    if (authToken) {
      authHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const analysis = await gemini.analyzeLead(lead, brandContext.productDescription);
      const updatedLead = { ...lead, analysis };
      setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      setSelectedLead(updatedLead);
      
      // Save updated lead to DB
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(updatedLead),
        credentials: 'include'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateContext = async (newContext: BrandContext) => {
    setBrandContext(newContext);
    const authToken = localStorage.getItem('auth_token');
    const authHeaders: any = {};
    if (authToken) {
      authHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    await fetch('/api/context', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(newContext),
      credentials: 'include'
    });
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#030712] flex flex-col items-center justify-center p-4">
        <div className="bg-indigo-600 p-4 rounded-2xl shadow-2xl shadow-indigo-600/20 mb-8 animate-bounce">
          <Zap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">LeadEngine<span className="text-indigo-500">.ai</span></h1>
        <p className="text-gray-400 text-center max-w-md mb-8 leading-relaxed">
          The elite social intelligence platform for high-intent lead generation. 
          Connect your account to access neural processing and behavioral analysis.
        </p>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl flex items-center gap-3 hover:bg-gray-100 transition-all shadow-xl shadow-white/10 disabled:opacity-50"
        >
          {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          {isLoggingIn ? "Connecting..." : "Continue with Google"}
        </button>
        <p className="mt-8 text-[10px] text-gray-600 uppercase font-bold tracking-widest">Secure Neural Link Required</p>
      </div>
    );
  }

  const renderDashboardView = () => {
    const highIntentLeads = leads.filter(l => l.analysis?.urgency === 'High').length;
    const platformStats = {
      [Platform.REDDIT]: leads.filter(l => l.platform === Platform.REDDIT).length,
      [Platform.X]: leads.filter(l => l.platform === Platform.X).length,
      [Platform.LINKEDIN]: leads.filter(l => l.platform === Platform.LINKEDIN).length,
    };

    return (
      <div className="h-full overflow-y-auto p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-gray-400">Real-time overview of your social lead generation engine.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0b0f1a] border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-indigo-600/20 p-3 rounded-xl">
                <Database className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-gray-400 font-medium">Total Leads</h3>
            </div>
            <p className="text-4xl font-bold text-white">{leads.length}</p>
            <p className="text-xs text-gray-500 mt-2">Discovered across all platforms</p>
          </div>

          <div className="bg-[#0b0f1a] border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-600/20 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-gray-400 font-medium">High Intent</h3>
            </div>
            <p className="text-4xl font-bold text-white">{highIntentLeads}</p>
            <p className="text-xs text-gray-500 mt-2">Ready for immediate outreach</p>
          </div>

          <div className="bg-[#0b0f1a] border border-gray-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-600/20 p-3 rounded-xl">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-gray-400 font-medium">Active Strategy</h3>
            </div>
            <p className="text-xl font-bold text-white truncate">{brandContext.productName}</p>
            <p className="text-xs text-gray-500 mt-2">Neural engine optimized</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0b0f1a] border border-gray-800 p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Platform Distribution</h3>
            <div className="space-y-6">
              {Object.entries(platformStats).map(([p, count]) => (
                <div key={p} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{p}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${leads.length > 0 ? (count / leads.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b0f1a] border border-gray-800 p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center gap-4 p-3 hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer" onClick={() => { setCurrentView('LEADS'); setSelectedLead(lead); }}>
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{lead.author}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.content}</p>
                  </div>
                  <div className="text-[10px] text-gray-600 font-bold uppercase">{lead.platform}</div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategyView = () => (
    <div className="h-full overflow-y-auto p-8 space-y-8">
      <div className="max-w-4xl">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Outreach Strategy</h1>
          <p className="text-gray-400">Optimized patterns for <span className="text-indigo-400 font-bold">{brandContext.productName}</span>.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 mt-8">
          <div className="bg-[#0b0f1a] border border-gray-800 p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
              <div className="bg-indigo-600/20 p-3 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Core Value Proposition</h3>
                <p className="text-xs text-gray-500">The foundation of all generated responses</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed italic">"{brandContext.productDescription}"</p>
            <div className="flex flex-wrap gap-2">
              {brandContext.audienceSegments.map(segment => (
                <span key={segment} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-500/20">
                  {segment}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b0f1a] border border-gray-800 p-6 rounded-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Reddit Strategy
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Be helpful first, mention product second.</li>
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Use subreddit-specific terminology.</li>
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Avoid direct links in top-level comments.</li>
              </ul>
            </div>

            <div className="bg-[#0b0f1a] border border-gray-800 p-6 rounded-2xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> X (Twitter) Strategy
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Be concise and punchy.</li>
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Use relevant hashtags sparingly.</li>
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Focus on immediate value/insight.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeadsView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-8 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Hot Leads & Engagement</h1>
          <p className="text-gray-400 text-sm">Identify and engage with potential customers in your niche. Convert leads with helpful comments.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{user.displayName}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">{user.email}</p>
          </div>
          <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-800" alt="avatar" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Leads List */}
        <div className="w-[450px] border-r border-gray-800 flex flex-col bg-[#030712]">
          <div className="p-6 space-y-4">
            <button 
              onClick={handleDiscover}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Discover New Leads
            </button>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Next discovery in 23h 52m
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
            {leads.map((lead) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                isSelected={selectedLead?.id === lead.id}
                onClick={() => handleAnalyze(lead)}
              />
            ))}
            {leads.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No leads found. Try discovering new leads.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lead Detail */}
        <div className="flex-1 bg-[#030712] p-8 overflow-y-auto">
          {selectedLead ? (
            <LeadDetail lead={selectedLead} isAnalyzing={isAnalyzing} brandContext={brandContext} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-white">Select a Lead</h3>
              <p className="text-gray-500 max-w-xs">Choose a lead from the list to start generating engagement strategies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentView === 'CONTEXT') {
      return (
        <ContextView 
          context={brandContext} 
          onUpdateContext={updateContext} 
        />
      );
    }

    if (currentView === 'LEADS') {
      return renderLeadsView();
    }

    if (currentView === 'STRATEGY') {
      return renderStrategyView();
    }

    if (currentView === 'DASHBOARD') {
      return renderDashboardView();
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400">Welcome to LeadEngine.ai, {user.displayName}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#030712] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0b0f1a] flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-3 px-2 py-6 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-600/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">LeadEngine<span className="text-indigo-500">.ai</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setCurrentView('DASHBOARD')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'DASHBOARD' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('STRATEGY')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'STRATEGY' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" /> Strategy
          </button>
          <button 
            onClick={() => setCurrentView('LEADS')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'LEADS' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Leads
          </button>
          <button 
            onClick={() => setCurrentView('CONTEXT')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all ${
              currentView === 'CONTEXT' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" /> Context Settings
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-4 rounded-xl border border-indigo-500/30">
            <p className="text-xs font-semibold text-indigo-300 uppercase mb-2">Core Engine Active</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">Gemini 3 Pro processing patterns for <span className="text-indigo-200">{brandContext.productName}</span>.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
