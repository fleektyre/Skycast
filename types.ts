
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface WeatherData {
  text: string;
  groundingChunks: GroundingChunk[];
  location: string;
  timestamp: number;
  condition: string; // e.g., 'clear', 'clouds', 'rain', 'snow', 'thunderstorm', 'mist'
  temperature: string;
  localTime: string;
  uvIndex?: string;
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}
