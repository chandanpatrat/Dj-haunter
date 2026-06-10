'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation, MapPin, ArrowRight, Search, Zap, Speaker, Flame, Heart, X, Trash2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function HomePage() {
  const applicationNavigationRouter = useRouter();
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  const [liveTrendingDjs, setLiveTrendingDjs] = useState([]);
  const [liveNetworkDjs, setLiveNetworkDjs] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  // Favorites Panel State Managers
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);
  const [favoriteDjs, setFavoriteDjs] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Load favorites length and badge reactively
  const loadFavoritesCount = () => {
    if (typeof window !== 'undefined') {
      const favorites = JSON.parse(localStorage.getItem('favorite_djs') || '[]');
      setFavoritesCount(favorites.length);
    }
  };

  // Sync favorites details from database when open
  const fetchFavoriteDjs = async () => {
    if (typeof window === 'undefined') return;
    const favorites = JSON.parse(localStorage.getItem('favorite_djs') || '[]');
    if (favorites.length === 0) {
      setFavoriteDjs([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('dj_directory')
        .select('*')
        .in('id', favorites);
        
      if (error) throw error;
      setFavoriteDjs(data || []);
    } catch (error) {
      console.error("Error fetching favorited DJs:", error);
    }
  };

  useEffect(() => {
    loadFavoritesCount();
    window.addEventListener('storage', loadFavoritesCount);
    return () => window.removeEventListener('storage', loadFavoritesCount);
  }, []);

  useEffect(() => {
    if (showFavoritesDrawer) {
      fetchFavoriteDjs();
    }
  }, [showFavoritesDrawer]);

  const handleRemoveFavorite = (id, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof window === 'undefined') return;
    
    const favorites = JSON.parse(localStorage.getItem('favorite_djs') || '[]');
    const updated = favorites.filter(favId => favId !== id);
    localStorage.setItem('favorite_djs', JSON.stringify(updated));
    setFavoritesCount(updated.length);
    setFavoriteDjs(prev => prev.filter(dj => dj.id !== id));
    
    // Dispatch event to keep pages in sync
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    async function fetchHomepageData() {
      setIsFeedLoading(true);
      try {
        const { data: trendingData, error: trendingError } = await supabase
          .from('dj_directory')
          .select('*')
          .eq('is_trending', true)
          .limit(10);
          
        if (trendingError) throw trendingError;
        setLiveTrendingDjs(trendingData || []);

        const { data: allData, error: allError } = await supabase
          .from('dj_directory')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        if (allError) throw allError;
        setLiveNetworkDjs(allData || []);

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsFeedLoading(false);
      }
    }

    fetchHomepageData();
  }, []);

  const handleLocateDJs = () => {
    setIsLocatingUser(true);
    if (!navigator.geolocation) {
      alert('Location services are not supported by your browser.');
      setIsLocatingUser(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        applicationNavigationRouter.push(`/search?lat=${latitude}&lng=${longitude}`);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert('Please allow location access in your browser to find nearby DJs.');
        setIsLocatingUser(false);
      }
    );
  };

  const handleManualSearch = (event) => {
    event.preventDefault();
    if (userSearchQuery.trim()) {
      applicationNavigationRouter.push(`/search?q=${encodeURIComponent(userSearchQuery)}`);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 font-sans relative selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* NAVIGATION BAR - FIXED HEIGHT FOR VIEWPORT CALCULATION */}
      <nav className="relative z-50 flex flex-col md:flex-row md:items-center justify-between py-4 px-4 sm:px-6 lg:px-12 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl gap-4 md:gap-0 h-auto md:h-[76px]">
        
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 px-2 py-1 rounded-lg">DH</span>
            DJ HAUNTER
          </Link>

          {/* Mobile Portal / Favorites Layout */}
          <div className="flex items-center gap-2.5 md:hidden">
            <button 
              onClick={() => setShowFavoritesDrawer(true)}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition-all relative active:scale-95"
              title="Saved DJs"
            >
              <Heart className={`h-4 w-4 transition-transform duration-300 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500 scale-110 animate-pulse' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full border border-slate-950 shadow-md">
                  {favoritesCount}
                </span>
              )}
            </button>

            <Link href="/admin" className="group relative px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(6,182,212,0.3)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-90"></div>
              <div className="relative z-10 flex items-center gap-1.5 drop-shadow-md">
                <Zap className="h-3.5 w-3.5 text-cyan-200 fill-cyan-200/50" /> Portal
              </div>
            </Link>
          </div>
        </div>

        <form onSubmit={handleManualSearch} className="flex w-full md:flex-1 md:max-w-xl md:mx-8 relative group">
          <input 
            type="text" 
            suppressHydrationWarning
            value={userSearchQuery}
            onChange={(event) => setUserSearchQuery(event.target.value)}
            placeholder="Search DJs, cities, or setups..." 
            className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700/80 focus:border-cyan-500 rounded-full pl-5 pr-12 py-2.5 md:py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          />
          <button 
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 md:p-2 rounded-full transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Desktop Favorites and Portal Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setShowFavoritesDrawer(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 rounded-xl font-bold text-sm transition-all shadow-inner relative group cursor-pointer active:scale-95"
          >
            <Heart className={`h-4 w-4 transition-transform duration-300 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
            <span>Saved DJs</span>
            {favoritesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-950 shadow-md">
                {favoritesCount}
              </span>
            )}
          </button>

          <Link href="/admin" className="group relative px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
              <Zap className="h-4 w-4 text-cyan-200 fill-cyan-200/50" /> Partner Portal
            </div>
          </Link>
        </div>
      </nav>

      {/* 
        HERO SECTION 
        - Mobile: Natural flow, no empty height gaps.
        - Desktop: EXACTLY 100vh minus the 76px nav. Pushes Trending entirely off-screen.
      */}
      <section className="relative flex flex-col justify-center py-12 md:py-0 min-h-[auto] md:min-h-[calc(100vh-76px)] overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 z-0 flex justify-end pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40 md:to-transparent z-10 w-full lg:w-3/4"></div>
          <div className="absolute bottom-0 w-full h-24 md:h-40 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>
          <div className="relative w-full lg:w-3/4 h-full ml-auto">
             <Image 
              src="/hero-dj.png" 
              alt="DJ Setup Background" 
              fill
              priority
              className="object-cover object-center md:object-right opacity-30 md:opacity-50 mix-blend-lighten"
            />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* 
            TEXT & BUTTON CONTAINER
            - Strictly left aligned on Desktop (md:items-start, md:mx-0)
            - Perfectly spaced on Mobile (items-center, mx-auto)
          */}
          <div className="w-full max-w-2xl mx-auto md:mx-0 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] font-black uppercase tracking-tighter leading-[1.05] mb-4 md:mb-6 drop-shadow-2xl">
              Make your event <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"> Loud & Proud</span>
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-md sm:max-w-xl font-medium leading-relaxed mb-6 md:mb-10">
              Book the Best DJ Trucks with heavy bass systems, LED walls, and professional sound engineers across India.
            </p>
            
            <button 
              onClick={handleLocateDJs}
              disabled={isLocatingUser}
              className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-slate-900 rounded-2xl font-black text-sm md:text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-center gap-2.5 drop-shadow-md">
                <Navigation className={`h-4 w-4 md:h-5 md:w-5 ${isLocatingUser ? 'animate-ping' : ''}`} /> 
                {isLocatingUser ? 'Scanning area...' : 'Find DJs Near You'}
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* LIVE TRENDING DJS */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16 relative">
        <div className="absolute top-0 left-0 md:left-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span> 
            Trending Near You
          </h2>
          <div className="text-[10px] sm:text-xs font-bold text-orange-500/80 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 flex items-center gap-1.5">
            <Flame className="h-3 w-3" /> Live Feed
          </div>
        </div>
        
        {isFeedLoading ? (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="min-w-[280px] md:min-w-[320px] h-64 bg-slate-900/50 rounded-[1.5rem] animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : liveTrendingDjs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center relative z-10">
            <p className="text-slate-400 font-bold text-sm md:text-base">No DJs are currently trending. Check back soon!</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-6 hide-scrollbar relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            {liveTrendingDjs.map((djProfile) => (
              
              <Link 
                href={`/dj/${djProfile.id}`} 
                key={djProfile.id} 
                className="min-w-[85vw] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[340px] flex-shrink-0 snap-center sm:snap-start bg-slate-900/40 backdrop-blur-lg border border-slate-800/80 hover:border-cyan-500/40 rounded-[1.5rem] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_10px_25px_-5px_rgba(6,182,212,0.2)] group cursor-pointer hover:-translate-y-1"
              >
                <div className="h-40 md:h-48 relative w-full flex items-center justify-center overflow-hidden bg-slate-950">
                  {djProfile.media_urls && djProfile.media_urls.length > 0 ? (
                    <>
                      <img src={djProfile.media_urls[0]} alt={djProfile.dj_name} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-lg scale-110 pointer-events-none" />
                      <img src={djProfile.media_urls[0]} alt={djProfile.dj_name} className="relative z-10 max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-102 transition-all duration-500" />
                    </>
                  ) : (
                    <Speaker className="h-8 w-8 text-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-20"></div>
                  <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 text-slate-200 text-[10px] md:text-xs font-bold bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">
                    <MapPin className="h-3 w-3 text-cyan-400" /> {djProfile.city}
                  </div>
                </div>

                <div className="p-4 md:p-5 flex flex-col flex-grow">
                  <h3 className="text-base md:text-lg font-black text-white group-hover:text-cyan-400 transition-colors mb-1 truncate">{djProfile.dj_name}</h3>
                  <p className="text-[10px] md:text-xs font-medium text-slate-400 mb-3 line-clamp-2 leading-relaxed">{djProfile.specs}</p>
                  
                  <div className="flex flex-col pt-3 border-t border-slate-800/50 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm font-black text-cyan-400">Price depends on distance</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                        View Profile <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ALL DJS DIRECTORY */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16 relative border-t border-slate-800/50 bg-slate-950/30">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xl md:text-3xl font-black text-white tracking-tight">Explore Directory</h2>
          <Link href="/search" className="text-xs md:text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
            View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </div>

        {isFeedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-64 bg-slate-900/50 rounded-[1.5rem] animate-pulse"></div>)}
          </div>
        ) : liveNetworkDjs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-bold text-sm">No DJs currently in the network.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {liveNetworkDjs.map((djProfile) => (
              
              <Link 
                href={`/dj/${djProfile.id}`} 
                key={djProfile.id} 
                className="bg-slate-900/40 backdrop-blur-lg border border-slate-800/80 hover:border-cyan-500/40 rounded-[1.5rem] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_10px_25px_-5px_rgba(6,182,212,0.2)] group cursor-pointer hover:-translate-y-1"
              >
                <div className="h-40 md:h-48 relative w-full flex items-center justify-center overflow-hidden bg-slate-950">
                  {djProfile.media_urls && djProfile.media_urls.length > 0 ? (
                    <>
                      <img src={djProfile.media_urls[0]} alt={djProfile.dj_name} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-lg scale-110 pointer-events-none" />
                      <img src={djProfile.media_urls[0]} alt={djProfile.dj_name} className="relative z-10 max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-102 transition-all duration-500" />
                    </>
                  ) : (
                    <Speaker className="h-8 w-8 text-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-20"></div>
                  <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 text-slate-200 text-[10px] md:text-xs font-bold bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">
                    <MapPin className="h-3 w-3 text-cyan-400" /> {djProfile.city}
                  </div>
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-grow">
                  <h3 className="text-base md:text-lg font-black text-white group-hover:text-cyan-400 transition-colors mb-1 truncate">{djProfile.dj_name}</h3>
                  <p className="text-[10px] md:text-xs font-medium text-slate-400 mb-3 line-clamp-2 leading-relaxed">{djProfile.specs}</p>
                  <div className="flex flex-col pt-3 border-t border-slate-800/50 mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm font-black text-cyan-400">Price depends on distance</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                        View Profile <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* GLOSSY SLIDING DRAWER FOR FAVORITES */}
      {showFavoritesDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop blur */}
          <div 
            onClick={() => setShowFavoritesDrawer(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border-l border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Glossy top edge light */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 shadow-inner">
                  <Heart className="h-5 w-5 text-rose-400 fill-rose-500/20" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Your Saved Setups</h3>
                  <p className="text-[10px] font-black text-rose-400/70 uppercase tracking-widest">Saved in local terminal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFavoritesDrawer(false)}
                className="p-2 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {favoriteDjs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-full mb-4 shadow-inner">
                    <Heart className="h-10 w-10 text-slate-700 animate-pulse" />
                  </div>
                  <h4 className="font-black text-white uppercase text-xs tracking-wider mb-2">No Saved DJs Yet</h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Explore our directory and click the <span className="text-rose-400">Save to Favorites</span> heart button on any DJ profile to keep them here!
                  </p>
                </div>
              ) : (
                favoriteDjs.map((dj) => (
                  <Link 
                    href={`/dj/${dj.id}`}
                    key={dj.id}
                    className="flex items-center gap-4 bg-slate-950/50 hover:bg-slate-950 border border-slate-800/60 hover:border-rose-500/20 p-3 rounded-2xl transition-all shadow-inner group/item relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.02] rounded-full blur-xl pointer-events-none"></div>

                    {/* Image */}
                    <div className="h-16 w-16 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                      {dj.media_urls && dj.media_urls.length > 0 ? (
                        <>
                          <img src={dj.media_urls[0]} alt={dj.dj_name} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110 pointer-events-none" />
                          <img src={dj.media_urls[0]} alt={dj.dj_name} className="relative z-10 max-w-full max-h-full object-contain" />
                        </>
                      ) : (
                        <Speaker className="h-5 w-5 text-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <h4 className="font-black text-sm text-white group-hover/item:text-rose-400 transition-colors truncate mb-0.5">{dj.dj_name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1.5">
                        <MapPin className="h-3 w-3 text-cyan-500" /> {dj.city}, {dj.state}
                      </p>
                      <p className="text-[10px] font-black text-rose-300">Price depends on distance</p>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={(e) => handleRemoveFavorite(dj.id, e)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer flex-shrink-0 shadow-md group-hover/item:scale-105 active:scale-95"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Link>
                ))
              )}
            </div>

            {/* Footer action */}
            {favoriteDjs.length > 0 && (
              <div className="p-6 border-t border-slate-800/80 bg-slate-950/30">
                <button 
                  onClick={() => setShowFavoritesDrawer(false)}
                  className="w-full py-4 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  Close Saved Directory
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}