import React from 'react';
import { HeartPulse, PlusCircle, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'map' | 'sos' | 'register' | 'compatibility';
  setActiveTab: (tab: 'search' | 'map' | 'sos' | 'register' | 'compatibility') => void;
  onOpenSOS: () => void;
  onOpenRegister: () => void;
  sosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSOS,
  onOpenRegister,
  sosCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-200">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              Hemo<span className="text-red-600">Link</span>
            </span>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('search')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'search'
                  ? 'text-red-600 font-semibold border-b-2 border-red-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Find Donors
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'map'
                  ? 'text-red-600 font-semibold border-b-2 border-red-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setActiveTab('sos')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'sos'
                  ? 'text-red-600 font-semibold border-b-2 border-red-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Emergency Requests
              {sosCount > 0 && (
                <span className="text-[11px] font-mono bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                  {sosCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('compatibility')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'compatibility'
                  ? 'text-red-600 font-semibold border-b-2 border-red-600'
                  : 'hover:text-slate-900'
              }`}
            >
              Compatibility Guide
            </button>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenRegister}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-slate-500" />
              Register as Donor
            </button>
            <button
              onClick={onOpenSOS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-md transition-all shadow-sm shadow-red-200 whitespace-nowrap"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency SOS
            </button>
          </div>
        </div>

        {/* Mobile nav bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 py-2 text-xs font-medium text-slate-600 overflow-x-auto no-scrollbar gap-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`whitespace-nowrap pb-1 ${activeTab === 'search' ? 'text-red-600 font-bold' : ''}`}
          >
            Find Donors
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap pb-1 ${activeTab === 'map' ? 'text-red-600 font-bold' : ''}`}
          >
            Map View
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`whitespace-nowrap pb-1 ${activeTab === 'sos' ? 'text-red-600 font-bold' : ''}`}
          >
            SOS Requests ({sosCount})
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`whitespace-nowrap pb-1 ${activeTab === 'compatibility' ? 'text-red-600 font-bold' : ''}`}
          >
            Blood Match
          </button>
          <button
            onClick={onOpenRegister}
            className="whitespace-nowrap pb-1 text-slate-800 font-semibold"
          >
            + Register
          </button>
        </div>
      </div>
    </header>
  );
};
