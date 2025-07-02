import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, Layers, CalendarIcon, Search, Building2, Ambulance, Waves, Mountain, Building, CircleAlert, Users, ShieldAlert, Activity, Flame, Car, Siren, Home, Navigation } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Layout } from "./Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { MapboxMap } from "./MapboxMap";

// Pin type icons mapping
const pinTypeIcons: Record<string, any> = {
  "Road Crash": Car,
  "Fire": Flame,
  "Medical Emergency": Ambulance,
  "Flooding": Waves,
  "Volcanic Activity": Mountain,
  "Landslide": Mountain,
  "Earthquake": CircleAlert,
  "Civil Disturbance": Users,
  "Armed Conflict": ShieldAlert,
  "Infectious Disease": Activity,
  "Evacuation Centers": Building,
  "Health Facilities": Building2,
  "Police Stations": ShieldAlert,
  "Fire Stations": Flame,
  "Government Offices": Building2,
};

// Facility icons mapping
const facilityIcons: Record<string, any> = {
  evacuationCenters: Building,
  healthFacilities: Building2,
  policeStations: ShieldAlert,
  fireStations: Flame,
  governmentOffices: Building2,
};

// Location icons mapping
const locationIcons: Record<string, any> = {
  residentCurrentLocation: Navigation,
};

export function RiskMapPage() {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [showAddPinTypeDialog, setShowAddPinTypeDialog] = useState(false);
  const [newPinType, setNewPinType] = useState({ name: "", icon: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [newPin, setNewPin] = useState({
    type: "",
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    reportId: ""
  });

  const [accidentFilters, setAccidentFilters] = useState({
    roadCrash: false,
    fire: false,
    medicalEmergency: false,
    flooding: false,
    volcanicActivity: false,
    landslide: false,
    earthquake: false,
    civilDisturbance: false,
    armedConflict: false,
    infectiousDisease: false
  });

  const [facilityFilters, setFacilityFilters] = useState({
    evacuationCenters: false,
    healthFacilities: false,
    policeStations: false,
    fireStations: false,
    governmentOffices: false
  });

  const [locationFilters, setLocationFilters] = useState({
    residentCurrentLocation: false
  });

  const pinTypes = [
    "Road Crash", "Fire", "Medical Emergency", "Flooding", "Volcanic Activity",
    "Landslide", "Earthquake", "Civil Disturbance", "Armed Conflict", "Infectious Disease",
    "Evacuation Centers", "Health Facilities", "Police Stations", "Fire Stations", "Government Offices"
  ];

  const handleAddPin = () => {
    console.log("Adding new pin:", newPin);
    setNewPin({ type: "", title: "", description: "", latitude: "", longitude: "", reportId: "" });
  };

  const handleMapClick = useCallback((event: any) => {
    // Simulate getting coordinates from map click
    const mockLat = (Math.random() * 180 - 90).toFixed(6);
    const mockLng = (Math.random() * 360 - 180).toFixed(6);
    
    setNewPin(prev => ({
      ...prev,
      latitude: mockLat,
      longitude: mockLng
    }));
  }, []);

  const handleAccidentFilterChange = (key: keyof typeof accidentFilters) => {
    setAccidentFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFacilityFilterChange = (key: keyof typeof facilityFilters) => {
    setFacilityFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLocationFilterChange = (key: keyof typeof locationFilters) => {
    setLocationFilters(prev => ({ ...prev, [key]: !prev[key] }));
    // Auto-refresh map when filter changes
    console.log("Filter changed:", key);
  };

  const handleQuickDateFilter = (period: 'week' | 'month' | 'year') => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'week':
        start = startOfWeek(today);
        end = endOfWeek(today);
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'year':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
    }

    setDate({ from: start, to: end });
  };

  const handleSelectAllAccidents = (checked: boolean) => {
    const newFilters = {
      roadCrash: checked,
      fire: checked,
      medicalEmergency: checked,
      flooding: checked,
      volcanicActivity: checked,
      landslide: checked,
      earthquake: checked,
      civilDisturbance: checked,
      armedConflict: checked,
      infectiousDisease: checked
    };
    setAccidentFilters(newFilters);
  };

  const handleSelectAllFacilities = (checked: boolean) => {
    const newFilters = {
      evacuationCenters: checked,
      healthFacilities: checked,
      policeStations: checked,
      fireStations: checked,
      governmentOffices: checked
    };
    setFacilityFilters(newFilters);
  };

  // Get active filters for the map
  const getActiveFilters = () => {
    const activeAccidentTypes = Object.entries(accidentFilters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

    const activeFacilityTypes = Object.entries(facilityFilters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

    return {
      accidentTypes: activeAccidentTypes,
      facilityTypes: activeFacilityTypes
    };
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-[350px] flex-shrink-0 p-4 border-r overflow-y-auto">
          <Tabs defaultValue="add-pin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-pin">Add Pin</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add-pin">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Add New Pin</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Fill out the form below, then click on the map to place your pin.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pin-type">Pin Type</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddPinTypeDialog(true)}
                        className="h-8 px-2 text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Type
                      </Button>
                    </div>
                    <Select value={newPin.type} onValueChange={(value) => setNewPin({ ...newPin, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pin type" />
                      </SelectTrigger>
                      <SelectContent>
                        {pinTypes.map((type) => {
                          const Icon = pinTypeIcons[type] || MapPin;
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center">
                                <Icon className="h-4 w-4 mr-2" />
                                {type}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pin-title">Title</Label>
                    <Input
                      id="pin-title"
                      placeholder="Location name"
                      value={newPin.title}
                      onChange={(e) => setNewPin({ ...newPin, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pin-description">Description</Label>
                    <Input
                      id="pin-description"
                      placeholder="Additional details"
                      value={newPin.description}
                      onChange={(e) => setNewPin({ ...newPin, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="0.000000"
                        value={newPin.latitude}
                        onChange={(e) => setNewPin({ ...newPin, latitude: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="0.000000"
                        value={newPin.longitude}
                        onChange={(e) => setNewPin({ ...newPin, longitude: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-id">Report ID (Optional)</Label>
                    <Input
                      id="report-id"
                      placeholder="REP-001"
                      value={newPin.reportId}
                      onChange={(e) => setNewPin({ ...newPin, reportId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Reference to corresponding report in Manage Reports
                    </p>
                  </div>
                  
                  <Button onClick={handleAddPin} className="w-full bg-[#FF4F0B] text-white hover:bg-[#FF4F0B]/80">
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Pin to Map
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="filters">
              <Card>
                <CardHeader>
                  <CardTitle>Map Filters</CardTitle>
                  <p className="text-sm text-gray-600">
                    Map updates automatically when filters are changed
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timeline */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Timeline</Label>
                    <div className="flex flex-col space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date?.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                              date.to ? (
                                <>
                                  {format(date.from, "LLL dd, y")} -{" "}
                                  {format(date.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(date.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      <Select onValueChange={(value) => handleQuickDateFilter(value as 'week' | 'month' | 'year')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Quick filters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Accident/Hazard Types */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Accident/Hazard Types</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-accidents"
                          checked={Object.values(accidentFilters).every(Boolean)}
                          onCheckedChange={(checked) => handleSelectAllAccidents(checked as boolean)}
                          className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                        />
                        <Label htmlFor="all-accidents" className="text-sm font-normal">
                          All
                        </Label>
                      </div>
                      {Object.entries(accidentFilters).map(([key, checked]) => {
                        const Icon = pinTypeIcons[key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())] || MapPin;
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={checked}
                              onCheckedChange={() => handleAccidentFilterChange(key as keyof typeof accidentFilters)}
                              className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={key} className="text-sm font-normal flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emergency Support Facilities */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Emergency Support Facilities</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-facilities"
                          checked={Object.values(facilityFilters).every(Boolean)}
                          onCheckedChange={(checked) => handleSelectAllFacilities(checked as boolean)}
                          className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                        />
                        <Label htmlFor="all-facilities" className="text-sm font-normal">
                          All
                        </Label>
                      </div>
                      {Object.entries(facilityFilters).map(([key, checked]) => {
                        const Icon = facilityIcons[key] || MapPin;
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={checked}
                              onCheckedChange={() => handleFacilityFilterChange(key as keyof typeof facilityFilters)}
                              className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                            />
                            <Label htmlFor={key} className="text-sm font-normal flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location Filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Location Filters</Label>
                    <div className="space-y-2">
                      {Object.entries(locationFilters).map(([key, checked]) => {
                        const Icon = locationIcons[key] || MapPin;
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={checked}
                              onCheckedChange={() => handleLocationFilterChange(key as keyof typeof locationFilters)}
                            />
                            <Label htmlFor={key} className="text-sm font-normal flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 relative">
          {/* Search Bar */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="max-w-4xl mx-auto flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-10 w-full bg-white shadow-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={cn(
                  "h-10 px-4",
                  showHeatmap && "bg-orange-50 text-orange-600 border-orange-200"
                )}
              >
                <Layers className="h-4 w-4 mr-2" />
                Heatmap {showHeatmap ? "On" : "Off"}
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="w-full h-full bg-gray-100">
            <MapboxMap 
              onMapClick={(lngLat) => {
                setNewPin(prev => ({
                  ...prev,
                  latitude: lngLat.lat.toFixed(6),
                  longitude: lngLat.lng.toFixed(6)
                }));
              }}
              showHeatmap={showHeatmap}
              center={[120.9842, 14.5995]} // Manila coordinates
              zoom={11}
              activeFilters={getActiveFilters()}
            />
            {(newPin.latitude && newPin.longitude) && (
              <div className="absolute bottom-4 left-4 p-2 bg-green-100 text-green-700 rounded shadow-lg">
                Selected: {newPin.latitude}, {newPin.longitude}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Pin Type Dialog */}
      <Dialog open={showAddPinTypeDialog} onOpenChange={setShowAddPinTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Pin Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pin Type Name</Label>
              <Input
                placeholder="Enter pin type name"
                value={newPinType.name}
                onChange={(e) => setNewPinType({ ...newPinType, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={newPinType.icon} onValueChange={(value) => setNewPinType({ ...newPinType, icon: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(pinTypeIcons).map(([name, Icon]) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPinTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Add the new pin type logic here
              setShowAddPinTypeDialog(false);
            }}>
              Add Pin Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
