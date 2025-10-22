import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { AlertTriangle, Users, FileText, MapPin, CloudRain, Clock, TrendingUp, PieChart as PieChartIcon, Building2, Calendar, Download, Maximize2, FileImage, FileType, Facebook, Phone, Wind, Droplets, CloudRain as Precipitation, Car, Layers, Flame } from "lucide-react";
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveCalendar } from '@nivo/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { ensureOk, getHttpStatusMessage } from "@/lib/utils";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePins } from "@/hooks/usePins";
import { Pin } from "@/types/pin";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, Timestamp } from "firebase/firestore";

// Use the custom Mapbox access token for AcciZard Lucban
mapboxgl.accessToken = 'pk.eyJ1IjoiYWNjaXphcmQtbHVjYmFuIiwiYSI6ImNtY3VhOHdxODAwcjcya3BzYTR2M25kcTEifQ.aBi4Zmkezyqa7Pfh519KbQ';

export function DashboardStats() {
  const { subscribeToPins } = usePins();
  const [totalReportsFilter, setTotalReportsFilter] = useState("this-week");
  const [barangayReportsFilter, setBarangayReportsFilter] = useState("this-week");
  const [usersBarangayFilter, setUsersBarangayFilter] = useState("this-week");
  const [reportTypeFilter, setReportTypeFilter] = useState("this-week");
  const [peakHoursFilter, setPeakHoursFilter] = useState("this-week");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isUsersChartModalOpen, setIsUsersChartModalOpen] = useState(false);
  const [isPieChartModalOpen, setIsPieChartModalOpen] = useState(false);
  const [isPeakHoursModalOpen, setIsPeakHoursModalOpen] = useState(false);
  const [weatherData, setWeatherData] = useState({
    temperature: "28°C",
    temperatureCelsius: 28,
    temperatureFahrenheit: 82,
    condition: "Scattered Thunderstorms",
    humidity: "75%",
    rainfall: "Light",
    precipitation: "35%",
    windSpeed: "11 km/h",
    windDirection: "NE",
    loading: true,
    error: null
  });
  const [weatherOutlook, setWeatherOutlook] = useState([]);
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [pins, setPins] = useState<Pin[]>([]);
  const [mapLayerMode, setMapLayerMode] = useState<'normal' | 'traffic' | 'heatmap'>('normal');
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Hazard colors using brand-orange and brand-red shades
  const hazardColors = useMemo(() => ({
    'Road Crash': '#f97316',      // brand-orange (primary)
    'Fire': '#fb923c',            // brand-orange-400 (lighter)
    'Medical Emergency': '#ea580c', // brand-orange-600 (darker)
    'Flooding': '#991b1b',        // brand-red (primary)
    'Volcanic Activity': '#b91c1c', // brand-red-700 (lighter)
    'Landslide': '#7f1d1d',      // brand-red-900 (darker)
    'Earthquake': '#dc2626',     // red-600 (medium red)
    'Civil Disturbance': '#ef4444', // red-500 (bright red)
    'Armed Conflict': '#c2410c',  // orange-700 (dark orange)
    'Infectious Disease': '#fed7aa' // orange-200 (very light orange)
  }), []);

  // Sample data for visualizations with all 32 barangays
  const reportsPerBarangay = [
    { name: "Abang", reports: 12 },
    { name: "Aliliw", reports: 8 },
    { name: "Atulinao", reports: 15 },
    { name: "Ayuti", reports: 6 },
    { name: "Barangay 1", reports: 10 },
    { name: "Barangay 2", reports: 7 },
    { name: "Barangay 3", reports: 9 },
    { name: "Barangay 4", reports: 11 },
    { name: "Barangay 5", reports: 13 },
    { name: "Barangay 6", reports: 8 },
    { name: "Barangay 7", reports: 14 },
    { name: "Barangay 8", reports: 6 },
    { name: "Barangay 9", reports: 12 },
    { name: "Barangay 10", reports: 9 },
    { name: "Igang", reports: 7 },
    { name: "Kabatete", reports: 11 },
    { name: "Kakawit", reports: 8 },
    { name: "Kalangay", reports: 13 },
    { name: "Kalyaat", reports: 10 },
    { name: "Kilib", reports: 15 },
    { name: "Kulapi", reports: 7 },
    { name: "Mahabang Parang", reports: 12 },
    { name: "Malupak", reports: 9 },
    { name: "Manasa", reports: 11 },
    { name: "May-it", reports: 8 },
    { name: "Nagsinamo", reports: 14 },
    { name: "Nalunao", reports: 10 },
    { name: "Palola", reports: 13 },
    { name: "Piis", reports: 7 },
    { name: "Samil", reports: 12 },
    { name: "Tiawe", reports: 9 },
    { name: "Tinamnan", reports: 11 }
  ];

  // Stacked data for Nivo chart - reports by type per barangay - memoized to prevent re-renders
  const stackedReportsData = useMemo(() => [
    { barangay: "Abang", "Road Crash": 3, "Fire": 2, "Medical Emergency": 1, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 1, "Civil Disturbance": 1 },
    { barangay: "Aliliw", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Atulinao", "Road Crash": 4, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 1, "Civil Disturbance": 1 },
    { barangay: "Ayuti", "Road Crash": 1, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 1", "Road Crash": 3, "Fire": 2, "Medical Emergency": 1, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 2", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 3", "Road Crash": 2, "Fire": 2, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 4", "Road Crash": 3, "Fire": 2, "Medical Emergency": 1, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 5", "Road Crash": 3, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 6", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 7", "Road Crash": 4, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 8", "Road Crash": 1, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 9", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Barangay 10", "Road Crash": 2, "Fire": 2, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Igang", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Kabatete", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Kakawit", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Kalangay", "Road Crash": 3, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Kalyaat", "Road Crash": 3, "Fire": 2, "Medical Emergency": 1, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Kilib", "Road Crash": 4, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 1, "Civil Disturbance": 1 },
    { barangay: "Kulapi", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Mahabang Parang", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Malupak", "Road Crash": 2, "Fire": 2, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Manasa", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "May-it", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Nagsinamo", "Road Crash": 4, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Nalunao", "Road Crash": 3, "Fire": 2, "Medical Emergency": 1, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Palola", "Road Crash": 3, "Fire": 3, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Piis", "Road Crash": 2, "Fire": 1, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 0, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Samil", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 2, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Tiawe", "Road Crash": 2, "Fire": 2, "Medical Emergency": 1, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 },
    { barangay: "Tinamnan", "Road Crash": 3, "Fire": 2, "Medical Emergency": 2, "Flooding": 1, "Volcanic Activity": 1, "Landslide": 1, "Earthquake": 0, "Civil Disturbance": 1 }
  ], []);

  const usersPerBarangay = [
    { name: "Abang", users: 120 },
    { name: "Aliliw", users: 85 },
    { name: "Atulinao", users: 150 },
    { name: "Ayuti", users: 98 },
    { name: "Barangay 1", users: 110 },
    { name: "Barangay 2", users: 95 },
    { name: "Barangay 3", users: 130 },
    { name: "Barangay 4", users: 105 },
    { name: "Barangay 5", users: 125 },
    { name: "Barangay 6", users: 88 },
    { name: "Barangay 7", users: 145 },
    { name: "Barangay 8", users: 92 },
    { name: "Barangay 9", users: 115 },
    { name: "Barangay 10", users: 108 },
    { name: "Igang", users: 78 },
    { name: "Kabatete", users: 135 },
    { name: "Kakawit", users: 95 },
    { name: "Kalangay", users: 140 },
    { name: "Kalyaat", users: 112 },
    { name: "Kilib", users: 155 },
    { name: "Kulapi", users: 82 },
    { name: "Mahabang Parang", users: 128 },
    { name: "Malupak", users: 102 },
    { name: "Manasa", users: 118 },
    { name: "May-it", users: 90 },
    { name: "Nagsinamo", users: 142 },
    { name: "Nalunao", users: 105 },
    { name: "Palola", users: 132 },
    { name: "Piis", users: 88 },
    { name: "Samil", users: 125 },
    { name: "Tiawe", users: 98 },
    { name: "Tinamnan", users: 115 }
  ];

  const reportTypeData = [{
    name: "Road Crash",
    value: 45,
    color: "#FF4F0B"
  }, {
    name: "Fire",
    value: 25,
    color: "#D32F2F"
  }, {
    name: "Flooding",
    value: 20,
    color: "#3b82f6"
  }, {
    name: "Medical Emergency",
    value: 10,
    color: "#22c55e"
  }];
  const peakHoursData = [{
    hour: "6AM",
    reports: 2
  }, {
    hour: "9AM",
    reports: 8
  }, {
    hour: "12PM",
    reports: 15
  }, {
    hour: "3PM",
    reports: 12
  }, {
    hour: "6PM",
    reports: 18
  }, {
    hour: "9PM",
    reports: 10
  }, {
    hour: "12AM",
    reports: 5
  }];

  // Calendar heatmap data for 2025 only
  const generateCalendarData2025 = () => {
    const data = [];
    const startDate = new Date(2025, 0, 1); // January 1, 2025
    const endDate = new Date(2025, 11, 31); // December 31, 2025
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Generate random report counts (0-8) with some realistic patterns
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseCount = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6);
      const extraCount = Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0; // 10% chance of extra activity
      
      data.push({
        day: dateStr,
        value: baseCount + extraCount
      });
    }
    return data;
  };

  const calendarData2025 = generateCalendarData2025();

  // Enhanced Weather API integration (similar to Google Weather)
  const fetchWeatherData = async () => {
    try {
      // You'll need to add your OpenWeatherMap API key to environment variables
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const CITY = "Lucban,PH"; // Lucban, Philippines
      
      console.log("Weather API Debug:", {
        hasApiKey: !!API_KEY,
        apiKeyLength: API_KEY?.length || 0,
        city: CITY
      });
      
      if (!API_KEY) {
        console.warn("OpenWeatherMap API key not found. Using mock data.");
        setWeatherData(prev => ({ 
          ...prev, 
          loading: false,
          temperature: "31°C",  // Updated to match Google's temperature
          temperatureCelsius: 31,
          temperatureFahrenheit: 88,
          condition: "Clear Sky",
          precipitation: "0%",
          windSpeed: "8 km/h",
          windDirection: "NE",
          humidity: "65%"
        }));
        
        // Set fallback weather outlook data
        setWeatherOutlook([{
          day: "Today",
          tempCelsius: 31,
          tempFahrenheit: 88,
          temp: "31°C",
          condition: "Clear Sky",
          icon: "/weather/clear.svg"
        }, {
          day: "Tomorrow",
          tempCelsius: 32,
          tempFahrenheit: 90,
          temp: "32°C",
          condition: "Few Clouds",
          icon: "/weather/few-clouds.svg"
        }, {
          day: "Wednesday",
          tempCelsius: 29,
          tempFahrenheit: 84,
          temp: "29°C",
          condition: "Shower Rain",
          icon: "/weather/shower-rain.svg"
        }, {
          day: "Thursday",
          tempCelsius: 30,
          tempFahrenheit: 86,
          temp: "30°C",
          condition: "Clear Sky",
          icon: "/weather/clear.svg"
        }, {
          day: "Friday",
          tempCelsius: 33,
          tempFahrenheit: 91,
          temp: "33°C",
          condition: "Clear Sky",
          icon: "/weather/clear.svg"
        }]);
        return;
      }

      // Fetch current weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`;
      console.log("Weather API URL:", weatherUrl.replace(API_KEY, "***HIDDEN***"));
      
      const weatherResponse = await fetch(weatherUrl);
      console.log("Weather API Response Status:", weatherResponse.status);
      
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        console.error("Weather API Error Response:", errorText);
        throw new Error(`Weather API Error: ${weatherResponse.status} - ${errorText}`);
      }
      
      const currentWeather = await weatherResponse.json();
      console.log("Weather API Success:", currentWeather);
      console.log("Raw temperature from API:", currentWeather.main?.temp);
      console.log("Raw weather condition:", currentWeather.weather?.[0]?.description);
      
      // Fetch 5-day forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric`;
      console.log("Forecast API URL:", forecastUrl.replace(API_KEY, "***HIDDEN***"));
      
      const forecastResponse = await fetch(forecastUrl);
      console.log("Forecast API Response Status:", forecastResponse.status);
      
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text();
        console.error("Forecast API Error Response:", errorText);
        throw new Error(`Forecast API Error: ${forecastResponse.status} - ${errorText}`);
      }
      
      const forecast = await forecastResponse.json();
      console.log("Forecast API Success:", forecast);
      console.log("Forecast list length:", forecast.list?.length);
      console.log("First forecast item:", forecast.list?.[0]);
      
      // Helper function to convert wind direction from degrees to compass direction
      const getWindDirection = (degrees) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
      };

      // Helper function to get weather interpretation
      const getWeatherInterpretation = (weatherCode, description) => {
        const code = weatherCode;
        const desc = description.toLowerCase();
        
        // Weather interpretations based on OpenWeatherMap codes and descriptions
        if (code >= 200 && code < 300) return "Thunderstorm";
        if (code >= 300 && code < 400) return "Drizzle";
        if (code >= 500 && code < 600) {
          if (desc.includes('heavy')) return "Heavy Rain";
          if (desc.includes('moderate')) return "Moderate Rain";
          if (desc.includes('light')) return "Light Rain";
          return "Rain";
        }
        if (code >= 600 && code < 700) return "Snow";
        if (code >= 700 && code < 800) {
          if (desc.includes('mist')) return "Mist";
          if (desc.includes('fog')) return "Fog";
          if (desc.includes('haze')) return "Haze";
          return "Atmospheric";
        }
        if (code === 800) return "Clear Sky";
        if (code === 801) return "Few Clouds";
        if (code === 802) return "Scattered Clouds";
        if (code === 803) return "Broken Clouds";
        if (code === 804) return "Overcast";
        
        // Fallback to capitalized description
        return description.charAt(0).toUpperCase() + description.slice(1);
      };

      // Process current weather data
      const tempCelsius = Math.round(currentWeather.main.temp);
      const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
      
      console.log("Processed temperature:", tempCelsius, "°C");
      console.log("Processed condition:", getWeatherInterpretation(currentWeather.weather[0].id, currentWeather.weather[0].description));
      
      const processedWeatherData = {
        temperature: `${tempCelsius}°C`,
        temperatureCelsius: tempCelsius,
        temperatureFahrenheit: tempFahrenheit,
        condition: getWeatherInterpretation(currentWeather.weather[0].id, currentWeather.weather[0].description),
        humidity: `${currentWeather.main.humidity}%`,
        rainfall: currentWeather.rain ? `${currentWeather.rain['1h'] || 0}mm` : "0mm",
        precipitation: currentWeather.rain ? `${currentWeather.rain['1h'] || 0}mm` : "0mm",
        windSpeed: `${Math.round(currentWeather.wind.speed * 3.6)} km/h`, // Convert m/s to km/h
        windDirection: getWindDirection(currentWeather.wind.deg || 0),
        loading: false,
        error: null
      };
      
      console.log("Final weather data:", processedWeatherData);
      
      // Process 5-day forecast
      const processedForecast = [];
      const today = new Date();
      
      // Get daily forecasts (every 8th item = 24 hours apart)
      for (let i = 0; i < 5; i++) {
        const forecastIndex = i * 8; // Every 8th forecast (24 hours)
        if (forecastIndex < forecast.list.length) {
          const dayForecast = forecast.list[forecastIndex];
          const dayName = i === 0 ? 'Today' : 
                         i === 1 ? 'Tomorrow' : 
                         new Date(today.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long' });
          
          // Get weather icon based on condition
          const getWeatherIcon = (condition) => {
            return getWeatherIconPath(condition);
          };
          
          // Calculate temperatures in both units
          const tempCelsius = Math.round(dayForecast.main.temp);
          const tempFahrenheit = Math.round((tempCelsius * 9/5) + 32);
          
          processedForecast.push({
            day: dayName,
            tempCelsius: tempCelsius,
            tempFahrenheit: tempFahrenheit,
            temp: `${tempCelsius}°C`, // Default to Celsius
            condition: getWeatherInterpretation(dayForecast.weather[0].id, dayForecast.weather[0].description),
            icon: getWeatherIcon(dayForecast.weather[0].description)
          });
        }
      }
      
      console.log("Processed forecast data:", processedForecast);
      
      setWeatherData(processedWeatherData);
      setWeatherOutlook(processedForecast);
      
    } catch (error: any) {
      console.error("Error fetching weather data:", error);
      
      // Don't show toast for weather API errors - just log them
      const message = error?.message || "Weather unavailable";
      console.warn("Weather API failed, using fallback data:", message);
      
      setWeatherData(prev => ({
        ...prev,
        loading: false,
        error: message,
        precipitation: "0mm",
        windSpeed: "0 km/h",
        windDirection: "N"
      }));
      
      // Fallback to mock data
      setWeatherOutlook([{
        day: "Today",
        tempCelsius: 31,
        tempFahrenheit: 88,
        temp: "31°C",
        condition: "Clear Sky",
        icon: "/weather/clear.svg"
      }, {
        day: "Tomorrow",
        tempCelsius: 32,
        tempFahrenheit: 90,
        temp: "32°C",
        condition: "Few Clouds",
        icon: "/weather/few-clouds.svg"
      }, {
        day: "Wednesday",
        tempCelsius: 29,
        tempFahrenheit: 84,
        temp: "29°C",
        condition: "Shower Rain",
        icon: "/weather/shower-rain.svg"
      }, {
        day: "Thursday",
        tempCelsius: 30,
        tempFahrenheit: 86,
        temp: "30°C",
        condition: "Clear Sky",
        icon: "/weather/clear.svg"
      }, {
        day: "Friday",
        tempCelsius: 33,
        tempFahrenheit: 91,
        temp: "33°C",
        condition: "Clear Sky",
        icon: "/weather/clear.svg"
      }]);
    }
  };

  // Update time every second for clock widget
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch weather data on component mount
  useEffect(() => {
    console.log("=== WEATHER API DEBUG START ===");
    fetchWeatherData();
  }, []);

  // Fetch reports from Firestore
  useEffect(() => {
    const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
      setReports(fetched);
    }, (error) => {
      console.error("Error fetching reports:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      setUsers(fetched);
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get weather icon path
  const getWeatherIconPath = (condition: string) => {
    if (!condition) return '/weather/clear.svg';
    
    const conditionLower = condition.toLowerCase();
    
    // Map weather conditions to SVG files
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return '/weather/clear.svg';
    } else if (conditionLower.includes('few clouds') || conditionLower.includes('partly cloudy')) {
      return '/weather/few-clouds.svg';
    } else if (conditionLower.includes('scattered clouds')) {
      return '/weather/scattered-clouds.svg';
    } else if (conditionLower.includes('broken clouds') || conditionLower.includes('cloud')) {
      return '/weather/broken-clouds.svg';
    } else if (conditionLower.includes('shower') || conditionLower.includes('drizzle') || conditionLower.includes('light rain')) {
      return '/weather/shower-rain.svg';
    } else if (conditionLower.includes('rain')) {
      return '/weather/rain.svg';
    } else if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
      return '/weather/thunderstorm.svg';
    } else if (conditionLower.includes('snow')) {
      return '/weather/snow.svg';
    } else if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) {
      return '/weather/mist.svg';
    } else {
      return '/weather/clear.svg'; // Default fallback
    }
  };

  // Helper function to get pin marker icon path
  const getPinMarkerIcon = (pinType: string) => {
    const icons: Record<string, string> = {
      'Road Crash': '/markers/road-crash.svg',
      'Fire': '/markers/fire.svg',
      'Medical Emergency': '/markers/medical-emergency.svg',
      'Flooding': '/markers/flooding.svg',
      'Volcanic Activity': '/markers/volcano.svg',
      'Landslide': '/markers/landslide.svg',
      'Earthquake': '/markers/earthquake.svg',
      'Civil Disturbance': '/markers/civil-disturbance.svg',
      'Armed Conflict': '/markers/armed-conflict.svg',
      'Infectious Disease': '/markers/infectious-disease.svg',
      'Others': '/markers/default.svg',
      'Evacuation Centers': '/markers/evacuation-center.svg',
      'Health Facilities': '/markers/health-facility.svg',
      'Police Stations': '/markers/police-station.svg',
      'Fire Stations': '/markers/fire-station.svg',
      'Government Offices': '/markers/government-office.svg'
    };
    return icons[pinType] || '/markers/default.svg';
  };

  // Initialize map snippet
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/accizard-lucban/cmh0vikyo00c501st1cprgxwc', // Custom AcciZard style (aligned with RiskMapPage)
        center: [121.5556, 14.1139], // Lucban, Quezon coordinates (aligned with RiskMapPage)
        zoom: 13,
        attributionControl: false
      });

      // Wait for map to load before adding traffic source
      map.current.on('load', () => {
        if (!map.current) return;
        
        // Add traffic source
        if (!map.current.getSource('mapbox-traffic')) {
          map.current.addSource('mapbox-traffic', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1'
          });
        }

        // Add traffic layer (hidden by default)
        if (!map.current.getLayer('traffic')) {
          map.current.addLayer({
            id: 'traffic',
            type: 'line',
            source: 'mapbox-traffic',
            'source-layer': 'traffic',
            paint: {
              'line-width': 2,
              'line-color': [
                'case',
                ['==', ['get', 'congestion'], 'low'], '#4ade80',
                ['==', ['get', 'congestion'], 'moderate'], '#fbbf24',
                ['==', ['get', 'congestion'], 'heavy'], '#f87171',
                ['==', ['get', 'congestion'], 'severe'], '#dc2626',
                '#94a3b8'
              ]
            },
            layout: {
              'visibility': 'none'
            }
          });
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when pins change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each pin
    pins.forEach(pin => {
      const iconPath = getPinMarkerIcon(pin.type);
      
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        cursor: pointer;
        background-image: url('${iconPath}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      `;

      // Add popup with pin information
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="font-family: 'DM Sans', sans-serif;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${pin.title}</h3>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${pin.type}</p>
          <p style="font-size: 11px; color: #9ca3af;">${pin.locationName}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [pins]);

  // Subscribe to pins from database
  useEffect(() => {
    console.log('Subscribing to pins for dashboard map');
    
    const unsubscribe = subscribeToPins(
      {}, // No filters - show all pins
      (fetchedPins) => {
        console.log('Dashboard map: Pins updated from database:', fetchedPins.length);
        setPins(fetchedPins);
      },
      (error) => {
        console.error('Dashboard map: Error fetching pins:', error);
        // Silently fail - don't show error toast on dashboard
      }
    );

    return () => {
      console.log('Dashboard map: Unsubscribing from pins');
      unsubscribe();
    };
  }, [subscribeToPins]);

  // Handle map layer mode changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const currentMap = map.current;

    // Toggle traffic layer
    if (currentMap.getLayer('traffic')) {
      currentMap.setLayoutProperty(
        'traffic',
        'visibility',
        mapLayerMode === 'traffic' ? 'visible' : 'none'
      );
    }

    // Toggle heatmap
    if (mapLayerMode === 'heatmap') {
      // Add heatmap layer if it doesn't exist
      if (!currentMap.getLayer('pins-heatmap')) {
        // Create GeoJSON from pins
        const geojsonData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: pins.map(pin => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [pin.longitude, pin.latitude]
            },
            properties: {
              intensity: 1
            }
          }))
        };

        // Add source if doesn't exist
        if (!currentMap.getSource('pins-heatmap-source')) {
          currentMap.addSource('pins-heatmap-source', {
            type: 'geojson',
            data: geojsonData
          });
        }

        // Add heatmap layer
        currentMap.addLayer({
          id: 'pins-heatmap',
          type: 'heatmap',
          source: 'pins-heatmap-source',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'rgb(0, 255, 255)',
              0.4, 'rgb(0, 255, 0)',
              0.6, 'rgb(255, 255, 0)',
              0.8, 'rgb(255, 165, 0)',
              1, 'rgb(255, 0, 0)'
            ],
            'heatmap-radius': 30,
            'heatmap-opacity': 0.7
          }
        });
      }

      // Show heatmap, hide markers
      currentMap.setLayoutProperty('pins-heatmap', 'visibility', 'visible');
      markersRef.current.forEach(marker => marker.getElement().style.display = 'none');
    } else {
      // Hide heatmap, show markers
      if (currentMap.getLayer('pins-heatmap')) {
        currentMap.setLayoutProperty('pins-heatmap', 'visibility', 'none');
      }
      markersRef.current.forEach(marker => marker.getElement().style.display = 'block');
    }
  }, [mapLayerMode, pins]);

  // Format current time for display
  const formattedTime = currentTime.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const getTotalReports = () => {
    switch (totalReportsFilter) {
      case "this-week":
        return 23;
      case "this-month":
        return 156;
      case "this-year":
        return 1840;
      default:
        return 156;
    }
  };

  // Generic export function for charts
  const exportChart = (chartId: string, fileName: string, format: 'png' | 'svg' | 'pdf') => {
    const svgElement = document.querySelector(`${chartId} svg`);
    if (!svgElement) {
      toast.error('Chart not found. Please try again.');
      return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    if (format === 'svg') {
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    
    // For PNG and PDF, we need to convert SVG to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (format === 'pdf') {
        import('jspdf').then(({ default: jsPDF }) => {
          const pdf = new jsPDF('landscape');
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 10, 10, 280, 150);
          pdf.save(`${fileName}.pdf`);
        });
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Export functions for Barangay Reports chart
  const exportChartAsPNG = () => {
    const chartId = isChartModalOpen ? '#nivo-chart-modal' : '#nivo-chart';
    exportChart(chartId, 'reports-per-barangay', 'png');
  };

  const exportChartAsSVG = () => {
    const chartId = isChartModalOpen ? '#nivo-chart-modal' : '#nivo-chart';
    exportChart(chartId, 'reports-per-barangay', 'svg');
  };

  const exportChartAsPDF = () => {
    const chartId = isChartModalOpen ? '#nivo-chart-modal' : '#nivo-chart';
    exportChart(chartId, 'reports-per-barangay', 'pdf');
  };

  // Export functions for Users chart
  const exportUsersChartAsPNG = () => {
    const chartId = isUsersChartModalOpen ? '#users-chart-modal' : '#users-chart';
    exportChart(chartId, 'users-per-barangay', 'png');
  };

  const exportUsersChartAsSVG = () => {
    const chartId = isUsersChartModalOpen ? '#users-chart-modal' : '#users-chart';
    exportChart(chartId, 'users-per-barangay', 'svg');
  };

  const exportUsersChartAsPDF = () => {
    const chartId = isUsersChartModalOpen ? '#users-chart-modal' : '#users-chart';
    exportChart(chartId, 'users-per-barangay', 'pdf');
  };

  // Export functions for Pie chart
  const exportPieChartAsPNG = () => {
    const chartId = isPieChartModalOpen ? '#pie-chart-modal' : '#pie-chart';
    exportChart(chartId, 'report-type-distribution', 'png');
  };

  const exportPieChartAsSVG = () => {
    const chartId = isPieChartModalOpen ? '#pie-chart-modal' : '#pie-chart';
    exportChart(chartId, 'report-type-distribution', 'svg');
  };

  const exportPieChartAsPDF = () => {
    const chartId = isPieChartModalOpen ? '#pie-chart-modal' : '#pie-chart';
    exportChart(chartId, 'report-type-distribution', 'pdf');
  };

  // Export functions for Peak Hours chart
  const exportPeakHoursChartAsPNG = () => {
    const chartId = isPeakHoursModalOpen ? '#peak-hours-chart-modal' : '#peak-hours-chart';
    exportChart(chartId, 'peak-reporting-hours', 'png');
  };

  const exportPeakHoursChartAsSVG = () => {
    const chartId = isPeakHoursModalOpen ? '#peak-hours-chart-modal' : '#peak-hours-chart';
    exportChart(chartId, 'peak-reporting-hours', 'svg');
  };

  const exportPeakHoursChartAsPDF = () => {
    const chartId = isPeakHoursModalOpen ? '#peak-hours-chart-modal' : '#peak-hours-chart';
    exportChart(chartId, 'peak-reporting-hours', 'pdf');
  };

  // Memoized Nivo theme to match DM Sans font
  const nivoTheme = useMemo(() => ({
    text: {
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 12,
    },
    axis: {
      legend: {
        text: {
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: 500,
        }
      },
      ticks: {
        text: {
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
        }
      }
    },
    legends: {
      text: {
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
      }
    },
    labels: {
      text: {
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
      }
    },
    tooltip: {
      container: {
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 12,
      }
    }
  }), []);

  // Memoized chart keys to prevent re-renders
  const chartKeys = useMemo(() => [
    'Road Crash', 'Fire', 'Medical Emergency', 'Flooding', 
    'Volcanic Activity', 'Landslide', 'Earthquake', 'Civil Disturbance'
  ], []);

  // Memoized chart margins and axis config
  const chartMargin = useMemo(() => ({ top: 50, right: 130, bottom: 80, left: 60 }), []);
  
  // Main dashboard view - hide x-axis labels completely
  const axisBottomConfig = useMemo(() => ({
    tickSize: 0,
    tickPadding: 0,
    tickRotation: 0,
    legend: '',
    legendPosition: 'middle' as const,
    legendOffset: 0,
    format: () => '' // Hide all tick labels
  }), []);
  
  // Modal view - show x-axis labels
  const axisBottomConfigModal = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: -45,
    legend: 'Barangay',
    legendPosition: 'middle' as const,
    legendOffset: 60
  }), []);
  const axisLeftConfig = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Number of Reports',
    legendPosition: 'middle' as const,
    legendOffset: -50
  }), []);
  const legendsConfig = useMemo(() => [{
    dataFrom: 'keys' as const,
    anchor: 'bottom-right' as const,
    direction: 'column' as const,
    justify: false,
    translateX: 120,
    translateY: 0,
    itemsSpacing: 2,
    itemWidth: 100,
    itemHeight: 20,
    itemDirection: 'left-to-right' as const,
    itemOpacity: 0.85,
    symbolSize: 20,
    effects: [
      {
        on: 'hover' as const,
        style: {
          itemOpacity: 1
        }
      }
    ]
  }], []);

  // Calculate dynamic statistics from reports
  const weeklyReports = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return reports.filter(r => r.timestamp >= oneWeekAgo).length;
  }, [reports]);

  const activeUsers = useMemo(() => {
    return users.length;
  }, [users]);

  const mostCommonType = useMemo(() => {
    if (reports.length === 0) return { type: 'N/A', count: 0, percentage: 0 };
    
    const typeCounts: Record<string, number> = {};
    reports.forEach(report => {
      const type = report.type || 'Others';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    if (sortedTypes.length === 0) return { type: 'N/A', count: 0, percentage: 0 };

    const [type, count] = sortedTypes[0];
    const percentage = Math.round((count / reports.length) * 100);
    
    return { type, count, percentage };
  }, [reports]);

  const avgResponseTime = useMemo(() => {
    const reportsWithResponseTime = reports.filter(r => 
      r.resolvedAt && r.timestamp
    );
    
    if (reportsWithResponseTime.length === 0) return 0;

    const totalMinutes = reportsWithResponseTime.reduce((sum, report) => {
      const resolvedTime = report.resolvedAt?.toDate ? report.resolvedAt.toDate() : new Date(report.resolvedAt);
      const submittedTime = report.timestamp;
      const diffMs = resolvedTime.getTime() - submittedTime.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      return sum + diffMinutes;
    }, 0);

    return (totalMinutes / reportsWithResponseTime.length).toFixed(1);
  }, [reports]);

  // Reusable chart component - memoized to prevent unnecessary re-renders
  const BarangayReportsChart = useMemo(() => 
    ({ height = '400px', chartId = 'nivo-chart' }: { height?: string; chartId?: string }) => (
      <div id={chartId} style={{ height }}>
        <ResponsiveBar
          data={stackedReportsData}
          keys={chartKeys}
          indexBy="barangay"
          margin={chartMargin}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={({ id }) => hazardColors[id as keyof typeof hazardColors] || '#6B7280'}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          theme={nivoTheme}
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottomConfig}
          axisLeft={axisLeftConfig}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          legends={legendsConfig}
          animate={true}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              background: 'white',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontFamily: 'DM Sans, sans-serif',
              minWidth: '120px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: 1
                }}>
                  {value}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  lineHeight: 1
                }}>
                  {id}
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: 400,
                paddingLeft: '16px'
              }}>
                {indexValue}
              </div>
            </div>
          )}
        />
      </div>
    ), [stackedReportsData, chartKeys, chartMargin, axisBottomConfig, axisLeftConfig, legendsConfig, hazardColors, nivoTheme]
  );

  // Modal version of Barangay Reports Chart with labels
  const BarangayReportsChartModal = useMemo(() => 
    ({ height = '400px', chartId = 'nivo-chart-modal' }: { height?: string; chartId?: string }) => (
      <div id={chartId} style={{ height }}>
        <ResponsiveBar
          data={stackedReportsData}
          keys={chartKeys}
          indexBy="barangay"
          margin={chartMargin}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={({ id }) => hazardColors[id as keyof typeof hazardColors] || '#6B7280'}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          theme={nivoTheme}
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottomConfigModal}
          axisLeft={axisLeftConfig}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          legends={legendsConfig}
          animate={true}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              background: 'white',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontFamily: 'DM Sans, sans-serif',
              minWidth: '120px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: 1
                }}>
                  {value}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  lineHeight: 1
                }}>
                  {id}
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: 400,
                paddingLeft: '16px'
              }}>
                {indexValue}
              </div>
            </div>
          )}
        />
      </div>
    ), [stackedReportsData, chartKeys, chartMargin, axisBottomConfigModal, axisLeftConfig, legendsConfig, hazardColors, nivoTheme]
  );

  // Users per Barangay Bar Chart - memoized to prevent unnecessary re-renders
  const UsersPerBarangayChart = useMemo(() => 
    ({ height = '400px', chartId = 'users-chart' }: { height?: string; chartId?: string }) => (
      <div id={chartId} style={{ height }}>
        <ResponsiveBar
          data={usersPerBarangay.map(item => ({
            barangay: item.name,
            users: item.users
          }))}
          keys={['users']}
          indexBy="barangay"
          margin={{ top: 50, right: 130, bottom: 80, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={['#f97316']}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          theme={nivoTheme}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 0,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: 0
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Number of Users',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          animate={true}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              background: 'white',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontFamily: 'DM Sans, sans-serif',
              minWidth: '120px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: 1
                }}>
                  {value}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  lineHeight: 1
                }}>
                  users
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: 400,
                paddingLeft: '16px'
              }}>
                {indexValue}
              </div>
            </div>
          )}
        />
      </div>
    ), [usersPerBarangay, nivoTheme]
  );

  // Modal version of Users per Barangay Bar Chart with labels
  const UsersPerBarangayChartModal = useMemo(() => 
    ({ height = '400px', chartId = 'users-chart-modal' }: { height?: string; chartId?: string }) => (
      <div id={chartId} style={{ height }}>
        <ResponsiveBar
          data={usersPerBarangay.map(item => ({
            barangay: item.name,
            users: item.users
          }))}
          keys={['users']}
          indexBy="barangay"
          margin={{ top: 50, right: 130, bottom: 80, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={['#f97316']}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          theme={nivoTheme}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Barangay',
            legendPosition: 'middle',
            legendOffset: 60
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Number of Users',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          animate={true}
          tooltip={({ id, value, indexValue, color }) => (
            <div style={{
              background: 'white',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontFamily: 'DM Sans, sans-serif',
              minWidth: '120px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: 1
                }}>
                  {value}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#374151',
                  lineHeight: 1
                }}>
                  users
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: 400,
                paddingLeft: '16px'
              }}>
                {indexValue}
              </div>
            </div>
          )}
        />
      </div>
    ), [usersPerBarangay, nivoTheme]
  );

  return <div className="space-y-6">
      {/* LDRRMO Profile, Weather Forecast, Time & Date - 1:2:1 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Lucban LDRRMO Profile Card - 1 column */}
        <Card className="h-full">
          <CardContent className="flex flex-col justify-between h-full">
            <div className="space-y-4">
              {/* LDRRMO Logo */}
              <div className="flex justify-center pt-4">
                <img 
                  src="/accizard-uploads/logo-ldrrmo-png.png" 
                  alt="Lucban LDRRMO" 
                  className="h-36 w-auto object-contain"
                />
              </div>
                
              {/* Organization Info */}
              <div className="text-center space-y-2">
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  Lucban Disaster Risk Reduction and Management Office
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3 pt-4">
              {/* Facebook */}
              <div className="space-y-1">
                <div className="text-xs font-regular text-gray-600 text-center">Facebook</div>
                <div className="flex items-center justify-center space-x-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <a 
                    href="https://www.facebook.com/LucbanDRRMO" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Lucban DRRM Office
                  </a>
                </div>
              </div>

              {/* Contact Numbers */}
              <div className="space-y-1">
                <div className="text-xs font-regular text-gray-600 text-center">Contact Numbers</div>
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4 text-brand-orange" />
                  <div className="text-xs font-semibold text-brand-orange">
                    540-1709 or 0917 520 4211
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Forecast Card - 2 columns */}
        <Card className="md:col-span-2 h-full overflow-hidden">
          <div className="relative">
            {/* Background SVG */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src="/accizard-uploads/weather-bg.svg" 
                alt="Weather background" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Content overlay */}
            <div className="relative z-10">
              <CardHeader className="pb-2">
                <CardTitle className="text-l text-white">Weather Forecast</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col">
            <div className="space-y-4 flex-1">
              {/* Current Weather - Reference Layout */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-white/80">Current Weather</div>
                
                {/* Temperature and Weather Details */}
                <div className="flex items-start justify-between">
                  {/* Temperature Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {/* Temperature */}
                      <div className="text-4xl font-bold text-white">
                        {weatherData.loading ? "..." : 
                         temperatureUnit === 'celsius' ? 
                           `${weatherData.temperatureCelsius}°` : 
                           `${weatherData.temperatureFahrenheit}°`}
                      </div>
                      
                      {/* Temperature Unit Toggle - Moved next to temperature */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setTemperatureUnit('celsius')}
                          className={`text-xs px-2 py-1 rounded ${
                            temperatureUnit === 'celsius' 
                              ? 'bg-brand-orange text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          °C
                        </button>
                        <button
                          onClick={() => setTemperatureUnit('fahrenheit')}
                          className={`text-xs px-2 py-1 rounded ${
                            temperatureUnit === 'fahrenheit' 
                              ? 'bg-brand-orange text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          °F
                        </button>
                      </div>
                      
                      {/* Weather Icon */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        {weatherData.loading ? (
                          <div className="w-8 h-8 border-2 border-gray-300 border-t-brand-orange rounded-full animate-spin"></div>
                        ) : weatherData.error ? (
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-lg">⚠</span>
                          </div>
                        ) : (
                          <img 
                            src={getWeatherIconPath(weatherData.condition)} 
                            alt={weatherData.condition}
                            className="w-10 h-10"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Weather Condition */}
                    <div className="text-sm font-medium text-white/90 mt-2">
                      {weatherData.loading ? "Loading..." : weatherData.error ? "Error" : weatherData.condition}
                    </div>
                  </div>

                  {/* Weather Details Section */}
                  <div className="flex-1 space-y-2">
                    {/* Wind */}
                    <div className="flex items-center gap-2">
                      <Wind className="h-3 w-3 text-white/80" />
                      <div className="text-xs font-medium text-white/80">Wind</div>
                      <div className="text-xs font-semibold text-white">
                        {weatherData.loading ? "..." : weatherData.windSpeed}
                      </div>
                    </div>
                    
                    {/* Humidity */}
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3 w-3 text-white/80" />
                      <div className="text-xs font-medium text-white/80">Humidity</div>
                      <div className="text-xs font-semibold text-white">
                        {weatherData.loading ? "..." : weatherData.humidity}
                      </div>
                    </div>
                    
                    {/* Precipitation */}
                    <div className="flex items-center gap-2">
                      <Precipitation className="h-3 w-3 text-white/80" />
                      <div className="text-xs font-medium text-white/80">Precip</div>
                      <div className="text-xs font-semibold text-white">
                        {weatherData.loading ? "..." : weatherData.precipitation}
                      </div>
                    </div>
                  </div>

                  {/* Location Information - Right aligned */}
                  <div className="flex-1 space-y-1 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <MapPin className="h-3 w-3 text-white/80" />
                      <span className="text-sm font-medium text-white">Lucban, Quezon</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-white/80">Philippines</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-Day Outlook */}
              <div className="border-t border-white/20 pt-3">
                <div className="text-xs font-medium text-white/80 mb-2">5-Day Outlook</div>
                <div className="grid grid-cols-5 gap-2">
                  {weatherData.loading || weatherOutlook.length === 0 ? (
                    // Loading state
                    Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="text-center p-2 bg-white/10 rounded-lg">
                        <div className="text-xs font-medium text-white/80 mb-1">Loading...</div>
                        <div className="text-lg mb-1">⏳</div>
                        <div className="text-sm font-bold text-white/60">...</div>
                        <div className="text-xs text-white/60">...</div>
                      </div>
                    ))
                  ) : (
                    weatherOutlook.map((day, index) => (
                        <div key={index} className="text-center p-2 bg-white/10 rounded-lg">
                          <div className="text-xs font-medium text-white/80 mb-1">{day.day}</div>
                          <div className="flex justify-center mb-1">
                            <img 
                              src={day.icon} 
                              alt={day.condition}
                              className="w-6 h-6"
                            />
                          </div>
                          <div className="text-sm font-bold text-white">
                            {temperatureUnit === 'celsius' ? 
                              `${day.tempCelsius}°C` : 
                              `${day.tempFahrenheit}°F`}
                          </div>
                          <div className="text-xs text-white/80 truncate">{day.condition}</div>
                        </div>
                    ))
                  )}
                </div>
              </div>
            </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Time & Date Cards - 1 column with 2 cards stacked */}
        <div className="h-full flex flex-col gap-6">
          {/* Time Card - Top */}
          <Card className="flex-1">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              {/* Time Display */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 tracking-tight">
                  {currentTime.toLocaleTimeString('en-PH', {
                    timeZone: 'Asia/Manila',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>

              {/* Timezone */}
              <div className="text-center mt-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Asia/Manila (GMT+8)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Card - Bottom */}
          <Card className="flex-1">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              {/* Date Number */}
              <div className="text-7xl font-black text-brand-orange leading-none">
                {currentTime.toLocaleDateString('en-US', { 
                  day: 'numeric'
                })}
              </div>

              {/* Month and Year */}
              <div className="text-lg font-semibold text-gray-700 mt-3">
                {currentTime.toLocaleDateString('en-US', { 
                  month: 'long',
                  year: 'numeric'
                })}
              </div>

              {/* Day of Week */}
              <div className="text-sm font-medium text-gray-600 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long'
                })}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Calendar Heatmap and Map Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Calendar Heatmap - Report Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Report Activity Calendar - 2025</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Nivo Calendar Chart */}
              <div style={{ height: '100px' }}>
                <ResponsiveCalendar
                  data={calendarData2025}
                  from="2025-01-01"
                  to="2025-12-31"
                  emptyColor="#f3f4f6"
                  colors={[
                    '#fed7aa', // orange-200 (very light orange) - Infectious Disease
                    '#fb923c', // brand-orange-400 (lighter) - Fire
                    '#f97316', // brand-orange (primary) - Road Crash
                    '#ea580c', // brand-orange-600 (darker) - Medical Emergency
                    '#dc2626', // red-600 (medium red) - Earthquake
                    '#991b1b'  // brand-red (primary) - Flooding
                  ]}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  yearSpacing={20}
                  monthBorderColor="#ffffff"
                  dayBorderWidth={1}
                  dayBorderColor="#ffffff"
                  legends={[
                    {
                      anchor: 'bottom-right',
                      direction: 'row',
                      translateY: 20,
                      itemCount: 4,
                      itemWidth: 35,
                      itemHeight: 30,
                      itemsSpacing: 10,
                      itemDirection: 'right-to-left'
                    }
                  ]}
                  theme={nivoTheme}
                  tooltip={({ day, value }) => (
                    <div style={{
                      background: 'white',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {new Date(day).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div style={{ color: '#f97316', fontWeight: 500 }}>
                        {value} reports
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-orange">
                    {calendarData2025.reduce((sum, day) => sum + day.value, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-red">
                    {Math.max(...calendarData2025.map(d => d.value))}
                  </div>
                  <div className="text-sm text-gray-600">Peak Day</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {(calendarData2025.reduce((sum, day) => sum + day.value, 0) / calendarData2025.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Avg/Day</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Snippet */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div 
                ref={mapContainer}
                className="w-full h-64 rounded-lg border border-gray-200 overflow-hidden"
                style={{ minHeight: '256px' }}
              >
                {/* Map will be rendered here */}
              </div>
              {/* Map Layer Toggle Button */}
              <Button 
                size="sm" 
                variant="secondary"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 border border-gray-300 shadow-sm"
                onClick={() => {
                  // Cycle through layer modes: normal -> traffic -> heatmap -> normal
                  setMapLayerMode(prev => {
                    if (prev === 'normal') return 'traffic';
                    if (prev === 'traffic') return 'heatmap';
                    return 'normal';
                  });
                }}
              >
                {mapLayerMode === 'normal' && (
                  <>
                    <Layers className="h-3 w-3 mr-1" />
                    Normal
                  </>
                )}
                {mapLayerMode === 'traffic' && (
                  <>
                    <Car className="h-3 w-3 mr-1" />
                    Traffic
                  </>
                )}
                {mapLayerMode === 'heatmap' && (
                  <>
                    <Flame className="h-3 w-3 mr-1" />
                    Heatmap
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Summary Cards with Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-brand-orange" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Most Common Type</p>
                  <p className="text-xs text-brand-orange font-medium">{mostCommonType.type} - {mostCommonType.percentage}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{mostCommonType.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-brand-orange" />
            </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">This Week</p>
                  <p className="text-xs text-brand-orange font-medium">Last 7 days</p>
          </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{weeklyReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-brand-orange" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Active Users</p>
                  <p className="text-xs text-brand-orange font-medium">Registered</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-brand-orange" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Avg Response Time</p>
                  <p className="text-xs text-brand-orange font-medium">Emergency calls</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">8.5</p>
                <p className="text-xs text-gray-500 font-medium">minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Reports per Barangay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reports per Barangay</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={barangayReportsFilter} onValueChange={setBarangayReportsFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportChartAsPNG}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChartAsSVG}>
                    <FileType className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportChartAsPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand Button */}
              <Button size="sm" variant="outline" onClick={() => setIsChartModalOpen(true)}>
                <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
          </CardHeader>
          <CardContent>
            <BarangayReportsChart />
          </CardContent>
        </Card>

        {/* Bar Chart - Users per Barangay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Users per Barangay</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={usersBarangayFilter} onValueChange={setUsersBarangayFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportUsersChartAsPNG}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportUsersChartAsSVG}>
                    <FileType className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportUsersChartAsPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand Button */}
              <Button size="sm" variant="outline" onClick={() => setIsUsersChartModalOpen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <UsersPerBarangayChart height="300px" chartId="users-chart" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Report Type Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Report Type Distribution</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportPieChartAsPNG}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPieChartAsSVG}>
                    <FileType className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPieChartAsPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand Button */}
              <Button size="sm" variant="outline" onClick={() => setIsPieChartModalOpen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div id="pie-chart" style={{ height: '300px' }}>
              <ChartContainer config={{
                reports: {
                  label: "Reports",
                  color: "#D32F2F"
                }
              }}>
                <PieChart width={400} height={300}>
                  <Pie data={reportTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                    {reportTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {reportTypeData.map(item => <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: item.color
                  }}></div>
                  <span className="text-sm">{item.name} ({item.value}%)</span>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Peak Reporting Hours - Now as Line Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Peak Reporting Hours</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={peakHoursFilter} onValueChange={setPeakHoursFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportPeakHoursChartAsPNG}>
                    <FileImage className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPeakHoursChartAsSVG}>
                    <FileType className="h-4 w-4 mr-2" />
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPeakHoursChartAsPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expand Button */}
              <Button size="sm" variant="outline" onClick={() => setIsPeakHoursModalOpen(true)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div id="peak-hours-chart" style={{ height: '300px' }}>
            <ChartContainer config={{
            reports: {
              label: "Reports",
              color: "#FF4F0B"
            }
          }}>
                <LineChart width={400} height={300} data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
            </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expanded Chart Modal */}
      <Dialog open={isChartModalOpen} onOpenChange={setIsChartModalOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <DialogTitle>Reports per Barangay - Detailed View</DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={barangayReportsFilter} onValueChange={setBarangayReportsFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportChartAsPNG}>
                      <FileImage className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportChartAsSVG}>
                      <FileType className="h-4 w-4 mr-2" />
                      Export as SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportChartAsPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            <BarangayReportsChartModal height="calc(90vh - 140px)" chartId="nivo-chart-modal" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Users Chart Modal */}
      <Dialog open={isUsersChartModalOpen} onOpenChange={setIsUsersChartModalOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <DialogTitle>Users per Barangay - Detailed View</DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={usersBarangayFilter} onValueChange={setUsersBarangayFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportUsersChartAsPNG}>
                      <FileImage className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportUsersChartAsSVG}>
                      <FileType className="h-4 w-4 mr-2" />
                      Export as SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportUsersChartAsPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            <UsersPerBarangayChartModal height="calc(90vh - 140px)" chartId="users-chart-modal" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Pie Chart Modal */}
      <Dialog open={isPieChartModalOpen} onOpenChange={setIsPieChartModalOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <DialogTitle>Report Type Distribution - Detailed View</DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportPieChartAsPNG}>
                      <FileImage className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPieChartAsSVG}>
                      <FileType className="h-4 w-4 mr-2" />
                      Export as SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPieChartAsPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            <div id="pie-chart-modal" style={{ height: 'calc(90vh - 200px)' }}>
            <ChartContainer config={{
              reports: {
                label: "Reports",
                color: "#D32F2F"
              }
            }}>
              <PieChart width={600} height={400}>
                <Pie data={reportTypeData} cx="50%" cy="50%" innerRadius={100} outerRadius={200} paddingAngle={5} dataKey="value" label>
                  {reportTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {reportTypeData.map(item => <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{
                    backgroundColor: item.color
                  }}></div>
                  <span className="text-sm">{item.name} ({item.value}%)</span>
                </div>)}
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Peak Hours Chart Modal */}
      <Dialog open={isPeakHoursModalOpen} onOpenChange={setIsPeakHoursModalOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <DialogTitle>Peak Reporting Hours - Detailed View</DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={peakHoursFilter} onValueChange={setPeakHoursFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportPeakHoursChartAsPNG}>
                      <FileImage className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPeakHoursChartAsSVG}>
                      <FileType className="h-4 w-4 mr-2" />
                      Export as SVG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPeakHoursChartAsPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            <div id="peak-hours-chart-modal" style={{ height: 'calc(90vh - 140px)' }}>
            <ChartContainer config={{
              reports: {
                label: "Reports",
                color: "#FF4F0B"
              }
            }}>
              <LineChart width={800} height={400} data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={3} dot={{ fill: "#FF4F0B", r: 6 }} />
              </LineChart>
            </ChartContainer>
      </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}