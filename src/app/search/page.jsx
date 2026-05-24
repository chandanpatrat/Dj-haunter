'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ArrowLeft, Filter, CheckCircle2, Frown } from 'lucide-react';
import { supabase } from '@/utils/supabase';

function SearchResultsDataFetcher() {
  const activeSearchParams = useSearchParams();
  const applicationNavigationRouter = useRouter();
  
  const userSearchQueryTerm = activeSearchParams.get('q');
  const userLatitudeCoordinates = activeSearchParams.get('lat');
  const userLongitudeCoordinates = activeSearchParams.get('lng');

  const [retrievedDjResults, setRetrievedDjResults] = useState([]);
  const [isSearchEngineLoading, setIsSearchEngineLoading] = useState(true);

  useEffect(() => {
    async function executeDatabaseSearch() {
      setIsSearchEngineLoading(true);
      
      try {
        let databaseSearchQuery = supabase.from('dj_directory').select('*');

        if (userSearchQueryTerm) {
          databaseSearchQuery = databaseSearchQuery.or(`dj_name.ilike.%${userSearchQueryTerm}%,city.ilike.%${userSearchQueryTerm}%,district.ilike.%${userSearchQueryTerm}%`);
        }

        const { data: fetchedSearchResults, error: databaseSearchError } = await databaseSearchQuery;
        
        if (databaseSearchError) throw databaseSearchError;
        setRetrievedDjResults(fetchedSearchResults || []);
      } catch (error) {
        console.error("Critical error executing search query:", error);
      } finally {
        setIsSearchEngineLoading(false);
      }
    }

    executeDatabaseSearch();
  }, [userSearchQueryTerm, userLatitudeCoordinates, userLongitudeCoordinates]);

  return (
    <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-20">
      
      {/* Search Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-slate-900/40 backdrop-blur-xl border border-slate-700/60 border-t-slate-400/30 p-6 rounded-3xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => applicationNavigationRouter.push('/')} className="p-3 bg-slate-950/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-colors text-cyan-400 group">
            <ArrowLeft className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {userSearchQueryTerm ? `Search results for "${userSearchQueryTerm}"` : 
               userLatitudeCoordinates && userLongitudeCoordinates ? `DJs Near Your Location` : 
               'All DJs in Directory'}
            </h1>
            <p className="text-cyan-100/50 text-sm font-medium mt-1">
              {isSearchEngineLoading ? 'Scanning network database...' : `Found ${retrievedDjResults.length} matching setups.`}
            </p>
          </div>
        </div>

        <button className="relative z-10 flex items-center gap-2 px-6 py-3 bg-slate-950/60 border border-slate-700 hover:border-cyan-500/50 text-slate-300 rounded-xl font-bold text-sm transition-all shadow-inner">
          <Filter className="h-4 w-4 text-cyan-400" /> Filter Results
        </button>
      </div>

      {/* Loading State */}
      {isSearchEngineLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Searching Network...</p>
        </div>
      )}

      {/* Empty State (No Results) */}
      {!isSearchEngineLoading && retrievedDjResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-slate-800 border-dashed">
          <Frown className="h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-2xl font-black text-white mb-2">No Setups Found</h3>
          <p className="text-slate-400 text-center max-w-md">We couldn't locate any matching profiles for "{userSearchQueryTerm}". Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Real Database Results Grid (FULL CARD UX UPGRADE) */}
      {!isSearchEngineLoading && retrievedDjResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {retrievedDjResults.map((djProfileData) => (
            
            <Link 
              href={`/dj/${djProfileData.id}`} 
              key={djProfileData.id} 
              className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/60 border-t-slate-300/40 rounded-[2rem] overflow-hidden group transition-all duration-300 hover:border-cyan-500/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,1)] hover:shadow-[0_30px_50px_-15px_rgba(6,182,212,0.3)] hover:-translate-y-2 relative flex flex-col cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"></div>
              
              {/* Image Area */}
              <div className="h-48 bg-slate-950 relative w-full overflow-hidden">
                {djProfileData.media_urls && djProfileData.media_urls.length > 0 && (
                  <img 
                    src={djProfileData.media_urls[0]} 
                    alt={djProfileData.dj_name} 
                    className="object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 z-20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </div>
                
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 text-slate-200 text-sm font-bold drop-shadow-md">
                  <MapPin className="h-4 w-4 text-cyan-400" /> {djProfileData.city}, {djProfileData.district}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 relative z-10 flex flex-col flex-grow">
                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-2 truncate">
                  {djProfileData.dj_name}
                </h3>
                <p className="text-sm font-medium text-slate-400 mb-6 line-clamp-2 flex-grow">
                  {djProfileData.specs}
                </p>
                
                <div className="flex justify-between items-center pt-5 border-t border-slate-800 mt-auto">
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    ₹{djProfileData.price}
                  </span>
                  
                  <span className="text-xs font-bold text-slate-500 group-hover:text-cyan-400 flex items-center gap-1 transition-colors">
                    View Profile <ArrowLeft className="h-4 w-4 rotate-180" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-50 font-sans relative selection:bg-cyan-500/30">
      
      {/* AMBIENT COOL BACKGROUND */}
      <div className="fixed top-20 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-10 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-slate-950/40 pointer-events-none z-0 mix-blend-overlay"></div>

      {/* Nav for Search Page */}
      <nav className="relative z-50 flex items-center py-6 px-4 sm:px-6 lg:px-12 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <Link href="/" className="font-black text-2xl tracking-tighter text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
          <span className="bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 px-2 py-1 rounded-lg">DH</span>
          DJ HAUNTER
        </Link>
      </nav>

      {/* The Results wrapper */}
      <Suspense fallback={
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="h-12 w-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-500 font-bold tracking-widest uppercase">Initializing Search Engine...</p>
        </div>
      }>
        <SearchResultsDataFetcher />
      </Suspense>

    </div>
  );
}