'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Speaker, Phone, MessageCircle, MonitorPlay, Camera, CheckCircle2, Flame, ShieldCheck, Heart, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/utils/supabase';

export default function PublicDjProfileClient({ initialDjData, profileRetrievalErrorMessage: serverError, targetDjProfileId }) {
  const [activeDjProfileData, setActiveDjProfileData] = useState(initialDjData);
  const [isRetrievingProfileData, setIsRetrievingProfileData] = useState(!initialDjData && !serverError);
  const [profileRetrievalErrorMessage, setProfileRetrievalErrorMessage] = useState(serverError || '');
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const desktopScrollContainerRef = useRef(null);
  const mobileScrollContainerRef = useRef(null);

  const scrollVideos = (direction, isMobile = false) => {
    const container = isMobile ? mobileScrollContainerRef.current : desktopScrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && targetDjProfileId) {
      const favorites = JSON.parse(localStorage.getItem('favorite_djs') || '[]');
      setIsFavorited(favorites.includes(targetDjProfileId));
    }
  }, [targetDjProfileId]);

  const toggleFavorite = () => {
    if (typeof window !== 'undefined' && targetDjProfileId) {
      const favorites = JSON.parse(localStorage.getItem('favorite_djs') || '[]');
      let updatedFavorites;
      if (favorites.includes(targetDjProfileId)) {
        updatedFavorites = favorites.filter(id => id !== targetDjProfileId);
        setIsFavorited(false);
      } else {
        updatedFavorites = [...favorites, targetDjProfileId];
        setIsFavorited(true);
      }
      localStorage.setItem('favorite_djs', JSON.stringify(updatedFavorites));
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: activeDjProfileData ? `${activeDjProfileData.dj_name} | DJ HAUNTER` : 'DJ HAUNTER',
      text: activeDjProfileData ? `Check out this amazing sound system and DJ setup: ${activeDjProfileData.dj_name}!` : 'Check out this DJ setup!',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  // Video URL Parser
  const parseVideoUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    
    // 1. YouTube Shorts
    const ytShortsRegex = /(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]+)/i;
    const ytShortsMatch = trimmed.match(ytShortsRegex);
    if (ytShortsMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}`,
        type: 'youtube-shorts',
        orientation: 'vertical',
        label: 'YouTube Shorts'
      };
    }

    // 2. Instagram Reels / Posts
    const igReelRegex = /instagram\.com\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i;
    const igReelMatch = trimmed.match(igReelRegex);
    if (igReelMatch) {
      return {
        embedUrl: `https://www.instagram.com/reel/${igReelMatch[1]}/embed`,
        type: 'instagram-reel',
        orientation: 'vertical',
        label: 'Instagram Reel'
      };
    }

    // 3. Standard YouTube Video
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
    const ytMatch = trimmed.match(ytRegex);
    if (ytMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
        type: 'youtube',
        orientation: 'horizontal',
        label: 'Live Performance'
      };
    }

    return null;
  };

  const parsedVideos = [];
  
  if (activeDjProfileData?.performance_urls && activeDjProfileData.performance_urls.length > 0) {
    activeDjProfileData.performance_urls.forEach((url) => {
      const parsed = parseVideoUrl(url);
      if (parsed) parsedVideos.push(parsed);
    });
  }
  
  // Fallback compatibility check
  if (parsedVideos.length === 0) {
    if (activeDjProfileData?.youtube_url) {
      const parsed = parseVideoUrl(activeDjProfileData.youtube_url);
      if (parsed) parsedVideos.push(parsed);
    }
    if (activeDjProfileData?.instagram_url) {
      const parsed = parseVideoUrl(activeDjProfileData.instagram_url);
      if (parsed) parsedVideos.push(parsed);
    }
  }

  useEffect(() => {
    async function loadPublicDjProfileDatabaseRecordFallback() {
      if (activeDjProfileData) return;
      try {
        setIsRetrievingProfileData(true);
        const { data: fetchedDjProfileRecord, error: databaseRetrievalError } = await supabase
          .from('dj_directory')
          .select('*')
          .eq('id', targetDjProfileId)
          .single();

        if (databaseRetrievalError) throw databaseRetrievalError;
        setActiveDjProfileData(fetchedDjProfileRecord);
      } catch (error) {
        console.error("Critical error loading public profile dynamically:", error);
        setProfileRetrievalErrorMessage("This DJ profile could not be found or has been removed from the network.");
      } finally {
        setIsRetrievingProfileData(false);
      }
    }

    if (targetDjProfileId && !activeDjProfileData) loadPublicDjProfileDatabaseRecordFallback();
  }, [targetDjProfileId, activeDjProfileData]);

  if (isRetrievingProfileData) {
    return (
      <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <div className="h-16 w-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
        <p className="text-cyan-500 font-black tracking-widest uppercase text-sm drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">Initializing Profile Interface...</p>
      </div>
    );
  }

  if (profileRetrievalErrorMessage || !activeDjProfileData) {
    return (
      <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center text-white px-4 text-center">
        <ShieldCheck className="h-24 w-24 text-slate-800 mb-6" />
        <h1 className="text-4xl font-black text-red-400 mb-4 tracking-tight">Signal Lost</h1>
        <p className="text-slate-400 max-w-md mb-8">{profileRetrievalErrorMessage}</p>
        <Link href="/search" className="px-8 py-4 bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-2xl font-bold text-cyan-400 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          Return to Global Directory
        </Link>
      </div>
    );
  }

  const formattedWhatsappLink = activeDjProfileData.whatsapp ? `https://wa.me/${activeDjProfileData.whatsapp.replace(/[^0-9]/g, '')}` : null;
  const formattedPhoneDialerLink = `tel:${activeDjProfileData.phone.replace(/[^0-9+]/g, '')}`;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 font-sans relative selection:bg-cyan-500/30 overflow-hidden pb-20">
      
      {/* GLOSSY AMBIENT BACKGROUND */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-700/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none z-0 mix-blend-overlay"></div>

      {/* PUBLIC NAVIGATION */}
      <nav className="relative z-50 flex items-center justify-between py-6 px-4 sm:px-6 lg:px-12 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <Link href="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          <span className="bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 px-2 py-1 rounded-lg">DH</span>
          DJ HAUNTER
        </Link>
        <Link href="/search" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-xl font-bold text-sm transition-all shadow-inner group">
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" /> 
          <span className="hidden sm:inline">Back to Search</span>
        </Link>
      </nav>

      {/* MAIN PROFILE ARCHITECTURE */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 relative z-10">
        
        {/* TOP PROFILE HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10 border-b border-slate-800/60 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                {activeDjProfileData.dj_name}
              </h1>
              {activeDjProfileData.is_trending && (
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/50 text-xs uppercase font-black px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)] flex items-center gap-1.5">
                  <Flame className="h-4 w-4 fill-orange-400/50" /> Trending
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" /> HAUNTER VERIFIED
              </span>
              <span className="flex items-center gap-1.5 text-cyan-200/80">
                <MapPin className="h-4 w-4 text-cyan-500" /> {activeDjProfileData.city}, {activeDjProfileData.district}
              </span>
            </div>
          </div>
        </div>

        {/* DUAL COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Media Gallery */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/30 rounded-[2rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>
              
              {/* Main Stage Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner">
                {activeDjProfileData.media_urls && activeDjProfileData.media_urls.length > 0 ? (
                  <img 
                    src={activeDjProfileData.media_urls[activeGalleryImageIndex]} 
                    alt={`${activeDjProfileData.dj_name} live setup view`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center">
                    <Speaker className="h-20 w-20 mb-4 opacity-50" />
                    <p className="font-bold tracking-widest uppercase">No Media Provided</p>
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {activeDjProfileData.media_urls && activeDjProfileData.media_urls.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-2 relative z-10">
                  {activeDjProfileData.media_urls.map((mediaAssetUrl, assetIndex) => (
                    <button 
                      key={assetIndex}
                      onClick={() => setActiveGalleryImageIndex(assetIndex)}
                      className={`relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                        activeGalleryImageIndex === assetIndex 
                          ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105' 
                          : 'border-slate-700/50 hover:border-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={mediaAssetUrl} alt={`Setup thumbnail ${assetIndex}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Utility Action Bar */}
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden mt-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Profile Tools</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Favorite Button */}
                <button 
                  onClick={toggleFavorite}
                  className={`relative p-3 rounded-xl border flex items-center gap-2 font-bold text-sm transition-all duration-300 cursor-pointer ${
                    isFavorited 
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105' 
                      : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isFavorited ? "Remove from Favorites" : "Save to Favorites"}
                >
                  <Heart className={`h-5 w-5 transition-transform duration-300 ${isFavorited ? 'fill-rose-500 scale-110' : ''}`} />
                  <span className="hidden sm:inline">{isFavorited ? "Favorited" : "Save to Favorites"}</span>
                </button>

                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="relative p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-200 flex items-center gap-2 font-bold text-sm transition-all duration-300 cursor-pointer"
                  title="Share Profile"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 text-emerald-400" />
                      <span className="hidden sm:inline text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Share Setup</span>
                    </>
                  )}
                  
                  {/* Tooltip for Copy Success */}
                  {copied && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500 text-emerald-400 text-xs px-2.5 py-1 rounded-lg font-black shadow-lg animate-bounce z-50 whitespace-nowrap">
                      Link Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>


            {/* Hardware Specifications Card */}
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-indigo-500/30 border-t-indigo-400/40 rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-indigo-500/15 rounded-xl border border-indigo-500/30 shadow-inner">
                  <Speaker className="h-5 w-5 text-indigo-400" />
                </div>
                Hardware & Sound Specifications
              </h2>
              <div className="relative z-10 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {activeDjProfileData.specs || "No specific hardware details provided."}
                </p>
              </div>
            </div>

            {/* Desktop Live Performance Carousel Section (Desktop only) */}
            {parsedVideos.length > 0 && (
              <div className="hidden lg:block bg-slate-900/40 backdrop-blur-2xl border border-cyan-500/20 border-t-cyan-500/30 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden mt-6">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
                      <MonitorPlay className="h-6 w-6 text-cyan-400" />
                    </div>
                    Live Performance
                  </h2>
                  
                  {/* Premium Navigation Arrows for Horizontal Scroll */}
                  {parsedVideos.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scrollVideos('left')}
                        className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => scrollVideos('right')}
                        className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-8 ml-1 relative z-10">Watch live setups, lighting displays, and earth-shattering bass checks in action.</p>

                {/* Horizontal Scrollable Container */}
                <div 
                  ref={desktopScrollContainerRef}
                  className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory scroll-smooth relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {parsedVideos.map((video, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-shrink-0 snap-start bg-slate-950/60 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 ${
                        video.orientation === 'vertical' ? 'w-[280px] sm:w-[320px]' : 'w-full max-w-[320px] sm:max-w-none sm:w-[500px]'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none"></div>
                      
                      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                          Clip #{idx + 1}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">{video.label}</span>
                      </div>

                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        {video.orientation === 'vertical' ? (
                          /* Vertical 9:16 player styled as a modern smartphone bezel */
                          <div className="w-full max-w-[240px] relative rounded-[2rem] overflow-hidden border-[6px] border-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-[9/16] bg-slate-950">
                            {/* Smartphone camera/notch notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                              <div className="w-5 h-0.5 bg-slate-700 rounded-full mb-0.5"></div>
                            </div>
                            <iframe
                              src={video.embedUrl}
                              title={`Performance clip #${idx + 1}`}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            ></iframe>
                          </div>
                        ) : (
                          /* Horizontal 16:9 player styled as cinematic screen */
                          <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-video bg-slate-950">
                            <iframe
                              src={video.embedUrl}
                              title={`Performance clip #${idx + 1}`}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Booking & Contacts */}
          <div className="space-y-6">
            
            {/* The Booking Action Card */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/40 border-t-cyan-400/60 rounded-[2rem] p-8 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
              
              <h2 className="text-2xl font-black text-white mb-2 relative z-10">Book this Setup</h2>
              <p className="text-slate-400 text-sm mb-6 relative z-10">Contact the owner directly to negotiate dates, transport, and final pricing.</p>
              
              {/* Integrated Base Booking Price Display */}
              <div className="mb-6 relative z-10 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Booking Price</p>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Negotiable Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                    ₹ {activeDjProfileData.price}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 relative z-10">
                <a 
                  href={formattedPhoneDialerLink}
                  className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.6)] overflow-hidden flex items-center justify-center gap-3 border border-cyan-400/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                    <Phone className="h-5 w-5 text-white" /> Call Now: {activeDjProfileData.phone}
                  </div>
                </a>

                {formattedWhatsappLink && (
                  <a 
                    href={formattedWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.5)] overflow-hidden flex items-center justify-center gap-3 border border-emerald-500/40"
                  >
                    <div className="absolute inset-0 bg-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                      <MessageCircle className="h-5 w-5 text-white" /> Chat on WhatsApp
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Official Deployment Address Card */}
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-blue-500/30 border-t-blue-400/40 rounded-3xl p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/30 shadow-inner">
                  <MapPin className="h-4 w-4 text-blue-400 animate-bounce" />
                </div>
                Official Deployment Address
              </h2>
              
              <div className="relative z-10 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-inner">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-cyan-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-black text-sm tracking-tight leading-relaxed">
                      {activeDjProfileData.city}, {activeDjProfileData.district}
                    </p>
                    <p className="text-slate-400 text-xs font-semibold mt-1">
                      {activeDjProfileData.state} - {activeDjProfileData.pincode}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] uppercase font-black rounded-lg">
                      Deployment Base
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Area Card */}
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/30 rounded-3xl p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-blue-500/15 rounded-lg border border-blue-500/30 shadow-inner">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                Coverage Area
              </h2>
              <ul className="space-y-4 relative z-10">
                <li className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Base City</span>
                  <span className="text-white font-black">{activeDjProfileData.city}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">District</span>
                  <span className="text-white font-black">{activeDjProfileData.district}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">State Region</span>
                  <span className="text-white font-black">{activeDjProfileData.state}</span>
                </li>
              </ul>
            </div>

            {/* Social Links Card */}
            {(activeDjProfileData.youtube_url || activeDjProfileData.instagram_url) && (
              <div className="bg-slate-900/50 backdrop-blur-2xl border border-purple-500/30 border-t-purple-400/40 rounded-3xl p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-3 relative z-10">
                  Social Presence
                </h2>
                <div className="flex gap-4 relative z-10">
                  {activeDjProfileData.youtube_url && (
                    <a href={activeDjProfileData.youtube_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-950/80 hover:bg-red-600/20 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl py-3 flex items-center justify-center transition-all shadow-inner hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                      <MonitorPlay className="h-6 w-6" />
                    </a>
                  )}
                  {activeDjProfileData.instagram_url && (
                    <a href={activeDjProfileData.instagram_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-950/80 hover:bg-pink-600/20 border border-slate-800 hover:border-pink-500/50 text-slate-400 hover:text-pink-400 rounded-xl py-3 flex items-center justify-center transition-all shadow-inner hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                      <Camera className="h-6 w-6" />
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Live Performance Carousel Section (Mobile only) */}
        {parsedVideos.length > 0 && (
          <div className="lg:hidden bg-slate-900/40 backdrop-blur-2xl border border-cyan-500/20 border-t-cyan-500/30 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden mt-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 relative z-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
                  <MonitorPlay className="h-6 w-6 text-cyan-400" />
                </div>
                Live Performance
              </h2>
              
              {/* Premium Navigation Arrows for Horizontal Scroll */}
              {parsedVideos.length > 1 && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => scrollVideos('left', true)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => scrollVideos('right', true)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-8 ml-1 relative z-10">Watch live setups, lighting displays, and earth-shattering bass checks in action.</p>

            {/* Horizontal Scrollable Container */}
            <div 
              ref={mobileScrollContainerRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory scroll-smooth relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {parsedVideos.map((video, idx) => (
                <div 
                  key={idx} 
                  className={`flex-shrink-0 snap-start bg-slate-950/60 border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 ${
                    video.orientation === 'vertical' ? 'w-[280px] sm:w-[320px]' : 'w-full max-w-[320px] sm:max-w-none sm:w-[500px]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none"></div>
                  
                  <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                      Clip #{idx + 1}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">{video.label}</span>
                  </div>

                  <div className="w-full flex-grow flex items-center justify-center py-2">
                    {video.orientation === 'vertical' ? (
                      /* Vertical 9:16 player styled as a modern smartphone bezel */
                      <div className="w-full max-w-[240px] relative rounded-[2rem] overflow-hidden border-[6px] border-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-[9/16] bg-slate-950">
                        {/* Smartphone camera/notch notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                          <div className="w-5 h-0.5 bg-slate-700 rounded-full mb-0.5"></div>
                        </div>
                        <iframe
                          src={video.embedUrl}
                          title={`Performance clip #${idx + 1}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      /* Horizontal 16:9 player styled as cinematic screen */
                      <div className="w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-video bg-slate-950">
                        <iframe
                          src={video.embedUrl}
                          title={`Performance clip #${idx + 1}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
