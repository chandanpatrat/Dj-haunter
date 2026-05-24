import Link from 'next/link';
import { Search, Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand Logo - Left */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <span className="text-white font-black text-xl tracking-tighter">DH</span>
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-slate-400 hidden sm:block">
                DJ HAUNTER
              </span>
            </Link>
          </div>

          {/* Center Search Bar - NEW */}
          <div className="flex-1 max-w-xl mx-4 sm:mx-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search DJs, cities, or setups..." 
                className="w-full bg-slate-900 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Action Buttons - Right */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/admin" 
              className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
            >
              Partner Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="p-2 text-slate-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}