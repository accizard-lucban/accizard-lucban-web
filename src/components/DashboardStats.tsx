import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { AlertTriangle, Users, FileText, MapPin, CloudRain, Clock, TrendingUp, PieChart as PieChartIcon, Building2, Calendar, Download, Maximize2, FileImage, FileType } from "lucide-react";
import { ResponsiveBar } from '@nivo/bar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { ensureOk, getHttpStatusMessage } from "@/lib/utils";

export function DashboardStats() {
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
      const currentWeather = await ensureOk(
        await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`
        )
      ).then(r => r.json());
      
      // Fetch 5-day forecast
      const forecast = await ensureOk(
        await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric`
        )
      ).then(r => r.json());
      
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
      
    } catch (error: any) {
      console.error("Error fetching weather data:", error);
      const message = error?.status ? getHttpStatusMessage(error.status) : (error?.message || "Weather unavailable");
      toast.error(message);
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
  const axisBottomConfig = useMemo(() => ({
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

  return <div className="space-y-6">
      {/* PST & Weather Card - Uneven Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* PST Card - Time and Date */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time and Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {/* Calendar Widget */}
              <div className="flex justify-center">
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
            <CardTitle className="text-sm">Weather Forecast</CardTitle>
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

      {/* Statistical Summary Cards with Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-brand-orange" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Total Reports</p>
                  <p className="text-xs text-brand-orange font-medium">All time</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{getTotalReports()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                <p className="text-3xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
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
                <p className="text-3xl font-bold text-gray-900">1,240</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-brand-orange" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Most Common Type</p>
                  <p className="text-xs text-brand-orange font-medium">Road Crash - 45%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap - Report Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Activity Calendar</CardTitle>
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
          <Download className="h-4 w-4 mr-2" />
                    Export
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
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
            <div id="users-chart" style={{ height: '300px' }}>
              <ChartContainer config={{
                users: {
                  label: "Users",
                  color: "#FF4F0B"
                }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersPerBarangay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="users" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
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
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                      {reportTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
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
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
              </ResponsiveContainer>
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
                      <Download className="h-4 w-4 mr-2" />
                      Export
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
            <BarangayReportsChart height="calc(90vh - 140px)" chartId="nivo-chart-modal" />
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
                      <Download className="h-4 w-4 mr-2" />
                      Export
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
            <div id="users-chart-modal" style={{ height: 'calc(90vh - 140px)' }}>
            <ChartContainer config={{
            users: {
              label: "Users",
              color: "#FF4F0B"
            }
          }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersPerBarangay}>
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="#FF4F0B" strokeWidth={2} dot={{ fill: "#FF4F0B" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
      </div>
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
                      <Download className="h-4 w-4 mr-2" />
                      Export
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
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={reportTypeData} cx="50%" cy="50%" innerRadius={100} outerRadius={200} paddingAngle={5} dataKey="value" label>
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
                      <Download className="h-4 w-4 mr-2" />
                      Export
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
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="reports" stroke="#FF4F0B" strokeWidth={3} dot={{ fill: "#FF4F0B", r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
      </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}