
import React, { useState } from 'react';
import { WeatherData } from '../types';
import { GroundingLinks } from './GroundingLinks';

interface WeatherCardProps {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ data, loading, error, onRetry }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  const handleShare = async () => {
    if (!data) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?loc=${encodeURIComponent(data.location)}`;
    const shareText = `Weather in ${data.location}: ${data.temperature}. UV ${data.uvIndex}. Time: ${data.localTime}. Check it out on SkyCast!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Weather in ${data.location} | SkyCast`,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        console.error("Failed to copy link", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="flex justify-between items-start mb-8 animate-pulse">
          <div className="space-y-3 w-2/3">
            <div className="h-12 bg-white/20 rounded-lg w-3/4"></div>
            <div className="h-6 bg-white/10 rounded-md w-1/2"></div>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl"></div>
        </div>
        <div className="space-y-4 mb-8 animate-pulse">
          <div className="h-4 bg-white/15 rounded-md w-full"></div>
          <div className="h-4 bg-white/15 rounded-md w-[92%]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isLocationError = error.toLowerCase().includes("location not found");
    const isQuotaError = error.toLowerCase().includes("limit reached");
    
    let errorTitle = "Weather Update Failed";
    let icon = (
      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

    if (isLocationError) {
      errorTitle = "Location Not Found";
      icon = (
        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 11V7m0 8h.01" />
        </svg>
      );
    } else if (isQuotaError) {
      errorTitle = "System Busy";
      icon = (
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-white shadow-xl animate-fade-slide-up flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLocationError ? 'bg-amber-500/20' : isQuotaError ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{errorTitle}</h3>
        <p className="text-white/60 mb-6 max-w-xs">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all active:scale-95 group">
            <span className="font-medium">Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div key={data.timestamp} className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl transition-all duration-500 hover:bg-white/15 animate-fade-slide-up relative group/card">
      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-medium text-white/60 tracking-wider uppercase mb-1">{data.location}</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-sm">
              {data.temperature}
            </span>
            <div className="flex flex-col">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Local Time</span>
              <span className="text-white/80 font-semibold text-lg tracking-tight">
                {data.localTime}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleShare}
          className={`p-3 rounded-2xl border transition-all duration-300 backdrop-blur-md active:scale-95 ${
            shareStatus === 'idle' 
              ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/15 hover:scale-110' 
              : 'bg-green-500/20 border-green-500/40 text-green-300'
          }`}
          title="Share Weather"
        >
          {shareStatus === 'idle' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse bg-green-400`} />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Live Conditions</span>
        </div>
        
        {data.uvIndex && data.uvIndex !== '--' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 3.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 10a1 1 0 011 1h1a1 1 0 110 2h-1a1 1 0 110-2zm-2.343 4.243a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.243a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM3 10a1 1 0 011-1H4a1 1 0 110 2H4a1 1 0 01-1-1zm3.05-4.243a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{data.uvIndex}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
      
      {/* Detailed Report */}
      <div className="prose prose-invert max-w-none text-white/80 leading-relaxed mb-6 whitespace-pre-line text-base font-light">
        {data.text}
      </div>

      <GroundingLinks chunks={data.groundingChunks} />
    </div>
  );
};
