import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, Printer, AlertTriangle, Users, FileText, MapPin, CloudRain, Clock } from "lucide-react";

export function DashboardStats() {
  const [totalReportsFilter, setTotalReportsFilter] = useState("this-week");
  const [barangayReportsFilter, setBarangayReportsFilter] = useState("this-week");

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

  // 5-day weather outlook data
  const weatherOutlook = [{
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
  }];

  const currentTime = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const weatherData = {
    temperature: "28°C",
    condition: "Partly Cloudy",
    humidity: "75%",
    rainfall: "Light"
  };
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Clock className="h-4 w-4 text-brand-orange" />
            <CardTitle className="text-sm font-medium ml-2">Philippine Standard Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CloudRain className="h-4 w-4 text-brand-orange" />
            <CardTitle className="text-sm font-medium ml-2">Weather Forecast - Lucban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{weatherData.temperature}</div>
              <div className="text-sm text-gray-600">{weatherData.condition}</div>
              <div className="text-xs text-gray-500">Humidity: {weatherData.humidity} | Rainfall: {weatherData.rainfall}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5-Day Weather Outlook */}
      <Card>
        <CardHeader>
          <CardTitle>5-Day Weather Outlook</CardTitle>
          <CardDescription>Extended weather forecast for Lucban</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {weatherOutlook.map((day, index) => <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600 mb-1">{day.day}</div>
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="text-lg font-bold text-orange-600">{day.temp}</div>
                <div className="text-xs text-gray-500">{day.condition}</div>
              </div>)}
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
            <div>
              <CardTitle>Reports per Barangay</CardTitle>
              <CardDescription>Distribution of reports across barangays</CardDescription>
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
                <BarChart data={reportsPerBarangay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="reports" fill="#FF4F0B" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Users per Barangay */}
        <Card>
          <CardHeader>
            <CardTitle>Users per Barangay</CardTitle>
            <CardDescription>Distribution of users across barangays</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
            users: {
              label: "Users",
              color: "#FF4F0B"
            }
          }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usersPerBarangay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="#FF4F0B" />
                </BarChart>
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
            <CardTitle>Report Type Distribution</CardTitle>
            <CardDescription>Breakdown of incident types</CardDescription>
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
            <CardTitle>Peak Reporting Hours</CardTitle>
            <CardDescription>When incidents are most commonly reported</CardDescription>
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