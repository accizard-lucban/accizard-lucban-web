import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, Printer, AlertTriangle, Users, FileText, MapPin, CloudRain, Clock, TrendingUp, PieChart as PieChartIcon, Building2, Calendar } from "lucide-react";

export function DashboardStats() {
  const [totalReportsFilter, setTotalReportsFilter] = useState("this-week");
  const [barangayReportsFilter, setBarangayReportsFilter] = useState("this-week");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState({
    temperature: "28°C",
    condition: "Partly Cloudy",
    humidity: "75%",
    rainfall: "Light",
    precipitation: "0mm",
    windSpeed: "0 km/h",
    windDirection: "N",
    loading: true,
    error: null
  });
  const [weatherOutlook, setWeatherOutlook] = useState([]);

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

  // Calendar heatmap data for the past year
  const generateCalendarData = () => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Generate random report counts (0-8) with some realistic patterns
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseCount = isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6);
      const extraCount = Math.random() < 0.1 ? Math.floor(Math.random() * 3) : 0; // 10% chance of extra activity
      
      data.push({
        date: dateStr,
        count: baseCount + extraCount,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear()
      });
    }
    return data;
  };

  const calendarData = generateCalendarData();

  // OpenWeatherMap API integration
  const fetchWeatherData = async () => {
    try {
      // You'll need to add your OpenWeatherMap API key to environment variables
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const CITY = "Lucban,PH"; // Lucban, Philippines
      
      if (!API_KEY) {
        console.warn("OpenWeatherMap API key not found. Using mock data.");
        setWeatherData(prev => ({ 
          ...prev, 
          loading: false,
          precipitation: "2mm",
          windSpeed: "8 km/h",
          windDirection: "NE"
        }));
        return;
      }

      // Fetch current weather
      const currentWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentWeatherResponse.ok) {
        throw new Error(`Weather API error: ${currentWeatherResponse.status}`);
      }
      
      const currentWeather = await currentWeatherResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric`
      );
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }
      
      const forecast = await forecastResponse.json();
      
      // Helper function to convert wind direction from degrees to compass direction
      const getWindDirection = (degrees) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
      };

      // Process current weather data
      const processedWeatherData = {
        temperature: `${Math.round(currentWeather.main.temp)}°C`,
        condition: currentWeather.weather[0].description,
        humidity: `${currentWeather.main.humidity}%`,
        rainfall: currentWeather.rain ? `${currentWeather.rain['1h'] || 0}mm` : "0mm",
        precipitation: currentWeather.rain ? `${currentWeather.rain['1h'] || 0}mm` : "0mm",
        windSpeed: `${Math.round(currentWeather.wind.speed * 3.6)} km/h`, // Convert m/s to km/h
        windDirection: getWindDirection(currentWeather.wind.deg || 0),
        loading: false,
        error: null
      };
      
      // Process 5-day forecast
      const processedForecast = [];
      const today = new Date();
      const dayNames = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
      
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
            const conditionLower = condition.toLowerCase();
            if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
            if (conditionLower.includes('cloud')) return '☁️';
            if (conditionLower.includes('rain')) return '🌧️';
            if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return '⛈️';
            if (conditionLower.includes('snow')) return '❄️';
            if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️';
            return '⛅';
          };
          
          processedForecast.push({
            day: dayName,
            temp: `${Math.round(dayForecast.main.temp)}°C`,
            condition: dayForecast.weather[0].description,
            icon: getWeatherIcon(dayForecast.weather[0].description)
          });
        }
      }
      
      setWeatherData(processedWeatherData);
      setWeatherOutlook(processedForecast);
      
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        precipitation: "0mm",
        windSpeed: "0 km/h",
        windDirection: "N"
      }));
      
      // Fallback to mock data
      setWeatherOutlook([{
        day: "Today",
        temp: "28°C",
        condition: "Partly Cloudy",
        icon: "⛅"
      }, {
        day: "Tomorrow",
        temp: "30°C",
        condition: "Sunny",
        icon: "☀️"
      }, {
        day: "Wednesday",
        temp: "26°C",
        condition: "Rainy",
        icon: "🌧️"
      }, {
        day: "Thursday",
        temp: "29°C",
        condition: "Cloudy",
        icon: "☁️"
      }, {
        day: "Friday",
        temp: "31°C",
        condition: "Sunny",
        icon: "☀️"
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
    fetchWeatherData();
  }, []);

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

  const handlePrintDashboard = () => {
    window.print();
  };
  const handleDownloadReport = () => {
    console.log("Downloading dashboard report...");
  };
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
  return <div className="space-y-6">
      {/* PST & Weather Card - Uneven Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* PST Card - Time and Date */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-brand-orange rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm bg-brand-orange bg-clip-text text-transparent">
                  Time and Date
                </CardTitle>
                <CardDescription className="text-xs">Current time & calendar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Clock and Calendar Row */}
              <div className="flex items-center justify-between">
                {/* Clock Widget */}
                <div className="relative w-12 h-12">
                  {/* Clock Face */}
                  <div className="absolute inset-0 rounded-full border-2 border-gray-300 bg-white shadow-sm">
                    {/* Hour Markers */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = (i * 30) - 90; // 30 degrees per hour, start at -90 (12 o'clock)
                      const x = 50 + 30 * Math.cos(angle * Math.PI / 180);
                      const y = 50 + 30 * Math.sin(angle * Math.PI / 180);
                      return (
                        <div
                          key={i}
                          className="absolute w-0.5 h-0.5 bg-gray-600 rounded-full"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      );
                    })}
                    
                    {/* Hour Hand */}
                    <div
                      className="absolute w-0.5 bg-gray-800 origin-bottom"
                      style={{
                        height: '12px',
                        left: '50%',
                        top: '50%',
                        transform: `translateX(-50%) rotate(${(currentTime.getHours() % 12) * 30 + (currentTime.getMinutes() / 60) * 30 - 90}deg)`,
                        transformOrigin: 'bottom center'
                      }}
                    />
                    
                    {/* Minute Hand */}
                    <div
                      className="absolute w-0.5 bg-gray-600 origin-bottom"
                      style={{
                        height: '16px',
                        left: '50%',
                        top: '50%',
                        transform: `translateX(-50%) rotate(${currentTime.getMinutes() * 6 - 90}deg)`,
                        transformOrigin: 'bottom center'
                      }}
                    />
                    
                    {/* Second Hand */}
                    <div
                      className="absolute w-px bg-brand-orange origin-bottom"
                      style={{
                        height: '18px',
                        left: '50%',
                        top: '50%',
                        transform: `translateX(-50%) rotate(${currentTime.getSeconds() * 6 - 90}deg)`,
                        transformOrigin: 'bottom center'
                      }}
                    />
                    
                    {/* Center Dot */}
                    <div className="absolute w-1 h-1 bg-gray-800 rounded-full" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
                  </div>
                </div>

                {/* Calendar Widget */}
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {currentTime.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-lg font-bold text-brand-orange">
                    {currentTime.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              </div>
              
              {/* Time Display */}
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900">{formattedTime}</div>
                <div className="text-xs text-gray-500">Asia/Manila</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Card - Larger with 5-day outlook */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-r from-brand-orange to-brand-red rounded-lg">
                <CloudRain className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm bg-gradient-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">
                  Weather Forecast
                </CardTitle>
                <CardDescription className="text-xs">Current conditions & outlook</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Weather */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {weatherData.loading ? "⏳" : 
                     weatherData.error ? "⚠️" : "⛅"}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      {weatherData.loading ? "Loading..." : weatherData.temperature}
                    </div>
                    <div className="text-sm text-gray-700">
                      {weatherData.loading ? "Fetching weather..." : 
                       weatherData.error ? "Weather unavailable" : weatherData.condition}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <div>Humidity: {weatherData.loading ? "..." : weatherData.humidity}</div>
                  <div>Precipitation: {weatherData.loading ? "..." : weatherData.precipitation}</div>
                  <div>Wind: {weatherData.loading ? "..." : `${weatherData.windSpeed} ${weatherData.windDirection}`}</div>
                </div>
              </div>

              {/* 5-Day Outlook */}
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-gray-600 mb-2">5-Day Outlook</div>
                <div className="grid grid-cols-5 gap-2">
                  {weatherData.loading ? (
                    // Loading state
                    Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 mb-1">Loading...</div>
                        <div className="text-lg mb-1">⏳</div>
                        <div className="text-sm font-bold text-gray-400">...</div>
                        <div className="text-xs text-gray-400">...</div>
                      </div>
                    ))
                  ) : (
                    weatherOutlook.map((day, index) => (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 mb-1">{day.day}</div>
                        <div className="text-lg mb-1">{day.icon}</div>
                        <div className="text-sm font-bold text-brand-orange">{day.temp}</div>
                        <div className="text-xs text-gray-500 truncate">{day.condition}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap - Report Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-brand-orange" />
            <div>
              <CardTitle>Report Activity Calendar</CardTitle>
              <CardDescription>Daily report submissions over the past year</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Less</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-brand-orange/20 rounded-sm"></div>
                <div className="w-3 h-3 bg-brand-orange/40 rounded-sm"></div>
                <div className="w-3 h-3 bg-brand-orange/60 rounded-sm"></div>
                <div className="w-3 h-3 bg-brand-orange rounded-sm"></div>
                <div className="w-3 h-3 bg-brand-red rounded-sm"></div>
              </div>
              <span className="text-sm text-gray-600">More</span>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Month headers */}
                <div className="flex mb-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthData = calendarData.filter(d => d.month === i);
                    const monthWidth = (monthData.length / 7) * 11; // Approximate width based on days
                    return (
                      <div key={i} className="text-xs text-gray-500 text-center" style={{ width: `${monthWidth}px` }}>
                        {monthNames[i]}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar squares */}
                <div className="flex flex-wrap gap-1">
                  {calendarData.map((day, index) => {
                    const getIntensity = (count) => {
                      if (count === 0) return 'bg-gray-100';
                      if (count <= 1) return 'bg-brand-orange/20';
                      if (count <= 2) return 'bg-brand-orange/40';
                      if (count <= 3) return 'bg-brand-orange/60';
                      if (count <= 5) return 'bg-brand-orange';
                      return 'bg-brand-red';
                    };

                    const formatDate = (dateStr) => {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    };

                    return (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-brand-orange/50 transition-all ${getIntensity(day.count)}`}
                        title={`${formatDate(day.date)}: ${day.count} reports`}
                      />
                    );
                  })}
                </div>

                {/* Day labels */}
                <div className="flex mt-2 text-xs text-gray-500">
                  <div className="w-3"></div>
                  <div className="w-3 text-center">S</div>
                  <div className="w-3 text-center">M</div>
                  <div className="w-3 text-center">T</div>
                  <div className="w-3 text-center">W</div>
                  <div className="w-3 text-center">T</div>
                  <div className="w-3 text-center">F</div>
                  <div className="w-3 text-center">S</div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-orange">
                  {calendarData.reduce((sum, day) => sum + day.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-red">
                  {Math.max(...calendarData.map(d => d.count))}
                </div>
                <div className="text-sm text-gray-600">Peak Day</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {(calendarData.reduce((sum, day) => sum + day.count, 0) / calendarData.length).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg/Day</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print and Download Controls */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleDownloadReport} className="bg-[#FF4F0B] text-white">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline" onClick={handlePrintDashboard} className="bg-[#FF4F0B] text-white">
          <Printer className="h-4 w-4 mr-2" />
          Print Dashboard
        </Button>
      </div>

      {/* Statistical Summary Cards with Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-brand-orange">{getTotalReports()}</div>
            </div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-red">23</div>
            <p className="text-xs text-muted-foreground">8 ongoing, 15 resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Road Crash</div>
            <p className="text-xs text-muted-foreground">45% of all reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Reports per Barangay */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-brand-orange" />
              <div>
                <CardTitle>Reports per Barangay</CardTitle>
                <CardDescription>Distribution of reports across barangays</CardDescription>
              </div>
            </div>
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
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
            reports: {
              label: "Reports",
              color: "#FF4F0B"
            }
          }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportsPerBarangay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Users per Barangay */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-brand-orange" />
              <div>
                <CardTitle>Users per Barangay</CardTitle>
                <CardDescription>Distribution of users across barangays</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
            users: {
              label: "Users",
              color: "#FF4F0B"
            }
          }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usersPerBarangay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Report Type Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-brand-orange" />
              <div>
                <CardTitle>Report Type Distribution</CardTitle>
                <CardDescription>Breakdown of incident types</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              reports: {
                label: "Reports",
                color: "#D32F2F"
              }
            }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={reportTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                    {reportTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
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
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-brand-orange" />
              <div>
                <CardTitle>Peak Reporting Hours</CardTitle>
                <CardDescription>When incidents are most commonly reported</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              reports: {
                label: "Reports",
                color: "#FF4F0B"
              }
            }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>;
}