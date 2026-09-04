'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Speaker, Phone, MessageCircle, MonitorPlay, Camera, CheckCircle2, Flame, ShieldCheck, Heart, Share2, Check, ChevronLeft, ChevronRight, Star, MessageSquare, ExternalLink } from 'lucide-react';
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

  // Review System State
  const [reviews, setReviews] = useState([]);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Multiple Contact Numbers states
  const [showPhoneOptions, setShowPhoneOptions] = useState(false);
  const [showWhatsappOptions, setShowWhatsappOptions] = useState(false);

  // Memoized parsed videos to guarantee complete safety against Temporal Dead Zone (TDZ)
  // and stable references to prevent unnecessary intersection observer effect executions.
  const parsedVideos = useMemo(() => {
    const videos = [];
    
    const parseVideoUrl = (url) => {
      if (!url) return null;
      const trimmed = url.trim();
      
      // 1. YouTube Shorts
      const ytShortsRegex = /(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]+)/i;
      const ytShortsMatch = trimmed.match(ytShortsRegex);
      if (ytShortsMatch) {
        return {
          embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}?enablejsapi=1`,
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
          embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`,
          type: 'youtube',
          orientation: 'horizontal',
          label: 'Live Performance'
        };
      }

      return null;
    };

    if (activeDjProfileData?.performance_urls && activeDjProfileData.performance_urls.length > 0) {
      activeDjProfileData.performance_urls.forEach((url) => {
        const parsed = parseVideoUrl(url);
        if (parsed) videos.push(parsed);
      });
    }
    
    // Fallback compatibility check
    if (videos.length === 0) {
      if (activeDjProfileData?.youtube_url) {
        const parsed = parseVideoUrl(activeDjProfileData.youtube_url);
        if (parsed) videos.push(parsed);
      }
      if (activeDjProfileData?.instagram_url) {
        const parsed = parseVideoUrl(activeDjProfileData.instagram_url);
        if (parsed) videos.push(parsed);
      }
    }

    return videos;
  }, [activeDjProfileData]);

  // Parse multiple phone numbers to handle options
  const phoneNumbersList = useMemo(() => {
    const rawPhone = activeDjProfileData?.phone;
    if (!rawPhone) return [];
    const parts = rawPhone.split(/[,/;\n\r]+|(?:\s+and\s+)/i);
    const result = [];
    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const digits = trimmed.replace(/[^0-9+]/g, '');
      if (digits.length >= 8) {
        result.push({
          rawNumber: digits,
          displayText: trimmed
        });
      }
    });
    return result;
  }, [activeDjProfileData]);

  // Parse multiple WhatsApp numbers to handle options
  const whatsappNumbersList = useMemo(() => {
    const rawWhatsapp = activeDjProfileData?.whatsapp;
    if (!rawWhatsapp) return [];
    const parts = rawWhatsapp.split(/[,/;\n\r]+|(?:\s+and\s+)/i);
    const result = [];
    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const digits = trimmed.replace(/[^0-9]/g, '');
      if (digits.length >= 8) {
        result.push({
          rawNumber: digits,
          displayText: trimmed
        });
      }
    });
    return result;
  }, [activeDjProfileData]);

  const fetchReviews = async () => {
    if (!targetDjProfileId) return;
    setIsFetchingReviews(true);
    try {
      const { data, error } = await supabase
        .from('dj_reviews')
        .select('*')
        .eq('dj_id', targetDjProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating((sum / data.length).toFixed(1));
      } else {
        setAverageRating(0);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsFetchingReviews(false);
    }
  };

  useEffect(() => {
    if (targetDjProfileId) {
      fetchReviews();
    }
  }, [targetDjProfileId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const { data, error } = await supabase
        .from('dj_reviews')
        .insert([
          {
            dj_id: targetDjProfileId,
            reviewer_name: newReviewerName,
            rating: newRating,
            comment: newComment,
          }
        ])
        .select();

      if (error) throw error;

      setReviewSubmitSuccess(true);
      setNewReviewerName('');
      setNewComment('');
      setNewRating(5);
      setHoveredStar(0);
      
      if (data && data[0]) {
        const updatedReviews = [data[0], ...reviews];
        setReviews(updatedReviews);
        const sum = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating((sum / updatedReviews.length).toFixed(1));
      }
      
      setTimeout(() => setReviewSubmitSuccess(false), 4000);
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError(err.message || "Failed to submit review. Make sure you ran the SQL command to create the dj_reviews table!");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const scrollVideos = (direction) => {
    const container = desktopScrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // IntersectionObserver to auto-pause videos scrolled out of view
  useEffect(() => {
    const container = desktopScrollContainerRef.current;
    if (!container || parsedVideos.length === 0) return;

    const observerOptions = {
      root: container,
      threshold: 0.25, // Trigger when less than 25% of the video card is visible
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          const iframe = entry.target.querySelector('iframe');
          if (iframe) {
            try {
              // 1. YouTube iframe postMessage pauseVideo API
              iframe.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                '*'
              );
            } catch (e) {
              console.error("Failed to post pause command:", e);
            }

            // 2. Cross-platform / Instagram fallback: Reset src to instantly cut off audio output
            const currentSrc = iframe.getAttribute('src');
            if (currentSrc) {
              iframe.setAttribute('src', currentSrc);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    const cards = container.querySelectorAll('.video-card-item');
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
      observer.disconnect();
    };
  }, [parsedVideos]);

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
              {reviews.length > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-fade-in">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-400" /> {averageRating} ★ ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800/40 px-3 py-1 rounded-md border border-slate-700/30">
                  <Star className="h-4 w-4" /> No reviews yet
                </span>
              )}
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
                  <>
                    <img 
                      src={activeDjProfileData.media_urls[activeGalleryImageIndex]} 
                      alt={`${activeDjProfileData.dj_name} live setup view blur backdrop`} 
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 pointer-events-none"
                    />
                    <img 
                      src={activeDjProfileData.media_urls[activeGalleryImageIndex]} 
                      alt={`${activeDjProfileData.dj_name} live setup view`} 
                      className="relative z-10 max-w-full max-h-full object-contain"
                    />
                  </>
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
                      className={`relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 border-2 flex items-center justify-center bg-slate-950 ${
                        activeGalleryImageIndex === assetIndex 
                          ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105' 
                          : 'border-slate-700/50 hover:border-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={mediaAssetUrl} alt={`Setup thumbnail ${assetIndex} blur backdrop`} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 pointer-events-none" />
                      <img src={mediaAssetUrl} alt={`Setup thumbnail ${assetIndex}`} className="relative z-10 max-w-full max-h-full object-contain" />
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

            {/* Unified Live Performance Carousel Section */}
            {parsedVideos.length > 0 && (
              <div className="bg-slate-900/40 backdrop-blur-2xl border border-cyan-500/20 border-t-cyan-500/30 rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden mt-6">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
                      <MonitorPlay className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    </div>
                    Live Performance
                  </h2>
                  
                  {/* Proximity Navigation Arrows */}
                  {parsedVideos.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scrollVideos('left')}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => scrollVideos('right')}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer shadow-md active:scale-95"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8 ml-1 relative z-10">Watch live setups, lighting displays, and earth-shattering bass checks in action.</p>

                {/* Horizontal Scrollable Container */}
                <div 
                  ref={desktopScrollContainerRef}
                  className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar pb-6 snap-x snap-mandatory scroll-smooth relative z-10 -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {parsedVideos.map((video, idx) => (
                    <div 
                      key={idx} 
                      className={`video-card-item flex-shrink-0 snap-start bg-slate-950/60 border border-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-3xl flex flex-col items-center justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 ${
                        video.orientation === 'vertical' ? 'w-[240px] sm:w-[320px]' : 'w-full max-w-[280px] sm:max-w-none sm:w-[500px]'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none"></div>
                      
                      <div className="w-full flex items-center justify-between mb-3 sm:mb-4 border-b border-slate-800/80 pb-2 sm:pb-3">
                        <span className="text-[10px] sm:text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                          Clip #{idx + 1}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 sm:py-1 rounded-md">{video.label}</span>
                      </div>

                      <div className="w-full flex-grow flex items-center justify-center py-1 sm:py-2">
                        {video.orientation === 'vertical' ? (
                          /* Vertical 9:16 player styled as smartphone */
                          <div className="w-full max-w-[180px] sm:max-w-[240px] relative rounded-2xl sm:rounded-[2rem] overflow-hidden border-[4px] sm:border-[6px] border-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-[9/16] bg-slate-950">
                            {/* notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3 sm:h-4 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                              <div className="w-4 sm:w-5 h-0.5 bg-slate-700 rounded-full mb-0.5"></div>
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
                          /* Horizontal 16:9 player */
                          <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.8)] aspect-video bg-slate-950">
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


          </div>

          {/* RIGHT COLUMN: Booking & Contacts */}
          <div className="space-y-6">
            
            {/* The Booking Action Card */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/40 border-t-cyan-400/60 rounded-[2rem] p-8 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.25)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
              
              <h2 className="text-2xl font-black text-white mb-2 relative z-10">Book this Setup</h2>
              <p className="text-slate-400 text-sm mb-6 relative z-10">Contact the owner directly to negotiate dates, transport, and final pricing.</p>
              
              {/* Integrated Booking Price Display */}
              <div className="mb-6 relative z-10 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Price</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">Negotiable Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                      Price depends on distance
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5 font-medium">
                  <span className="text-cyan-400 font-black text-xs leading-none">*</span>
                  <span>Actual price is variable and depends upon season and travel distance to your location.</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 relative z-10">
                {/* --- CONTACT PHONE SYSTEM --- */}
                {phoneNumbersList.length <= 1 ? (
                  // Single phone number - standard premium link button
                  <a 
                    href={`tel:${phoneNumbersList[0]?.rawNumber || activeDjProfileData.phone.replace(/[^0-9+]/g, '')}`}
                    className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.6)] overflow-hidden flex items-center justify-center gap-3 border border-cyan-400/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                      <Phone className="h-5 w-5 text-white" /> Call Now: {phoneNumbersList[0]?.displayText || activeDjProfileData.phone}
                    </div>
                  </a>
                ) : (
                  // Multiple phone numbers - interactive expanding selection
                  <div className="w-full flex flex-col gap-2">
                    <button 
                      onClick={() => setShowPhoneOptions(!showPhoneOptions)}
                      className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.5)] overflow-hidden flex items-center justify-center gap-3 border border-cyan-400/50 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
                      <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                        <Phone className="h-5 w-5 text-white" /> 
                        Choose Number to Call ({phoneNumbersList.length})
                      </div>
                    </button>
                    
                    {showPhoneOptions && (
                      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2.5 space-y-2 animate-fade-in shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2 mb-1">Select a Contact Number:</p>
                        {phoneNumbersList.map((phone, idx) => (
                          <a 
                            key={idx}
                            href={`tel:${phone.rawNumber}`}
                            className="w-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/40 rounded-lg p-3 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-between group/item"
                          >
                            <span className="truncate max-w-[180px]">{phone.displayText}</span>
                            <span className="text-[10px] uppercase font-black px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded group-hover/item:bg-cyan-500 group-hover/item:text-slate-950 transition-all flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Call
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- WHATSAPP SYSTEM --- */}
                {whatsappNumbersList.length > 0 && (
                  whatsappNumbersList.length <= 1 ? (
                    // Single WhatsApp number - standard link button
                    <a 
                      href={`https://wa.me/${whatsappNumbersList[0].rawNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.5)] overflow-hidden flex items-center justify-center gap-3 border border-emerald-500/40"
                    >
                      <div className="absolute inset-0 bg-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                      <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                        <MessageCircle className="h-5 w-5 text-white" /> Chat on WhatsApp: {whatsappNumbersList[0].displayText}
                      </div>
                    </a>
                  ) : (
                    // Multiple WhatsApp numbers - interactive expanding selection
                    <div className="w-full flex flex-col gap-2">
                      <button 
                        onClick={() => setShowWhatsappOptions(!showWhatsappOptions)}
                        className="w-full group relative px-6 py-4 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] overflow-hidden flex items-center justify-center gap-3 border border-emerald-500/40 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
                          <MessageCircle className="h-5 w-5 text-white" /> 
                          Choose WhatsApp Chat ({whatsappNumbersList.length})
                        </div>
                      </button>
                      
                      {showWhatsappOptions && (
                        <div className="bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 rounded-xl p-2.5 space-y-2 animate-fade-in shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 mb-1">Select a WhatsApp Number:</p>
                          {whatsappNumbersList.map((whatsapp, idx) => (
                            <a 
                              key={idx}
                              href={`https://wa.me/${whatsapp.rawNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/40 rounded-lg p-3 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-between group/item"
                            >
                              <span className="truncate max-w-[180px]">{whatsapp.displayText}</span>
                              <span className="text-[10px] uppercase font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded group-hover/item:bg-emerald-500 group-hover/item:text-slate-950 transition-all flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> Chat
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
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
                  <div className="flex-1">
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

                {/* Conditional Google Maps Button */}
                {activeDjProfileData.google_maps_url && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <a
                      href={activeDjProfileData.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 border border-blue-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] group/map cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-cyan-400 group-hover/map:scale-110 transition-transform" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5 text-cyan-400/70 group-hover/map:translate-x-0.5 group-hover/map:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                )}
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

        {/* Dynamic Review & Rating System (Moved here for full-width desktop and bottom stacking on mobile!) */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-amber-500/30 border-t-amber-400/40 rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group mt-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"></div>
          
          <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <MessageSquare className="h-5 w-5 text-amber-400" />
            </div>
            User Reviews & Feedbacks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {/* Ratings Statistics Sidecard */}
            <div className="md:col-span-2 flex flex-col justify-center items-center bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AVERAGE RATING</p>
              <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-yellow-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {reviews.length > 0 ? averageRating : '0.0'}
              </p>
              <div className="flex items-center gap-1.5 mt-3 mb-2">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const activeStarsCount = Math.round(Number(averageRating));
                  return (
                    <Star 
                      key={starIdx} 
                      className={`h-5 w-5 ${
                        starIdx <= activeStarsCount 
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' 
                          : 'text-slate-750'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Submit New Review Form */}
            <div className="md:col-span-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-md">
              <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest border-b border-slate-800/80 pb-2">Share Your Experience</h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Name</label>
                    <input
                      type="text"
                      suppressHydrationWarning
                      required
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Rating</label>
                    <div className="flex items-center gap-2 h-[38px]">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => setNewRating(starIdx)}
                          onMouseEnter={() => setHoveredStar(starIdx)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="focus:outline-none transition-transform active:scale-90 cursor-pointer"
                        >
                          <Star 
                            className={`h-6 w-6 transition-all ${
                              starIdx <= (hoveredStar || newRating)
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110'
                                : 'text-slate-750 hover:text-slate-500 scale-100'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Review Comment</label>
                  <textarea
                    required
                    suppressHydrationWarning
                    rows="2"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tell us about their sound output, base check, lighting setup..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  ></textarea>
                </div>

                {reviewError && (
                  <p className="text-red-400 text-xs font-semibold">{reviewError}</p>
                )}

                {reviewSubmitSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Review submitted successfully!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(217,119,6,0.3)] hover:shadow-[0_4px_25px_rgba(217,119,6,0.5)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>
          </div>

          {/* Scrollable Reviews Feed List */}
          <div className="mt-8 relative z-10 border-t border-slate-800/80 pt-6">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Client Feedbacks</h3>
            
            {isFetchingReviews ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-8 w-8 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-3"></div>
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Fetching Reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-8 text-center text-slate-500">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-wider mb-1">No reviews yet</p>
                <p className="text-xs text-slate-600">Be the first to share your experience with this DJ setup!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar select-none">
                {reviews.map((review) => (
                  <div 
                    key={review.id} 
                    className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/60 p-5 rounded-2xl transition-all shadow-inner group/item"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-xs uppercase shadow-inner">
                          {review.reviewer_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-200">{review.reviewer_name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <Star 
                            key={starVal} 
                            className={`h-3.5 w-3.5 ${
                              starVal <= review.rating 
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]' 
                                : 'text-slate-850'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium pl-0 sm:pl-11 pr-2">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Portable Custom Scrollbar Styling */}
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(2, 6, 23, 0.4);
              border-radius: 9999px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(245, 158, 11, 0.2);
              border-radius: 9999px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(245, 158, 11, 0.4);
            }
          `}} />
        </div>

      </div>
    </div>
  );
}
