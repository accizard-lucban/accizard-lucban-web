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
import { Plus, MapPin, Layers, CalendarIcon, Search, Building2, Ambulance, Waves, Mountain, Building, CircleAlert, Users, ShieldAlert, Activity, Flame, Car, Siren, Home, Navigation, RotateCcw, HelpCircle, Info } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Layout } from "./Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { MapboxMap } from "./MapboxMap";
import { usePins } from "@/hooks/usePins";
import { Pin, PinType } from "@/types/pin";
import { toast } from "@/components/ui/sonner";
import { PinModal, PinFormData } from "./PinModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

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
  const { createPin, updatePin, subscribeToPins, deletePin, loading: pinLoading } = usePins();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFromReport, setIsFromReport] = useState(false); // Track if data came from a report
  const [pins, setPins] = useState<Pin[]>([]); // Store pins from database
  
  // Pin Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"create" | "edit">("create");
  const [editingPin, setEditingPin] = useState<Pin | undefined>(undefined);
  const [pinModalPrefill, setPinModalPrefill] = useState<Partial<PinFormData> | undefined>(undefined);
  
  // Map Click Popup State
  const [isMapClickPopupOpen, setIsMapClickPopupOpen] = useState(false);
  const [mapClickLocation, setMapClickLocation] = useState<{ lng: number; lat: number; locationName: string } | null>(null);
  
  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pinToDelete, setPinToDelete] = useState<string | null>(null);
  
  // Filters Panel State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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

  // Map Click Popup Handlers
  const handleAddPinFromPopup = () => {
    if (!mapClickLocation) return;
    
    // Close the popup
    setIsMapClickPopupOpen(false);
    
    // Open the modal with the clicked location
    setPinModalMode("create");
    setPinModalPrefill({
      type: "",
      title: "",
      latitude: mapClickLocation.lat,
      longitude: mapClickLocation.lng,
      locationName: mapClickLocation.locationName,
      reportId: undefined
    });
    setIsPinModalOpen(true);
    
    // Clear the popup location
    setMapClickLocation(null);
    
    toast.success("Location selected! Fill in pin details.");
  };

  const handleCloseMapClickPopup = () => {
    setIsMapClickPopupOpen(false);
    setMapClickLocation(null);
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
          {/* Map takes full width - no sidebar */}
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

            {/* Filters Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFiltersOpen(true)}
                  className="h-9 px-3"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter pins by type and date</p>
              </TooltipContent>
            </Tooltip>
            
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#EF4444', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🚗
                    </div>
                        <span className="text-sm text-gray-700">Road Crash</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#F97316', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🔥
                        </div>
                        <span className="text-sm text-gray-700">Fire</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#EC4899', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🚑
                        </div>
                        <span className="text-sm text-gray-700">Medical Emergency</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#3B82F6', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🌊
                        </div>
                        <span className="text-sm text-gray-700">Flooding</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#F59E0B', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🌋
                        </div>
                        <span className="text-sm text-gray-700">Volcanic Activity</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#78350F', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          ⛰️
                        </div>
                        <span className="text-sm text-gray-700">Landslide</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#DC2626', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          ⚠️
                        </div>
                        <span className="text-sm text-gray-700">Earthquake</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#7C3AED', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          👥
                        </div>
                        <span className="text-sm text-gray-700">Civil Disturbance</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#991B1B', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🛡️
                        </div>
                        <span className="text-sm text-gray-700">Armed Conflict</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#059669', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🦠
                        </div>
                        <span className="text-sm text-gray-700">Infectious Disease</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Facilities Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Emergency Facilities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#8B5CF6', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🏢
                    </div>
                        <span className="text-sm text-gray-700">Evacuation Centers</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#10B981', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🏥
                        </div>
                        <span className="text-sm text-gray-700">Health Facilities</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#3B82F6', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🚔
                        </div>
                        <span className="text-sm text-gray-700">Police Stations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#DC2626', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🚒
                        </div>
                        <span className="text-sm text-gray-700">Fire Stations</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#6366F1', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          🏛️
                        </div>
                        <span className="text-sm text-gray-700">Government Offices</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Map Container */}
          <div className="flex-1 bg-gray-100">
            <MapboxMap 
              onMapClick={async (lngLat) => {
                console.log("=== MAP CLICK EVENT ===");
                console.log("Clicked coordinates:", lngLat);
                
                // Don't show popup if modal is already open
                if (isPinModalOpen) {
                  console.log("Modal is open - ignoring map click");
                  return;
                }
                
                // Reverse geocode to get location name
                const locationName = await reverseGeocode(lngLat.lat.toString(), lngLat.lng.toString());
                
                // Show popup with Add Pin button
                console.log("Showing map click popup");
                setMapClickLocation({
                  lng: lngLat.lng,
                  lat: lngLat.lat,
                  locationName: locationName
                });
                setIsMapClickPopupOpen(true);
              }}
              showHeatmap={showHeatmap}
              showDirections={false}
              pins={pins}
              center={[121.5556, 14.1139]} // Default to Lucban, Quezon
              zoom={13}
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
                      />
                    </div>
                  </div>
                  </div>

      {/* Pin Modal for Create/Edit */}
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

      {/* Map Click Popup */}
      <Dialog open={isMapClickPopupOpen} onOpenChange={handleCloseMapClickPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Add Pin at This Location?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Location:</strong> {mapClickLocation?.locationName}
              </p>
              <p className="text-xs text-gray-500">
                <strong>Coordinates:</strong> {mapClickLocation?.lat.toFixed(6)}, {mapClickLocation?.lng.toFixed(6)}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Click "Add Pin" to open the pin creation form with this location pre-filled.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseMapClickPopup}>
              Cancel
            </Button>
            <Button onClick={handleAddPinFromPopup} className="bg-blue-500 hover:bg-blue-600">
              <MapPin className="h-4 w-4 mr-2" />
              Add Pin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Filters Sheet */}
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Map Filters</SheetTitle>
            <SheetDescription>
              Filter pins by type, date range, and location. Map updates automatically when filters are changed.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
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
                        id={`sheet-${key}`}
                              checked={checked}
                              onCheckedChange={() => handleAccidentFilterChange(key as keyof typeof accidentFilters)}
                            />
                      <Label htmlFor={`sheet-${key}`} className="text-sm font-normal flex items-center">
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
                    id="all-facilities-sheet"
                          checked={Object.values(facilityFilters).every(Boolean)}
                          onCheckedChange={(checked) => handleSelectAllFacilities(checked as boolean)}
                        />
                  <Label htmlFor="all-facilities-sheet" className="text-sm font-normal">
                          All
                        </Label>
                      </div>
                      {Object.entries(facilityFilters).map(([key, checked]) => {
                        const Icon = facilityIcons[key] || MapPin;
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                        id={`sheet-facility-${key}`}
                              checked={checked}
                              onCheckedChange={() => handleFacilityFilterChange(key as keyof typeof facilityFilters)}
                            />
                      <Label htmlFor={`sheet-facility-${key}`} className="text-sm font-normal flex items-center">
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
                        id={`sheet-location-${key}`}
                              checked={checked}
                              onCheckedChange={() => handleLocationFilterChange(key as keyof typeof locationFilters)}
                            />
                      <Label htmlFor={`sheet-location-${key}`} className="text-sm font-normal flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
        </div>
        </SheetContent>
      </Sheet>

      </TooltipProvider>
    </Layout>
  );
}
