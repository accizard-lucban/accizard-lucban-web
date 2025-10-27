import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MapPin, Layers, CalendarIcon, Search, Building2, Ambulance, Waves, Mountain, Building, CircleAlert, Users, ShieldAlert, Activity, Flame, Car, Siren, Home, Navigation, RotateCcw, HelpCircle, Info, ZoomIn, ZoomOut, LocateFixed, X, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn, ensureOk } from "@/lib/utils";
import { Layout } from "./Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { MapboxMap } from "./MapboxMap";
import { usePins } from "@/hooks/usePins";
import { Pin, PinType } from "@/types/pin";
import { toast } from "@/components/ui/sonner";
import { PinModal, PinFormData } from "./PinModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

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
  "Others": HelpCircle,
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


export function RiskMapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { createPin, updatePin, subscribeToPins, deletePin, loading: pinLoading } = usePins();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [quickDateFilter, setQuickDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([121.5556, 14.1139]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isFromReport, setIsFromReport] = useState(false); // Track if data came from a report
  const [pins, setPins] = useState<Pin[]>([]); // Store pins from database
  
  // Pin Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"create" | "edit">("create");
  const [editingPin, setEditingPin] = useState<Pin | undefined>(undefined);
  const [pinModalPrefill, setPinModalPrefill] = useState<Partial<PinFormData> | undefined>(undefined);
  const [tempClickedLocation, setTempClickedLocation] = useState<{ lat: number; lng: number; locationName: string } | null>(null);
  
  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pinToDelete, setPinToDelete] = useState<string | null>(null);
  
  // Filters Panel State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [mapLayerStyle, setMapLayerStyle] = useState<'streets' | 'satellite'>('streets');

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
    infectiousDisease: false,
    others: false
  });

  const [facilityFilters, setFacilityFilters] = useState({
    evacuationCenters: false,
    healthFacilities: false,
    policeStations: false,
    fireStations: false,
    governmentOffices: false
  });


  // Accident/Hazard types
  const accidentHazardTypes = [
    "Road Crash", "Fire", "Medical Emergency", "Flooding", "Volcanic Activity",
    "Landslide", "Earthquake", "Civil Disturbance", "Armed Conflict", "Infectious Disease", "Others"
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
      
      const data = await ensureOk(await fetch(url)).then(r => r.json());
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.place_name || feature.text || 'Unknown Location';
      } else {
        return 'Unknown Location';
      }
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      return 'Geocoding failed';
    }
  };

  // Geocoding search with Mapbox API
  const handleGeocodingSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      return;
    }

    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.error('Mapbox access token not found');
        return;
      }

      // Add proximity bias to Lucban, Quezon for better local results
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=5&proximity=121.5556,14.1139&country=PH`;
      
      const data = await ensureOk(await fetch(url)).then(r => r.json());
      setSearchSuggestions(data.features || []);
      setIsSearchOpen(data.features && data.features.length > 0);
    } catch (error: any) {
      console.error('Error fetching geocoding results:', error);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
    }
  }, []);

  // Debounce geocoding search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleGeocodingSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleGeocodingSearch]);

  // Handle selecting a search result
  const handleSelectSearchResult = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    const placeName = feature.place_name || feature.text || 'Selected location';
    
    // Update map center and zoom
    setMapCenter([lng, lat]);
    setMapZoom(15); // Zoom in to show the location
    
    // Update search query with selected location
    setSearchQuery(placeName);
    
    // Close dropdown
    setIsSearchOpen(false);
    
    toast.success(`Navigated to ${placeName}`);
  };

  // Effect to populate modal when navigating from a report
  useEffect(() => {
    const state = location.state as any;
    console.log("Location state changed:", state);
    if (state && state.report) {
      const report = state.report;
      console.log("Loading report data from Manage Reports:", report);
      
      // Open the modal with pre-filled data
      setPinModalMode("create");
      setPinModalPrefill({
        type: report.type || "",
        title: "", // Keep title empty for admin to customize
        latitude: report.latitude || null,
        longitude: report.longitude || null,
        locationName: report.location || "",
        reportId: report.id || ""
      });
      setIsPinModalOpen(true);
      
      // Clear the location state to prevent it from persisting on refresh
      navigate("/risk-map", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleAccidentFilterChange = (key: keyof typeof accidentFilters) => {
    const isCurrentlyChecked = accidentFilters[key];
    
    // If unchecking, allow it
    if (isCurrentlyChecked) {
      setAccidentFilters(prev => ({ ...prev, [key]: false }));
      return;
    }
    
    // If checking, count total active filters
    const totalActive = Object.values(accidentFilters).filter(Boolean).length + 
                        Object.values(facilityFilters).filter(Boolean).length;
    
    if (totalActive >= 10) {
      toast.error('Maximum 10 filter types can be selected at once');
      return;
    }
    
    setAccidentFilters(prev => ({ ...prev, [key]: true }));
  };

  const handleFacilityFilterChange = (key: keyof typeof facilityFilters) => {
    const isCurrentlyChecked = facilityFilters[key];
    
    // If unchecking, allow it
    if (isCurrentlyChecked) {
      setFacilityFilters(prev => ({ ...prev, [key]: false }));
      return;
    }
    
    // If checking, count total active filters
    const totalActive = Object.values(accidentFilters).filter(Boolean).length + 
                        Object.values(facilityFilters).filter(Boolean).length;
    
    if (totalActive >= 10) {
      toast.error('Maximum 10 filter types can be selected at once');
      return;
    }
    
    setFacilityFilters(prev => ({ ...prev, [key]: true }));
  };


  const handleQuickDateFilter = (period: 'all' | 'week' | 'month' | 'year') => {
    setQuickDateFilter(period);
    if (period === 'all') {
      setDate(undefined);
      return;
    }
    
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
    if (checked) {
      // Count total if we select all accidents
      const accidentCount = Object.keys(accidentFilters).length;
      const facilityActiveCount = Object.values(facilityFilters).filter(Boolean).length;
      const totalWouldBe = accidentCount + facilityActiveCount;
      
      if (totalWouldBe > 10) {
        toast.error('Cannot select all: Maximum 10 filter types allowed. Please unselect some facility filters first.');
        return;
      }
    }
    
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
      infectiousDisease: checked,
      others: checked
    };
    setAccidentFilters(newFilters);
  };

  const handleSelectAllFacilities = (checked: boolean) => {
    if (checked) {
      // Count total if we select all facilities
      const facilityCount = Object.keys(facilityFilters).length;
      const accidentActiveCount = Object.values(accidentFilters).filter(Boolean).length;
      const totalWouldBe = facilityCount + accidentActiveCount;
      
      if (totalWouldBe > 10) {
        toast.error('Cannot select all: Maximum 10 filter types allowed. Please unselect some accident filters first.');
        return;
      }
    }
    
    const newFilters = {
      evacuationCenters: checked,
      healthFacilities: checked,
      policeStations: checked,
      fireStations: checked,
      governmentOffices: checked
    };
    setFacilityFilters(newFilters);
  };

  // New Modal-based Pin Management Handlers
  const handleEditPin = (pin: Pin) => {
    console.log("Edit pin:", pin);
    setPinModalMode("edit");
    setEditingPin(pin);
    setPinModalPrefill({
      type: pin.type,
      title: pin.title,
      latitude: pin.latitude,
      longitude: pin.longitude,
      locationName: pin.locationName,
      reportId: pin.reportId
    });
    setIsPinModalOpen(true);
  };

  const handleDeletePinClick = (pinId: string) => {
    console.log("Delete pin:", pinId);
    setPinToDelete(pinId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pinToDelete) return;
    
    try {
      await deletePin(pinToDelete);
      toast.success("Pin deleted successfully");
      setIsDeleteDialogOpen(false);
      setPinToDelete(null);
    } catch (error: any) {
      console.error("Error deleting pin:", error);
      toast.error(error.message || "Failed to delete pin");
    }
  };

  const handleSavePin = async (pinData: PinFormData) => {
    try {
      if (pinModalMode === "create") {
        // Create new pin
        if (!pinData.latitude || !pinData.longitude) {
          toast.error("Please select a location on the map");
          return;
        }

        const pinId = await createPin({
          type: pinData.type as PinType,
          title: pinData.title,
          latitude: pinData.latitude,
          longitude: pinData.longitude,
          locationName: pinData.locationName || 'Unknown Location',
          reportId: pinData.reportId || undefined
        });

        console.log("Pin created successfully with ID:", pinId);
        toast.success(`Pin "${pinData.title}" added successfully!`);
      } else if (pinModalMode === "edit" && editingPin) {
        // Update existing pin
        await updatePin(editingPin.id, {
          type: pinData.type as PinType,
          title: pinData.title,
          latitude: pinData.latitude!,
          longitude: pinData.longitude!,
          locationName: pinData.locationName
        });

        console.log("Pin updated successfully");
        toast.success(`Pin "${pinData.title}" updated successfully!`);
      }

      setIsPinModalOpen(false);
      setPinModalPrefill(undefined);
      setEditingPin(undefined);
    } catch (error: any) {
      console.error("Error saving pin:", error);
      toast.error(error.message || "Failed to save pin");
      throw error; // Re-throw to keep modal open
    }
  };

  // Convert camelCase filter key to PinType display name
  const convertFilterKeyToType = (key: string): string => {
    // Direct mapping to ensure exact match with PinType values
    const typeMapping: Record<string, string> = {
      // Accident/Hazard Types
      'roadCrash': 'Road Crash',
      'fire': 'Fire',
      'medicalEmergency': 'Medical Emergency',
      'flooding': 'Flooding',
      'volcanicActivity': 'Volcanic Activity',
      'landslide': 'Landslide',
      'earthquake': 'Earthquake',
      'civilDisturbance': 'Civil Disturbance',
      'armedConflict': 'Armed Conflict',
      'infectiousDisease': 'Infectious Disease',
      'others': 'Others',
      // Emergency Facilities
      'evacuationCenters': 'Evacuation Centers',
      'healthFacilities': 'Health Facilities',
      'policeStations': 'Police Stations',
      'fireStations': 'Fire Stations',
      'governmentOffices': 'Government Offices'
    };
    
    return typeMapping[key] || key;
  };

  // Get active filters for the map
  const getActiveFilters = () => {
    const activeAccidentTypes = Object.entries(accidentFilters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => convertFilterKeyToType(key));

    const activeFacilityTypes = Object.entries(facilityFilters)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => convertFilterKeyToType(key));

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
        const type = convertFilterKeyToType(key) as PinType;
        activeTypes.push(type);
      }
    });
    
    Object.entries(facilityFilters).forEach(([key, isActive]) => {
      if (isActive) {
        const type = convertFilterKeyToType(key) as PinType;
        activeTypes.push(type);
      }
    });
    
    return activeTypes;
  };

  // Map reference for controlling zoom and location
  const mapRef = useRef<{ zoomIn: () => void; zoomOut: () => void; locateUser: () => void } | null>(null);

  // Handler functions for map controls
  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 1));
  };

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([longitude, latitude]);
          setMapZoom(15);
          toast.success("Location found!");
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error("Could not get your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  // Subscribe to pins from database with real-time updates
  useEffect(() => {
    const activeTypes = getActiveFilterTypes();
    
    // Build filter object
    const filters: any = {
      searchQuery: searchQuery
    };

    // Since we enforce a 10-item limit, we can safely use Firestore filtering
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
        // Only show error toast if it's a real error, not just "no pins found"
        if (error.message && !error.message.includes('permission-denied')) {
          toast.error('Failed to fetch pins from database');
        }
      }
    );

    return () => {
      console.log('Unsubscribing from pins');
      unsubscribe();
    };
  }, [accidentFilters, facilityFilters, date, searchQuery, subscribeToPins]);

  return (
    <Layout>
      <TooltipProvider>
        <div className="flex h-[calc(100vh-12rem)] min-h-[650px] -mx-6 -my-6">
          {/* Map takes full width - no sidebar */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Map Container */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden min-h-0 rounded-xl">
              {/* Map Toolbar - Positioned inside map at top */}
              <div className="absolute top-4 left-4 right-4 z-10 bg-white border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-lg rounded-lg">
                <div className="flex-1 relative">
                  <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                        <Input
                          type="text"
                          placeholder="Search for a location..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                          }}
                          onFocus={() => {
                            if (searchSuggestions.length > 0) {
                              setIsSearchOpen(true);
                            }
                          }}
                          className="pl-9 pr-4 h-9 w-full border-gray-300"
                        />
                      </div>
                    </PopoverTrigger>
                    {searchSuggestions.length > 0 && (
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <div className="max-h-[300px] overflow-y-auto">
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                              onClick={() => handleSelectSearchResult(suggestion)}
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {suggestion.text}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {suggestion.place_name}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                {/* Filters Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => setIsFiltersOpen(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter pins by type and date</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Map Legend Button */}
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3"
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Legend
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show map legend</p>
                    </TooltipContent>
                  </Tooltip>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Map Legend</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {/* Accident/Hazard Types Section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Accident/Hazard Types</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3">
                        <img src="/markers/road-crash.svg" alt="Road Crash" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Road Crash</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/fire.svg" alt="Fire" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Fire</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/medical-emergency.svg" alt="Medical Emergency" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Medical Emergency</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/flooding.svg" alt="Flooding" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Flooding</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/volcano.svg" alt="Volcanic Activity" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Volcanic Activity</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/landslide.svg" alt="Landslide" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Landslide</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/earthquake.svg" alt="Earthquake" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Earthquake</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/civil-disturbance.svg" alt="Civil Disturbance" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Civil Disturbance</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/armed-conflict.svg" alt="Armed Conflict" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Armed Conflict</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/infectious-disease.svg" alt="Infectious Disease" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Infectious Disease</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/default.svg" alt="Others" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Others</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Facilities Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Emergency Facilities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3">
                        <img src="/markers/evacuation-center.svg" alt="Evacuation Centers" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Evacuation Centers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/health-facility.svg" alt="Health Facilities" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Health Facilities</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/police-station.svg" alt="Police Stations" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Police Stations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/fire-station.svg" alt="Fire Stations" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Fire Stations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src="/markers/government-office.svg" alt="Government Offices" className="w-10 h-10 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Government Offices</span>
                      </div>
                    </div>
                  </div>
                                    </div>
                  </DialogContent>
                </Dialog>

                {/* Map Layer Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => setMapLayerStyle(mapLayerStyle === 'streets' ? 'satellite' : 'streets')}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      {mapLayerStyle === 'streets' ? 'Satellite' : 'Streets'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch to {mapLayerStyle === 'streets' ? 'Satellite' : 'Streets'} view</p>
                  </TooltipContent>
                </Tooltip>

                {/* Heatmap Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-3",
                        showHeatmap && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setShowHeatmap(!showHeatmap)}
                    >
                      <Flame className="h-4 w-4 mr-2" />
                      Heatmap
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle heatmap display</p>
                  </TooltipContent>
                </Tooltip>

                {/* Zoom and Location Controls */}
                <div className="flex items-center border-l border-gray-200 pl-3 gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={handleZoomIn}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom in</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={handleZoomOut}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom out</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={handleLocateUser}
                      >
                        <LocateFixed className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show my location</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <MapboxMap 
              onMapClick={async (lngLat) => {
                console.log("=== MAP CLICK EVENT ===");
                console.log("Clicked coordinates:", lngLat);
                
                // Reverse geocode to get location name
                const locationName = await reverseGeocode(lngLat.lat.toString(), lngLat.lng.toString());
                
                // If modal is already open (create mode), just update coordinates
                if (isPinModalOpen && pinModalMode === "create") {
                  console.log("Modal is open - updating prefill");
                  setPinModalPrefill(prev => ({
                    ...prev,
                    latitude: lngLat.lat,
                    longitude: lngLat.lng,
                    locationName: locationName
                  }));
                  toast.success("Location updated!");
                } else {
                  // Modal not open - open it with the clicked location
                  console.log("Opening modal with clicked location");
                  setPinModalMode("create");
                  setPinModalPrefill({
                    type: "",
                    title: "",
                    latitude: lngLat.lat,
                    longitude: lngLat.lng,
                    locationName: locationName,
                    reportId: undefined
                  });
                  setIsPinModalOpen(true);
                  toast.success("Location selected! Fill in pin details.");
                }
              }}
              showHeatmap={showHeatmap}
              showDirections={false}
              pins={pins}
              center={mapCenter}
              zoom={mapZoom}
              activeFilters={getActiveFilters()}
              singleMarker={
                // Show temporary marker when modal is open with coordinates
                isPinModalOpen && pinModalPrefill?.latitude && pinModalPrefill?.longitude
                  ? {
                      id: 'temp-marker',
                      type: pinModalPrefill.type || 'Default',
                      title: pinModalPrefill.title || pinModalPrefill.locationName || 'New Pin Location',
                      description: pinModalPrefill.locationName || 'Click to set location',
                      reportId: pinModalPrefill.reportId,
                      coordinates: [pinModalPrefill.longitude, pinModalPrefill.latitude] as [number, number],
                      locationName: pinModalPrefill.locationName,
                      latitude: pinModalPrefill.latitude,
                      longitude: pinModalPrefill.longitude
                    }
                  : undefined
              }
              canEdit={true}
              onEditPin={handleEditPin}
              onDeletePin={handleDeletePinClick}
              hideStyleToggle={true}
              externalStyle={mapLayerStyle}
                      />
            
            {/* Pin Modal for Create/Edit - positioned within map container */}
            <PinModal
              isOpen={isPinModalOpen}
              onClose={() => {
                setIsPinModalOpen(false);
                setPinModalPrefill(undefined);
                setEditingPin(undefined);
              }}
              onSave={handleSavePin}
              mode={pinModalMode}
              existingPin={editingPin}
              prefillData={pinModalPrefill}
            />
            
            {/* Filters Overlay - positioned within map container */}
            {isFiltersOpen && (
              <div
                className={cn(
                  "bg-white shadow-2xl transition-transform duration-300 ease-in-out",
                  "absolute left-0 top-0 h-full w-[450px] z-50 flex flex-col"
                )}
              >
                <style>{`
                  .filters-scrollable::-webkit-scrollbar {
                    width: 8px;
                  }
                  .filters-scrollable::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                  }
                  .filters-scrollable::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                  }
                  .filters-scrollable::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>
                {/* Header */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-[#FF4F0B]" />
                      <h2 className="text-lg font-semibold">Map Filters</h2>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsFiltersOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div 
                  className="flex-1 overflow-y-auto px-6 py-4 filters-scrollable" 
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  <div className="space-y-6">
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
                      <Label className="text-sm font-medium">Accident/Hazard Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(accidentFilters).map(([key, checked]) => {
                          const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          const Icon = pinTypeIcons[displayName] || MapPin;
                          return (
                            <button
                              key={key}
                              onClick={() => handleAccidentFilterChange(key as keyof typeof accidentFilters)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border",
                                checked 
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Emergency Support Facilities */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Emergency Support Facilities</Label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(facilityFilters).map(([key, checked]) => {
                          const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          const Icon = facilityIcons[key] || MapPin;
                          return (
                            <button
                              key={key}
                              onClick={() => handleFacilityFilterChange(key as keyof typeof facilityFilters)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors border",
                                checked 
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pin? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPinToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </TooltipProvider>
    </Layout>
  );
}
