import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Layers, CalendarIcon, Search, Building2, Ambulance, Waves, Mountain, Building, CircleAlert, Users, ShieldAlert, Activity, Flame, Car, Siren, Home, Navigation, RotateCcw, HelpCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Layout } from "./Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { MapboxMap } from "./MapboxMap";
import { usePins } from "@/hooks/usePins";
import { Pin, PinType } from "@/types/pin";
import { toast } from "@/components/ui/sonner";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { createPin, subscribeToPins, deletePin, loading: pinLoading } = usePins();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFromReport, setIsFromReport] = useState(false); // Track if data came from a report
  const [pins, setPins] = useState<Pin[]>([]); // Store pins from database
  const [newPin, setNewPin] = useState({
    type: "",
    title: "",
    latitude: "",
    longitude: "",
    locationName: "",
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

  // Accident/Hazard types
  const accidentHazardTypes = [
    "Road Crash", "Fire", "Medical Emergency", "Flooding", "Volcanic Activity",
    "Landslide", "Earthquake", "Civil Disturbance", "Armed Conflict", "Infectious Disease"
  ];

  // Emergency facility types
  const emergencyFacilityTypes = [
    "Evacuation Centers", "Health Facilities", "Police Stations", "Fire Stations", "Government Offices"
  ];

  // Combined pin types (for backward compatibility)
  const pinTypes = [...accidentHazardTypes, ...emergencyFacilityTypes];

  // Function to reverse geocode coordinates to get location name
  const reverseGeocode = async (lat: string, lng: string) => {
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return "Invalid coordinates";
      }

      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        return "Geocoding unavailable";
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.place_name || feature.text || 'Unknown Location';
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Geocoding failed';
    }
  };

  // Effect to populate form when navigating from a report
  useEffect(() => {
    const state = location.state as any;
    console.log("Location state changed:", state);
    if (state && state.report) {
      const report = state.report;
      console.log("Loading report data:", report);
      setNewPin({
        type: report.type || "",
        title: "", // Keep title empty for admin to customize
        latitude: report.latitude?.toString() || "",
        longitude: report.longitude?.toString() || "",
        locationName: report.location || "",
        reportId: report.id || ""
      });
      setIsFromReport(true);
      console.log("isFromReport set to true");
      
      // Clear the location state to prevent it from persisting on refresh
      navigate("/risk-map", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Debug effect to track isFromReport changes
  useEffect(() => {
    console.log("isFromReport changed to:", isFromReport);
  }, [isFromReport]);

  // Effect to reverse geocode when latitude/longitude changes (only if not from report)
  useEffect(() => {
    // Skip reverse geocoding if data came from a report
    if (isFromReport) {
      return;
    }

    const fetchLocationName = async () => {
      if (newPin.latitude && newPin.longitude) {
        setNewPin(prev => ({ ...prev, locationName: "Loading..." }));
        const locationName = await reverseGeocode(newPin.latitude, newPin.longitude);
        setNewPin(prev => ({ ...prev, locationName }));
      } else {
        setNewPin(prev => ({ ...prev, locationName: "" }));
      }
    };

    // Debounce the geocoding call
    const timer = setTimeout(() => {
      fetchLocationName();
    }, 500);

    return () => clearTimeout(timer);
  }, [newPin.latitude, newPin.longitude, isFromReport]);

  const handleAddPin = async () => {
    try {
      // Validation
      if (!newPin.type) {
        toast.error("Please select a pin type");
        return;
      }
      if (!newPin.title || newPin.title.trim() === "") {
        toast.error("Please enter a title for the pin");
        return;
      }
      if (!newPin.latitude || !newPin.longitude) {
        toast.error("Please select a location on the map");
        return;
      }

      const lat = parseFloat(newPin.latitude);
      const lng = parseFloat(newPin.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Invalid coordinates");
        return;
      }

      console.log("Creating pin in database:", newPin);

      // Create pin in database
      const pinId = await createPin({
        type: newPin.type as PinType,
        title: newPin.title,
        latitude: lat,
        longitude: lng,
        locationName: newPin.locationName || 'Unknown Location',
        reportId: newPin.reportId || undefined
      });

      console.log("Pin created successfully with ID:", pinId);
      
      toast.success(`Pin "${newPin.title}" added to map successfully!`);
      
      // Clear form
      setNewPin({ type: "", title: "", latitude: "", longitude: "", locationName: "", reportId: "" });
      setIsFromReport(false);
    } catch (error: any) {
      console.error("Error adding pin:", error);
      toast.error(error.message || "Failed to add pin. Please try again.");
    }
  };

  const handleClearForm = () => {
    setNewPin({ type: "", title: "", latitude: "", longitude: "", locationName: "", reportId: "" });
    setIsFromReport(false);
  };

  const hasFormData = () => {
    return newPin.type || newPin.title || newPin.latitude || newPin.longitude || newPin.reportId;
  };

  const handleMapClick = useCallback((event: any) => {
    // Don't allow map clicks to change coordinates if data came from a report
    if (isFromReport) {
      return;
    }
    
    // Simulate getting coordinates from map click
    const mockLat = (Math.random() * 180 - 90).toFixed(6);
    const mockLng = (Math.random() * 360 - 180).toFixed(6);
    
    setNewPin(prev => ({
      ...prev,
      latitude: mockLat,
      longitude: mockLng,
      locationName: "" // Will be populated by useEffect
    }));
  }, [isFromReport]);

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

  // Get active filter types as PinType array
  const getActiveFilterTypes = (): PinType[] => {
    const activeTypes: PinType[] = [];
    
    Object.entries(accidentFilters).forEach(([key, isActive]) => {
      if (isActive) {
        const type = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim() as PinType;
        activeTypes.push(type);
      }
    });
    
    Object.entries(facilityFilters).forEach(([key, isActive]) => {
      if (isActive) {
        const type = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim() as PinType;
        activeTypes.push(type);
      }
    });
    
    return activeTypes;
  };

  // Subscribe to pins from database with real-time updates
  useEffect(() => {
    const activeTypes = getActiveFilterTypes();
    
    // Build filter object
    const filters: any = {
      searchQuery: searchQuery
    };

    // Only filter by types if at least one filter is active
    if (activeTypes.length > 0) {
      filters.types = activeTypes;
    }

    // Add date range filters
    if (date?.from) {
      filters.dateFrom = date.from;
    }
    if (date?.to) {
      filters.dateTo = date.to;
    }

    console.log('Subscribing to pins with filters:', filters);

    const unsubscribe = subscribeToPins(
      filters,
      (fetchedPins) => {
        console.log('Pins updated from database:', fetchedPins.length);
        setPins(fetchedPins);
      },
      (error) => {
        console.error('Error fetching pins:', error);
        toast.error('Failed to fetch pins from database');
      }
    );

    return () => {
      console.log('Unsubscribing from pins');
      unsubscribe();
    };
  }, [accidentFilters, facilityFilters, date, searchQuery]);

  return (
    <Layout>
      <TooltipProvider>
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
                    {isFromReport 
                      ? "Pin this report on the map. You can customize the marker title."
                      : "Fill out the form below, then click on the map to place your pin."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin-type">Pin Type</Label>
                    <Select value={newPin.type} onValueChange={(value) => setNewPin({ ...newPin, type: value })} disabled={isFromReport}>
                      <SelectTrigger className={cn(isFromReport && "bg-gray-50 cursor-not-allowed")}>
                        <SelectValue placeholder="Select pin type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-xs font-semibold text-gray-600 px-2 py-1.5">Accident/Hazard Types</SelectLabel>
                          {accidentHazardTypes.map((type) => {
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
                        </SelectGroup>
                        
                        <SelectSeparator className="my-1" />
                        
                        <SelectGroup>
                          <SelectLabel className="text-xs font-semibold text-gray-600 px-2 py-1.5">Emergency Facilities</SelectLabel>
                          {emergencyFacilityTypes.map((type) => {
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
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="pin-title">Title</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            For <span className="font-semibold">Emergency Facilities</span>: Enter the facility name (e.g., "St. Mary's Hospital", "Barangay Hall").<br/><br/>
                            For <span className="font-semibold">Accidents/Hazards</span>: Enter a distinguishable title (e.g., "Highway Junction Crash", "Forest Fire Area").
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="pin-title"
                        placeholder="Enter marker title"
                        value={newPin.title}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 60) {
                            setNewPin({ ...newPin, title: value });
                          }
                        }}
                        maxLength={60}
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {newPin.title.length}/60 characters
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="0.000000"
                        value={newPin.latitude}
                        onChange={(e) => {
                          if (!isFromReport) {
                            setNewPin({ ...newPin, latitude: e.target.value });
                          }
                        }}
                        disabled={isFromReport}
                        className={cn(isFromReport && "bg-gray-50 cursor-not-allowed")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="0.000000"
                        value={newPin.longitude}
                        onChange={(e) => {
                          if (!isFromReport) {
                            setNewPin({ ...newPin, longitude: e.target.value });
                          }
                        }}
                        disabled={isFromReport}
                        className={cn(isFromReport && "bg-gray-50 cursor-not-allowed")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      placeholder="Auto-filled from coordinates"
                      value={newPin.locationName}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="report-id">Report ID</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">
                            {isFromReport 
                              ? "Report ID from Manage Reports. This links the pin to the emergency report." 
                              : "Auto-filled when pinning from Manage Reports"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="report-id"
                      placeholder="Auto-filled from report"
                      value={newPin.reportId}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddPin} 
                      className="flex-1 bg-[#FF4F0B] text-white hover:bg-[#FF4F0B]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={pinLoading}
                    >
                      {pinLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding Pin...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Add Pin to Map
                        </>
                      )}
                    </Button>
                    {hasFormData() && !pinLoading && (
                      <Button 
                        onClick={handleClearForm} 
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-100"
                        title="Clear form"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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

        <div className="flex-1 flex flex-col">
          {/* Map Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 h-9 w-full border-gray-300"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                "h-9 px-3",
                showHeatmap && "bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
              )}
            >
              <Layers className="h-4 w-4 mr-2" />
              Heatmap
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 bg-gray-100">
            <MapboxMap 
              onMapClick={(lngLat) => {
                console.log("=== MAP CLICK EVENT ===");
                console.log("Clicked coordinates:", lngLat);
                console.log("Latitude (raw):", lngLat.lat);
                console.log("Longitude (raw):", lngLat.lng);
                console.log("Current isFromReport value:", isFromReport);
                
                if (isFromReport) {
                  console.log("Blocked: Cannot change coordinates from a report");
                  return;
                }
                
                const newLat = lngLat.lat.toFixed(6);
                const newLng = lngLat.lng.toFixed(6);
                console.log("Formatted latitude:", newLat);
                console.log("Formatted longitude:", newLng);
                console.log("Setting newPin state...");
                
                setNewPin(prev => {
                  const updated = {
                    ...prev,
                    latitude: newLat,
                    longitude: newLng
                  };
                  console.log("New pin state:", updated);
                  return updated;
                });
              }}
              showHeatmap={showHeatmap}
              showDirections={false}
              pins={pins}
              center={
                (() => {
                  const lat = parseFloat(newPin.latitude);
                  const lng = parseFloat(newPin.longitude);
                  const hasValidCoords = newPin.latitude && newPin.longitude && !isNaN(lat) && !isNaN(lng);
                  return hasValidCoords ? [lng, lat] : [121.5556, 14.1139]; // Lucban, Quezon coordinates
                })()
              }
              zoom={
                (() => {
                  const lat = parseFloat(newPin.latitude);
                  const lng = parseFloat(newPin.longitude);
                  const hasValidCoords = newPin.latitude && newPin.longitude && !isNaN(lat) && !isNaN(lng);
                  return hasValidCoords ? 15 : 13;
                })()
              }
              activeFilters={!isFromReport && !newPin.latitude && !newPin.longitude ? getActiveFilters() : undefined}
              singleMarker={
                (() => {
                  console.log('=== MARKER CREATION ===');
                  console.log('newPin.latitude (string):', newPin.latitude, typeof newPin.latitude);
                  console.log('newPin.longitude (string):', newPin.longitude, typeof newPin.longitude);
                  
                  // Validate coordinates before creating marker
                  const lat = parseFloat(newPin.latitude);
                  const lng = parseFloat(newPin.longitude);
                  
                  console.log('Parsed lat:', lat, typeof lat, 'isNaN:', isNaN(lat));
                  console.log('Parsed lng:', lng, typeof lng, 'isNaN:', isNaN(lng));
                  
                  // Check if coordinates are valid numbers
                  const hasValidCoords = newPin.latitude && newPin.longitude && !isNaN(lat) && !isNaN(lng);
                  
                  console.log('Has valid coords:', hasValidCoords);
                  
                  if (!hasValidCoords) {
                    console.log('No valid coordinates, returning undefined (no marker)');
                    return undefined;
                  }
                  
                  const marker = {
                    id: newPin.reportId || 'temp-marker',
                    type: newPin.type || 'Default',
                    title: newPin.title || newPin.locationName || 'Selected Location',
                    description: newPin.locationName || 'Temporary marker',
                    reportId: newPin.reportId,
                    coordinates: [lng, lat] as [number, number],
                    locationName: newPin.locationName,
                    latitude: lat,
                    longitude: lng
                  };
                  
                  console.log('Created marker object:', marker);
                  console.log('Marker coordinates array [lng, lat]:', marker.coordinates);
                  
                  return marker;
                })()
              }
            />
          </div>
        </div>
      </div>
      </TooltipProvider>
    </Layout>
  );
}
