'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Link as LinkIcon, Speaker, Zap, Phone, UploadCloud, FileImage, X, CheckCircle2, Plus, Trash2, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function AddNewDJ() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false); // NEW: Success state
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg(false);

    const formData = new FormData(e.target);

    try {
      let mediaUrls = [];

      // 1. FAST CONCURRENT UPLOADS
      if (selectedFiles.length > 0) {
        // We create an array of "Promises" (upload tasks) that all run at the same time
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('dj_media')
            .upload(uniqueFileName, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('dj_media')
            .getPublicUrl(uniqueFileName);

          return publicUrlData.publicUrl;
        });

        // Wait for ALL files to finish uploading simultaneously
        mediaUrls = await Promise.all(uploadPromises);
      }

      // 2. BUILD THE DATABASE OBJECT
      const newDJ = {
        dj_name: formData.get('dj_name'),
        specs: formData.get('specs'),
        price: 0,
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp'),
        state: formData.get('state'),
        district: formData.get('district'),
        city: formData.get('city'),
        pincode: formData.get('pincode'),
        google_maps_url: formData.get('google_maps_url') || '',
        youtube_url: formData.get('youtube_url'),
        instagram_url: formData.get('instagram_url'),
        media_urls: mediaUrls,
        performance_urls: performanceUrls.filter(url => url.trim() !== ''),
      };

      // 3. SAVE TO DATABASE
      const { error: dbError } = await supabase
        .from('dj_directory')
        .insert([newDJ]);

      if (dbError) throw dbError;

      // 4. SHOW SUCCESS MESSAGE & REDIRECT
      setSuccessMsg(true);
      setLoading(false);
      
      // Wait 2 seconds so you can see the success message, then redirect
      setTimeout(() => {
        router.push('/admin');
      }, 2000);

    } catch (error) {
      console.error("Error during upload/save:", error);
      setErrorMsg(error.message || "Failed to upload DJ data.");
      setLoading(false);
    }
  };

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
      
      {/* AMBIENT BACKGROUND */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none z-0 mix-blend-overlay"></div>

      <div className="flex items-center gap-4 mb-10 pt-8 relative z-10">
        <Link href="/admin" className="p-3 bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 border-t-slate-400/30 hover:border-cyan-500/50 rounded-2xl text-slate-300 hover:text-cyan-400 transition-all shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)] group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
          <ArrowLeft className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform relative z-10" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-xl">Add New DJ</h1>
          <p className="text-cyan-100/50 text-sm font-medium mt-1">Deploy a new DJ to the master directory.</p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-2xl mb-6 relative z-10 backdrop-blur-md shadow-lg flex items-center gap-3">
          <X className="h-5 w-5" />
          <p><strong className="font-bold">Upload Failed:</strong> {errorMsg}</p>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-6 py-4 rounded-2xl mb-6 relative z-10 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="h-6 w-6" />
          <p><strong className="font-bold">Success!</strong> DJ data and media uploaded perfectly. Redirecting to dashboard...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        
        {/* 1. BASIC INFO */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-cyan-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
              <Speaker className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
            </div>
            DJ Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">DJ Name</label>
              <input type="text" name="dj_name" required placeholder="e.g. BASS KA BAAP" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Hardware Specs</label>
              <textarea rows="2" name="specs" placeholder="e.g. 16,000W Sound | Full LED Light Setup" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* 2. CONTACT INFO */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-emerald-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30 shadow-inner">
              <Phone className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            </div>
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Phone</label>
              <input type="tel" name="phone" required placeholder="+91 98765 43210" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-emerald-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp / Alt Number</label>
              <input type="tel" name="whatsapp" placeholder="+91 98765 43210" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-emerald-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* 3. LOCATION INFO */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-blue-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
             <div className="p-2.5 bg-blue-500/15 rounded-xl border border-blue-500/30 shadow-inner">
              <MapPin className="h-5 w-5 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
            </div>
            DJ Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">State</label>
              <input type="text" name="state" required placeholder="Odisha" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">District</label>
              <input type="text" name="district" required placeholder="Khordha" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">City</label>
              <input type="text" name="city" required placeholder="Bhubaneswar" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Pincode</label>
              <input type="text" name="pincode" required placeholder="751001" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Google Maps Location URL (Optional)</label>
              <input type="url" name="google_maps_url" placeholder="https://maps.app.goo.gl/... or https://google.com/maps/..." className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* 4. SOCIAL MEDIA PROFILE LINKS */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-purple-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-purple-500/15 rounded-xl border border-purple-500/30 shadow-inner">
              <LinkIcon className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
            </div>
            Social Media Profile Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">YouTube Profile URL</label>
              <input type="url" name="youtube_url" placeholder="https://youtube.com/c/YourChannel" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-purple-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-purple-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Instagram Profile URL</label>
              <input type="url" name="instagram_url" placeholder="https://instagram.com/YourUsername" className="w-full bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-purple-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-purple-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        {/* 5. LIVE PERFORMANCE VIDEO EMBEDS (MULTIPLE) */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-cyan-500/30 border-t-cyan-400/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-cyan-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-500/30 shadow-inner">
              <MonitorPlay className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
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
                  className="flex-grow bg-slate-950/60 backdrop-blur-md border border-slate-700/50 focus:border-cyan-500 rounded-xl px-5 py-4 text-white placeholder-slate-500 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] text-sm"
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

        {/* 5. UPLOAD MEDIA */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] transition-all hover:border-pink-500/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-pink-500/15 rounded-xl border border-pink-500/30 shadow-inner">
              <UploadCloud className="h-5 w-5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
            </div>
            Upload Images & Videos
          </h2>
          
          <label className="relative z-10 w-full border-2 border-dashed border-pink-500/40 hover:border-pink-500/80 bg-slate-950/60 rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-950/80 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] group/upload">
            <input 
              type="file" 
              multiple 
              accept="image/*,video/mp4" 
              onChange={handleFileChange}
              className="hidden" 
            />
            <div className="h-16 w-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 border border-pink-500/20 group-hover/upload:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-white font-black text-xl mb-2">Click to Browse Media</p>
            <p className="text-slate-400 text-sm font-medium mb-1">Select multiple files at once</p>
            <p className="text-pink-500/60 text-xs font-bold uppercase tracking-widest mt-4">Supports: JPG, PNG, MP4</p>
          </label>

          {selectedFiles.length > 0 && (
            <div className="relative z-10 mt-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ready for Upload ({selectedFiles.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileImage className="h-5 w-5 text-pink-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-300 truncate">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-6 pb-12 relative z-10">
          <button 
            type="submit" 
            disabled={loading || successMsg}
            className="group relative px-12 py-5 rounded-2xl font-black text-lg text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-[0_20px_40px_-10px_rgba(6,182,212,0.6)] overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none"></div>
            <div className="absolute inset-[1px] rounded-[15px] border border-white/25 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center gap-3 drop-shadow-lg">
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Uploading Fast...
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-white" /> Success!
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6 text-white" /> Publish DJ to Network
                </>
              )}
            </div>
          </button>
        </div>

      </form>
    </div>
  );
}