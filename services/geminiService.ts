import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherData } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;

const weatherCache = new Map<string, WeatherData>();

export const fetchWeather = async (location: string): Promise<WeatherData> => {
  const normalizedLocation = location.trim().toLowerCase();

  // Validate API Key
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("Service unavailable. Please check configuration.");
  }

  // Validate input
  if (!normalizedLocation) {
    throw new Error("Please enter a location.");
  }

  // Check cache
  const cached = weatherCache.get(normalizedLocation);
  if (cached && (Date.now() - cached.timestamp < 10 * 60 * 1000)) { // 10 minutes cache
    return cached;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Search for the CURRENT weather in "${location}" right now. 
      
      Your response MUST be organized exactly like this:
      1. LocationName: [The actual city and country names, e.g., "Abuja, Nigeria" or "London, UK". If coordinates were provided, resolve them to the nearest city.]
      2. Condition: [one word: clear, clouds, rain, snow, thunderstorm, or mist]
      3. Temp: [the temperature in C and F]
      4. Time: [local time in that city]
      5. UV: [UV Index]
      6. Report: [A 2-3 sentence description of current conditions and what to wear]
      
      If the location is invalid, start your response with "ERROR: INVALID_LOCATION".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text.includes("ERROR: INVALID_LOCATION")) {
      throw new Error(`We couldn't find a place matching "${location}". Please try again.`);
    }

    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    // Robust parsing
    const findValue = (key: string) => {
      const line = lines.find((l: string) => l.toLowerCase().includes(key.toLowerCase()));
      return line ? line.split(':')[1]?.trim() || line : null;
    };

    // Extract resolved location name or fall back to input
    const resolvedLocation = findValue('LocationName') || location;

    // Improved condition parsing: check for keywords in the condition value
    const rawConditionValue = findValue('Condition')?.toLowerCase() || 'clouds';
    const validConditions = ['clear', 'clouds', 'rain', 'snow', 'thunderstorm', 'mist'];

    // Map common variations to our valid conditions
    let condition = 'clouds'; // default
    for (const c of validConditions) {
      if (rawConditionValue.includes(c)) {
        condition = c;
        break;
      }
    }

    // Handle specific common variations
    if (rawConditionValue.includes('cloud')) condition = 'clouds';
    if (rawConditionValue.includes('sunny')) condition = 'clear';
    if (rawConditionValue.includes('storm')) condition = 'thunderstorm';
    if (rawConditionValue.includes('fog')) condition = 'mist';

    const temperature = findValue('Temp') || '--°C';
    const localTime = findValue('Time') || new Date().toLocaleTimeString();
    const uvIndex = findValue('UV') || 'Low';

    // The report is usually the last part
    const reportLineIndex = lines.findIndex((l: string) => l.toLowerCase().startsWith('report:'));
    const reportText = reportLineIndex !== -1
      ? lines.slice(reportLineIndex).join(' ').replace(/^report:\s*/i, '')
      : text;

    const groundingChunks: any[] = [];

    const weatherData: WeatherData = {
      text: reportText,
      groundingChunks,
      location: resolvedLocation, // Use the resolved name
      timestamp: Date.now(),
      condition,
      temperature,
      localTime,
      uvIndex,
    };

    weatherCache.set(normalizedLocation, weatherData);
    return weatherData;

  } catch (error: any) {
    console.error("Gemini Service Detail:", error);

    // Friendly error messages
    if (error.message?.includes("API_KEY") || error.message?.includes("403") || error.message?.includes("404")) {
      throw new Error("Weather service is currently unavailable. Please check your network or try again later.");
    }

    if (error.message?.includes("fetch failed") || error.message?.includes("Network")) {
      throw new Error("Network connection issue. Please check your internet.");
    }

    // Pass through custom errors (like invalid location) or generic fallback
    throw new Error(error.message.includes("couldn't find") ? error.message : "Unable to load weather data. Please try again.");
  }
};