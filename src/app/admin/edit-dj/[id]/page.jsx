'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Link as LinkIcon, Speaker, Zap, Phone, CheckCircle2, UploadCloud, FileImage, Trash2, X, Plus, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function EditDJ() {
  const applicationNavigationRouter = useRouter();
  const routingParameters = useParams(); 
  const targetDjProfileId = routingParameters.id;

  // Semantic Status Flags
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isRetrievingDjProfile, setIsRetrievingDjProfile] = useState(true);
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [isSuccessNotificationVisible, setIsSuccessNotificationVisible] = useState(false);
  
  // Data State Drivers
  const [activeDjProfile, setActiveDjProfile] = useState(null);
  const [retainedMediaUrlsFromDatabase, setRetainedMediaUrlsFromDatabase] = useState([]);
  const [newlySelectedMediaFiles, setNewlySelectedMediaFiles] = useState([]);
  const [performanceUrls, setPerformanceUrls] = useState(['']);

  const addPerformanceUrlInput = () => {
    setPerformanceUrls((prev) => [...prev, '']);
  };

  const removePerformanceUrlInput = (indexToRemove) => {
    setPerformanceUrls((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      return updated.length === 0 ? [''] : updated;
    });
  };

  const handlePerformanceUrlChange = (index, value) => {
    setPerformanceUrls((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Fetch target profile on load
  useEffect(() => {
    async function loadTargetDjProfile() {
      try {
        const { data: fetchedDjProfile, error: profileRetrievalError } = await supabase
          .from('dj_directory')
          .select('*')
          .eq('id', targetDjProfileId)
          .single();

        if (profileRetrievalError) throw profileRetrievalError;
        
        if (fetchedDjProfile) {
          setActiveDjProfile(fetchedDjProfile);
          // Pre-populate the media gallery state with what is currently stored
          setRetainedMediaUrlsFromDatabase(fetchedDjProfile.media_urls || []);
          setPerformanceUrls(fetchedDjProfile.performance_urls && fetchedDjProfile.performance_urls.length > 0 ? fetchedDjProfile.performance_urls : ['']);
        }
      } catch (error) {
        console.error("Critical error loading profile:", error);
        setFormErrorMessage("Could not load DJ data. The record may no longer exist.");
      } finally {
        setIsRetrievingDjProfile(false);
      }
    }

    if (targetDjProfileId) loadTargetDjProfile();
  }, [targetDjProfileId]);

  // Handler: Queue up fresh files from file browser
  const handleFreshMediaSelection = (event) => {
    if (event.target.files) {
      const selectedFilesArray = Array.from(event.target.files);
      setNewlySelectedMediaFiles((previouslySelectedFiles) => [...previouslySelectedFiles, ...selectedFilesArray]);
    }
  };

  // Handler: Remove a fresh file from the upload queue before submission
  const handleRemovePendingMediaFile = (targetFileIndexToRemove) => {
    setNewlySelectedMediaFiles((previouslySelectedFiles) => 
      previouslySelectedFiles.filter((_, currentMediaFileIndex) => currentMediaFileIndex !== targetFileIndexToRemove)
    );
  };

  // Handler: Delete an old image already stored on the live site
  const handleDeleteExistingMediaUrl = (targetUrlIndexToRemove) => {
    setRetainedMediaUrlsFromDatabase((previouslySavedUrls) => 
      previouslySavedUrls.filter((_, currentUrlIndex) => currentUrlIndex !== targetUrlIndexToRemove)
    );
  };

  // Main Handler: Process uploads and apply record updates
  const handleUpdateFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmittingForm(true);
    setFormErrorMessage('');
    setIsSuccessNotificationVisible(false);

    const interactiveFormData = new FormData(event.target);
    const finalizedMediaCollectionUrls = [...retainedMediaUrlsFromDatabase];

    try {
      // 1. UPLOAD NEWLY ADDED FILES SIMULTANEOUSLY (Promise.all for performance)
      if (newlySelectedMediaFiles.length > 0) {
        const structuralUploadPromises = newlySelectedMediaFiles.map(async (mediaFileToProcess) => {
          const fileExtensionPattern = mediaFileToProcess.name.split('.').pop();
          const uniqueStorageFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtensionPattern}`;

          const { error: storageBucketUploadError } = await supabase.storage
            .from('dj_media')
            .upload(uniqueStorageFileName, mediaFileToProcess);

          if (storageBucketUploadError) throw storageBucketUploadError;

          const { data: publicAccessUrlObject } = supabase.storage
            .from('dj_media')
            .getPublicUrl(uniqueStorageFileName);

          return publicAccessUrlObject.publicUrl;
        });

        const freshlyUploadedPublicUrls = await Promise.all(structuralUploadPromises);
        // Merge fresh uploads with remaining database media assets
        finalizedMediaCollectionUrls.push(...freshlyUploadedPublicUrls);
      }

      // 2. CONSTRUCT DATA PAYLOAD
      const updatedDjPayloadValues = {
        dj_name: interactiveFormData.get('dj_name'),
        specs: interactiveFormData.get('specs'),
        price: interactiveFormData.get('price'),
        phone: interactiveFormData.get('phone'),
        whatsapp: interactiveFormData.get('whatsapp'),
        state: interactiveFormData.get('state'),
        district: interactiveFormData.get('district'),
        city: interactiveFormData.get('city'),
        pincode: interactiveFormData.get('pincode'),
        youtube_url: interactiveFormData.get('youtube_url'),
        instagram_url: interactiveFormData.get('instagram_url'),
        media_urls: finalizedMediaCollectionUrls,
        performance_urls: performanceUrls.filter(url => url.trim() !== ''),
      };

      // 3. APPLY CHANGE RECORD TO DATABASE
      const { error: databaseUpdateError } = await supabase
        .from('dj_directory')
        .update(updatedDjPayloadValues)
        .eq('id', targetDjProfileId);

      if (databaseUpdateError) throw databaseUpdateError;

      setIsSuccessNotificationVisible(true);
      setIsSubmittingForm(false);
      
      setTimeout(() => {
        applicationNavigationRouter.push('/admin');
      }, 2000);

    } catch (error) {
      console.error("Form updates could not be applied:", error);
      setFormErrorMessage(error.message || "Failed to process profile changes.");
      setIsSubmittingForm(false);
    }
  };

  if (isRetrievingDjProfile) {
    return (
      <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <div className="h-12 w-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-500 font-bold tracking-widest uppercase text-sm">Synchronizing Profile Data...</p>
      </div>
    );
  }

  // Video URL Parser Helper
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

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 relative min-h-screen font-sans text-slate-50">
      
      {/* GLOSSY BACKGROUND CORE LIGHTING */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none z-0 mix-blend-overlay"></div>

      {/* Header View Controller */}
      <div className="flex items-center gap-4 mb-10 pt-8 relative z-10">
        <Link href="/admin" className="p-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 border-t-slate-400/30 hover:border-cyan-500/50 rounded-2xl text-slate-300 hover:text-cyan-400 transition-all shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)] group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          <ArrowLeft className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform relative z-10" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-xl">Edit DJ Record</h1>
          <p className="text-cyan-100/50 text-sm font-medium mt-1">Configuring adjustments for: <strong className="text-cyan-300">{activeDjProfile.dj_name}</strong></p>
        </div>
      </div>

      {formErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-2xl mb-6 relative z-10 backdrop-blur-md shadow-lg">
          <strong className="font-bold">System Alert:</strong> {formErrorMessage}
        </div>
      )}

      {isSuccessNotificationVisible && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-6 py-4 rounded-2xl mb-6 relative z-10 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="h-6 w-6" />
          <p><strong className="font-bold">Record Modified!</strong> All details and media files have been re-indexed. Syncing...</p>
        </div>
      )}

      <form onSubmit={handleUpdateFormSubmit} className="space-y-8 relative z-10">
        
        {/* SECTION 1: CORE DATA CONFIGURATIONS */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
              <Speaker className="h-5 w-5 text-cyan-400" />
            </div>
            DJ Identity Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">DJ Name</label>
              <input type="text" name="dj_name" required defaultValue={activeDjProfile.dj_name} className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Hardware Specs</label>
              <textarea rows="2" name="specs" defaultValue={activeDjProfile.specs} className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] resize-none"></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Price per Event (₹)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input type="number" name="price" required defaultValue={activeDjProfile.price} className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl pl-10 pr-5 py-4 text-white outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: COMMUNICATIONS MAP */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30 shadow-inner">
              <Phone className="h-5 w-5 text-emerald-400" />
            </div>
            Contact Lines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Phone</label>
              <input type="tel" name="phone" required defaultValue={activeDjProfile.phone} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-emerald-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp / Alt Number</label>
              <input type="tel" name="whatsapp" defaultValue={activeDjProfile.whatsapp} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-emerald-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* SECTION 3: REGIONAL ACCREDITATION */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
             <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/30 shadow-inner">
              <MapPin className="h-5 w-5 text-blue-400" />
            </div>
            DJ Location Deployment Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">State</label>
              <input type="text" name="state" required defaultValue={activeDjProfile.state} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">District</label>
              <input type="text" name="district" required defaultValue={activeDjProfile.district} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">City</label>
              <input type="text" name="city" required defaultValue={activeDjProfile.city} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Pincode</label>
              <input type="text" name="pincode" required defaultValue={activeDjProfile.pincode} className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* SECTION 4: SOCIAL MEDIA PROFILE LINKS */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-purple-500/15 rounded-xl border border-purple-500/30 shadow-inner">
              <LinkIcon className="h-5 w-5 text-purple-400" />
            </div>
            Social Media Profile Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">YouTube Profile URL</label>
              <input type="url" name="youtube_url" defaultValue={activeDjProfile.youtube_url} placeholder="https://youtube.com/c/YourChannel" className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-purple-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-purple-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Instagram Profile URL</label>
              <input type="url" name="instagram_url" defaultValue={activeDjProfile.instagram_url} placeholder="https://instagram.com/YourUsername" className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-purple-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-purple-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* SECTION 5: LIVE PERFORMANCE VIDEO EMBEDS (MULTIPLE) */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-cyan-500/30 border-t-cyan-400/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-cyan-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
              <MonitorPlay className="h-5 w-5 text-cyan-400" />
            </div>
            Live Performance Video Embeds
          </h2>
          <p className="text-cyan-100/50 text-xs font-semibold mb-6 ml-1 relative z-10">Add URLs of live performance videos, YouTube Shorts, or Instagram Reels. Our system automatically embeds them in horizontal/vertical players.</p>

          <div className="space-y-4 relative z-10 mb-6">
            {performanceUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-3">
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => handlePerformanceUrlChange(index, e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or YouTube Shorts, or Instagram Reels"
                  className="flex-grow bg-slate-950/60 border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] text-sm"
                />
                <button
                  type="button"
                  onClick={() => removePerformanceUrlInput(index)}
                  className="p-4 bg-red-600/20 hover:bg-red-600/80 border border-red-500/30 hover:border-red-500 rounded-xl text-red-400 hover:text-white transition-all cursor-pointer shadow-md flex-shrink-0 flex items-center justify-center"
                  title="Remove Link"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addPerformanceUrlInput}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" /> Add Performance Video
            </button>
          </div>

          {/* Real-time Videos Preview Container */}
          {performanceUrls.some(url => parseVideoUrl(url)) && (
            <div className="mt-8 border-t border-slate-800/80 pt-6 relative z-10">
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Live Performance Feeds Preview</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {performanceUrls.map((url, idx) => {
                  const parsed = parseVideoUrl(url);
                  if (!parsed) return null;
                  return (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center shadow-inner relative group/preview">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Clip #{idx + 1} ({parsed.label})</span>
                      {parsed.orientation === 'vertical' ? (
                        <div className="w-full max-w-[140px] relative rounded-2xl overflow-hidden border-2 border-slate-800 aspect-[9/16] bg-slate-950 shadow-lg">
                          <iframe src={parsed.embedUrl} className="w-full h-full border-0" allowFullScreen></iframe>
                        </div>
                      ) : (
                        <div className="w-full relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 shadow-lg">
                          <iframe src={parsed.embedUrl} className="w-full h-full border-0" allowFullScreen></iframe>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: LIVE MEDIA MANAGER (THE PHOTO & VIDEO RE-ARCHITECT PIECE) */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-pink-500/30 border-t-pink-400/40 rounded-[2rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-pink-500/15 rounded-xl border border-pink-500/30 shadow-inner">
              <UploadCloud className="h-5 w-5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
            </div>
            Media Asset Pipeline Manager
          </h2>

          {/* Sub-Section A: Active Live Gallery (Delete Old Assets) */}
          {retainedMediaUrlsFromDatabase.length > 0 && (
            <div className="relative z-10 mb-8">
              <h3 className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-3 ml-1">Currently Stored in Database</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
                {retainedMediaUrlsFromDatabase.map((uploadedMediaUrl, currentUrlIndex) => (
                  <div key={uploadedMediaUrl} className="relative aspect-video rounded-xl overflow-hidden group/thumb border border-slate-700/50 shadow-md bg-slate-900">
                    <img src={uploadedMediaUrl} alt="DJ Promo asset" className="w-full h-full object-cover opacity-70 group-hover/thumb:opacity-90 transition-opacity" />
                    <button 
                      type="button" 
                      onClick={() => handleDeleteExistingMediaUrl(currentUrlIndex)}
                      className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 border border-red-500 rounded-lg text-white opacity-0 group-hover/thumb:opacity-100 transition-all shadow-md transform translate-y-[-2px] hover:scale-105"
                      title="De-index media asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Section B: Upload Input (Add New Assets) */}
          <label className="relative z-10 w-full border-2 border-dashed border-pink-500/40 hover:border-pink-500/80 bg-slate-950/60 rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-950/80 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] group/dropzone">
            <input type="file" multiple accept="image/*,video/mp4" onChange={handleFreshMediaSelection} className="hidden" />
            <div className="h-14 w-14 bg-pink-500/10 rounded-full flex items-center justify-center mb-3 border border-pink-500/20 group-hover/dropzone:scale-110 transition-transform">
              <UploadCloud className="h-6 w-6 text-pink-400" />
            </div>
            <p className="text-white font-black text-lg mb-1">Queue New Media Additions</p>
            <p className="text-slate-400 text-xs font-medium">Inject new photos/videos alongside current library files</p>
          </label>

          {/* Sub-Section C: Pending Queue Preview */}
          {newlySelectedMediaFiles.length > 0 && (
            <div className="relative z-10 mt-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Files Scheduled for Upload ({newlySelectedMediaFiles.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newlySelectedMediaFiles.map((pendingMediaFile, currentPendingFileIndex) => (
                  <div key={currentPendingFileIndex} className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileImage className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-300 truncate">{pendingMediaFile.name}</span>
                    </div>
                    <button type="button" onClick={() => handleRemovePendingMediaFile(currentPendingFileIndex)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CONTROLLER ACTION: COMMIT CONFIGURATIONS */}
        <div className="flex justify-end pt-6 pb-12 relative z-10">
          <button 
            type="submit" 
            disabled={isSubmittingForm || isSuccessNotificationVisible}
            className="group relative px-12 py-5 rounded-2xl font-black text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_20px_40px_-10px_rgba(6,182,212,0.6)] overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
            <div className="absolute inset-[1px] rounded-[15px] border border-white/25 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center gap-3 drop-shadow-lg">
              {isSubmittingForm ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Committing Record Modifications...
                </>
              ) : isSuccessNotificationVisible ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-white" /> Variations Cached!
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6 text-white" /> Save Changes
                </>
              )}
            </div>
          </button>
        </div>

      </form>
    </div>
  );
}