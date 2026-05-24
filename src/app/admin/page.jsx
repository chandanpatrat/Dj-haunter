'use client';

import { useState, useEffect } from 'react';
import { Plus, Database, MapPin, Users, Settings, ShieldCheck, Home, Zap, Speaker, Trash2, Edit, Flame, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function AdminDashboard() {
  const [djs, setDjs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalDjs: 0, uniqueCities: 0 });
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dj_directory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDjs(data);
        const uniqueCitySet = new Set(data.map(dj => dj.city));
        setStats({
          totalDjs: data.length,
          uniqueCities: uniqueCitySet.size
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTrending = async (id, name, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('dj_directory')
        .update({ is_trending: newStatus })
        .eq('id', id);

      if (error) throw error;

      setActionMessage(`${name} is ${newStatus ? 'now marked as TRENDING!' : 'removed from trending.'}`);
      setTimeout(() => setActionMessage(null), 4000); 
      
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating trending status:", error);
      alert("Failed to update trending status. Make sure you ran the SQL command!");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
      try {
        const { error } = await supabase
          .from('dj_directory')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setActionMessage(`Successfully deleted ${name} from the database.`);
        setTimeout(() => setActionMessage(null), 4000);
        
        fetchDashboardData();
      } catch (error) {
        console.error("Error deleting DJ:", error);
        alert("Failed to delete. Make sure you ran the SQL command!");
      }
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 font-sans relative selection:bg-cyan-500/30 overflow-hidden">
      
      {/* VIBRANT NEON BACKGROUND ORBS */}
      <div className="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-cyan-500/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none z-0 mix-blend-overlay"></div>

      {/* FLOATING ACTION NOTIFICATION BANNER (FIXED POSITION) */}
      {actionMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/50 text-emerald-400 px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="h-6 w-6 drop-shadow-[0_0_5px_currentColor]" />
          <p className="whitespace-nowrap"><strong className="font-bold text-white">System Update:</strong> {actionMessage}</p>
        </div>
      )}

      {/* DEDICATED ADMIN NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between py-5 px-4 sm:px-6 lg:px-12 border-b border-slate-700/60 bg-slate-900/50 backdrop-blur-2xl shadow-[0_4px_30px_rgba(6,182,212,0.15)]">
        <Link href="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
          <span className="bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 px-2 py-1 rounded-lg">DH</span>
          DJ HAUNTER
        </Link>
        <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
          <Home className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" /> 
          <span className="hidden sm:inline">Back to Website</span>
        </Link>
      </nav>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 relative z-10">
        
        {/* Admin Profile Overview */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/30 border-t-cyan-400/50 rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-6 z-10">
            <div className="h-20 w-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl p-[2px] shadow-[0_0_25px_rgba(6,182,212,0.6)]">
              <div className="h-full w-full bg-slate-950/90 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">Chandan Patra</h1>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 text-xs uppercase font-black px-3 py-1 rounded-md">Master Admin</span>
              </div>
              <p className="text-cyan-100/60 text-sm font-bold tracking-wide">Lead Developer & System Architect</p>
            </div>
          </div>
          
          <Link href="/admin/add-dj" className="z-10 group relative px-8 py-4 rounded-2xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center gap-3 overflow-hidden border border-cyan-400/50">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-2 drop-shadow-md">
              <Zap className="h-5 w-5 text-white fill-white/50" /> Deploy New DJ
            </div>
          </Link>
        </div>

        {/* LIVE Database Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { title: 'Total DJs Listed', value: isLoading ? '...' : stats.totalDjs, icon: Database, accent: 'cyan' },
            { title: 'Cities Covered', value: isLoading ? '...' : stats.uniqueCities, icon: MapPin, accent: 'blue' },
            { title: 'Platform Status', value: 'Online', icon: Users, accent: 'purple' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-slate-900/60 backdrop-blur-2xl border border-${stat.accent}-500/30 border-t-white/10 rounded-3xl p-6 flex items-center justify-between shadow-[0_0_25px_-5px_rgba(0,0,0,0.5)] relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-2">{stat.title}</h3>
                <p className={`text-3xl font-black text-${stat.accent}-400 drop-shadow-[0_0_10px_currentColor]`}>{stat.value}</p>
              </div>
              <div className={`relative z-10 p-4 rounded-2xl border border-${stat.accent}-500/30 bg-${stat.accent}-500/10 shadow-inner`}>
                <stat.icon className={`h-6 w-6 text-${stat.accent}-400 drop-shadow-[0_0_10px_currentColor]`} />
              </div>
            </div>
          ))}
        </div>

        {/* LIVE Directory Table */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/30 border-t-indigo-400/40 rounded-[2rem] p-8 shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 drop-shadow-md">
              <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <Settings className="h-5 w-5 text-indigo-300" />
              </div>
              Master Directory
            </h2>
          </div>
          
          <div className="border border-indigo-500/30 rounded-2xl overflow-hidden overflow-x-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-slate-950/80 relative z-10">
            <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
              <thead className="bg-slate-900/90 backdrop-blur-xl text-indigo-200 font-black uppercase tracking-widest text-xs border-b border-indigo-500/30">
                <tr>
                  <th className="px-6 py-5">DJ Name</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5">Base Price</th>
                  <th className="px-6 py-5 text-center">Visibility</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/20">
                
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center font-bold text-indigo-400 animate-pulse">Syncing with Supabase...</td></tr>
                ) : djs.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center font-bold text-slate-500">Directory is empty. Deploy a new DJ above!</td></tr>
                ) : (
                  djs.map((dj) => (
                    <tr key={dj.id} className="hover:bg-indigo-500/10 transition-colors group/row">
                      <td className="px-6 py-5 font-black text-white flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-900 rounded-xl border border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0">
                          {dj.media_urls && dj.media_urls.length > 0 ? (
                            <img src={dj.media_urls[0]} alt={dj.dj_name} className="w-full h-full object-cover" />
                          ) : (
                            <Speaker className="h-5 w-5 text-indigo-400" />
                          )}
                        </div>
                        {dj.dj_name}
                      </td>
                      <td className="px-6 py-5 font-medium text-indigo-100/70">{dj.city}, {dj.state}</td>
                      <td className="px-6 py-5 font-black text-indigo-300">₹ {dj.price}</td>
                      
                      {/* UPGRADED 2-STATE TRENDING BUTTON */}
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleToggleTrending(dj.id, dj.dj_name, dj.is_trending)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border text-xs font-black uppercase tracking-wider ${
                            dj.is_trending 
                              ? 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                              : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Flame className={`h-4 w-4 ${dj.is_trending ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] fill-orange-400/50' : ''}`} />
                          {dj.is_trending ? 'Trending' : 'Boost'}
                        </button>
                      </td>

                      <td className="px-6 py-5 text-right flex items-center justify-end gap-3 h-full pt-6">
                        <Link 
  href={`/admin/edit-dj/${dj.id}`}
  className="text-xs font-black bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/30 hover:border-cyan-400 p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center" 
  title="Edit"
>
  <Edit className="h-4 w-4" />
</Link>
                        <button 
                          onClick={() => handleDelete(dj.id, dj.dj_name)}
                          className="text-xs font-black bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-400 p-2 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]" 
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}