import React, { useState, useEffect, useCallback } from 'react';
import { fetchWeather } from './services/geminiService';
import { WeatherState } from './types';
import { WeatherCard } from './components/WeatherCard';

const BACKGROUNDS: Record<string, string> = {
  clear: "https://images.unsplash.com/photo-1506126279646-a697353d3166?auto=format&fit=crop&w=2400&q=90",
  clouds: "https://images.unsplash.com/photo-1534088568595-a066f7104211?auto=format&fit=crop&w=2400&q=90",
  rain: "https://images.unsplash.com/photo-1519692938311-58ba5324884b?auto=format&fit=crop&w=2400&q=90",
  snow: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=2400&q=90",
  thunderstorm: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=2400&q=90",
  mist: "https://images.unsplash.com/photo-1485236715598-c32463e00fd8?auto=format&fit=crop&w=2400&q=90",
  default: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=90"
};

const OVERLAYS: Record<string, string> = {
  clear: "from-blue-500/10 via-transparent to-orange-500/10",
  clouds: "from-slate-400/10 via-transparent to-blue-900/20",
  rain: "from-indigo-900/40 via-transparent to-slate-900/50",
  snow: "from-blue-100/10 via-transparent to-slate-400/20",
  thunderstorm: "from-purple-900/40 via-transparent to-black/60",
  mist: "from-slate-500/20 via-transparent to-slate-700/30",
  default: "from-black/40 via-transparent to-black/60"
};

const MAX_HISTORY = 5;
const HISTORY_KEY = 'skycast_search_history';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [weather, setWeather] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
  });

  const [bgImage, setBgImage] = useState(BACKGROUNDS.default);
  const [prevBgImage, setPrevBgImage] = useState(BACKGROUNDS.default);
  const [currentCondition, setCurrentCondition] = useState('default');
  const [fadeOpacity, setFadeOpacity] = useState(1);

  const apiKeyMissing = !import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_KEY === "undefined";

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const loc = params.get('loc');
    if (loc) {
      setQuery(loc);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const addToHistory = useCallback((location: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== location.toLowerCase());
      const newHistory = [location, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const handleFetchWeather = useCallback(async (location: string) => {
    if (!location.trim()) {
      setWeather({ data: null, loading: false, error: null });
      return;
    }

    setWeather(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchWeather(location);
      setWeather({ data, loading: false, error: null });

      addToHistory(data.location);

      const newBg = BACKGROUNDS[data.condition] || BACKGROUNDS.default;

      // Always update the condition (for overlays)
      setCurrentCondition(data.condition);

      if (newBg !== bgImage) {
        const img = new Image();
        img.src = newBg;
        img.onload = () => {
          setPrevBgImage(bgImage);
          setBgImage(newBg);
          setFadeOpacity(0);

          setTimeout(() => {
            setFadeOpacity(1);
          }, 50);
        };
      }
    } catch (err: any) {
      console.error("App: Weather fetch failed", err);
      setWeather({
        data: null,
        loading: false,
        error: err.message || "Something went wrong. Please check your API key and connection."
      });
    }
  }, [bgImage, addToHistory]);

  useEffect(() => {
    if (debouncedQuery && !apiKeyMissing) {
      handleFetchWeather(debouncedQuery);
    }
  }, [debouncedQuery, handleFetchWeather, apiKeyMissing]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWeather(prev => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setWeather(prev => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleFetchWeather(`${latitude}, ${longitude}`);
      },
      (err) => {
        console.warn("Geolocation denied", err);
        setWeather(prev => ({ ...prev, loading: false, error: "Unable to retrieve your location. Check browser permissions." }));
      }
    );
  };

  const handleRetry = () => {
    if (debouncedQuery) {
      handleFetchWeather(debouncedQuery);
    }
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans bg-black">
      <div
        className="absolute inset-0 z-0 animate-ken-burns"
        style={{
          backgroundImage: `url("${prevBgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
        }}
      />

      <div
        className="absolute inset-0 z-[1] transition-opacity duration-[1500ms] ease-in-out animate-ken-burns"
        style={{
          backgroundImage: `url("${bgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
          opacity: fadeOpacity
        }}
      />

      <div className={`absolute inset-0 z-10 transition-colors duration-[1500ms] bg-gradient-to-br ${OVERLAYS[currentCondition] || OVERLAYS.default}`} />

      <main className="relative z-20 container mx-auto px-4 py-16 flex flex-col items-center min-h-screen">
        <header className="text-center mb-12 animate-fade-slide-up">
          <div className="flex items-center justify-center gap-2 mb-4 group cursor-default">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <svg className="w-9 h-9 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tighter mb-3 drop-shadow-2xl">
            SkyCast
          </h1>
          <p className="text-white/90 text-xl font-light max-w-md mx-auto drop-shadow-lg tracking-wide">
            Real-time weather intelligence.
          </p>
        </header>

        {apiKeyMissing && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-sm animate-fade-slide-up text-center">
            ⚠️ <strong>Configuration Required:</strong> If you're seeing this on GitHub Pages, add your <code>API_KEY</code> to GitHub Repository Secrets and ensure the deployment workflow completes.
          </div>
        )}

        <div className="w-full max-w-xl mb-12 group animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a city..."
              disabled={apiKeyMissing && !debouncedQuery}
              className="w-full glass-panel focus:bg-white/15 rounded-[2rem] py-6 px-8 pl-16 text-white text-2xl placeholder-white/40 focus:outline-none shadow-2xl transition-all duration-500 focus:ring-4 focus:ring-white/10 disabled:opacity-50"
            />
            <div className="absolute left-6 text-white/40 group-focus-within:text-white/80 transition-all duration-300 scale-110">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-20 p-2 text-white/40 hover:text-white transition-all hover:scale-125"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={useCurrentLocation}
              title="Use current location"
              disabled={apiKeyMissing}
              className="absolute right-6 p-3 bg-white/10 hover:bg-white/30 rounded-2xl text-white transition-all active:scale-90 hover:shadow-lg hover:shadow-white/5 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="w-full flex justify-center mb-16">
          <WeatherCard
            data={weather.data}
            loading={weather.loading}
            error={weather.error}
            onRetry={handleRetry}
          />
        </div>

        {!weather.data && !weather.loading && !weather.error && (
          <div className="text-center mt-auto animate-fade-slide-up w-full max-w-4xl" style={{ animationDelay: '200ms' }}>
            {history.length > 0 ? (
              <div className="mb-12">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <p className="text-white/40 text-sm font-medium uppercase tracking-[0.3em]">Recent Searches</p>
                  <button
                    onClick={clearHistory}
                    className="text-white/20 hover:text-red-400/60 text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {history.map(loc => (
                    <button
                      key={loc}
                      onClick={() => setQuery(loc)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white/90 hover:text-white text-base transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 backdrop-blur-md"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-12">
                <p className="text-white/40 text-sm mb-6 font-medium uppercase tracking-[0.3em]">Popular Locations</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {['London', 'Tokyo', 'New York', 'Paris', 'Dubai'].map(city => (
                    <button
                      key={city}
                      onClick={() => setQuery(city)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-2xl text-white/80 hover:text-white text-base transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;