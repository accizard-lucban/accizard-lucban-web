/**
 * PinModal Component
 * 
 * A reusable overlay for creating and editing map pins.
 * Supports three modes:
 * - Create: Add new pin manually
 * - Edit: Update existing pin
 * - FromReport: Create pin from emergency report
 * 
 * Displays as:
 * - Fixed right-side overlay on desktop
 * - Bottom sheet on mobile
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, RotateCcw } from "lucide-react";
import { Pin, PinType } from "@/types/pin";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Pin type icons mapping (for the select dropdown)
import { Car, Flame, Ambulance, Waves, Mountain, CircleAlert, Users, ShieldAlert, Activity, Building, Building2 } from "lucide-react";

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

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pinData: PinFormData) => Promise<void>;
  mode: "create" | "edit";
  existingPin?: Pin;
  prefillData?: Partial<PinFormData>;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

export interface PinFormData {
  id?: string;
  type: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  reportId?: string;
}

// Accident/Hazard types
const accidentHazardTypes = [
  "Road Crash", "Fire", "Medical Emergency", "Flooding", "Volcanic Activity",
  "Landslide", "Earthquake", "Civil Disturbance", "Armed Conflict", "Infectious Disease"
];

// Emergency facility types
const emergencyFacilityTypes = [
  "Evacuation Centers", "Health Facilities", "Police Stations", "Fire Stations", "Government Offices"
];

export function PinModal({
  isOpen,
  onClose,
  onSave,
  mode,
  existingPin,
  prefillData,
  onMapClick
}: PinModalProps) {
  const [formData, setFormData] = useState<PinFormData>({
    type: "",
    title: "",
    latitude: null,
    longitude: null,
    locationName: "",
    reportId: undefined
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isWaitingForMapClick, setIsWaitingForMapClick] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (mode === "edit" && existingPin) {
      setFormData({
        id: existingPin.id,
        type: existingPin.type,
        title: existingPin.title,
        latitude: existingPin.latitude,
        longitude: existingPin.longitude,
        locationName: existingPin.locationName,
        reportId: existingPin.reportId
      });
      setIsWaitingForMapClick(false);
    } else if (prefillData) {
      setFormData(prev => ({
        type: prefillData.type || prev.type || "",
        title: prefillData.title || prev.title || "",
        latitude: prefillData.latitude !== undefined ? prefillData.latitude : prev.latitude,
        longitude: prefillData.longitude !== undefined ? prefillData.longitude : prev.longitude,
        locationName: prefillData.locationName || prev.locationName || "",
        reportId: prefillData.reportId || prev.reportId
      }));
      // Stop waiting for map click if coordinates are provided
      if (prefillData.latitude !== undefined && prefillData.longitude !== undefined) {
        setIsWaitingForMapClick(false);
      } else if (!prefillData.latitude && !prefillData.longitude && mode === "create") {
        setIsWaitingForMapClick(true);
      }
    } else if (mode === "create" && !existingPin) {
      // Reset for new pin
      setFormData({
        type: "",
        title: "",
        latitude: null,
        longitude: null,
        locationName: "",
        reportId: undefined
      });
      setIsWaitingForMapClick(true); // Start in map click mode for new pins
    }
  }, [mode, existingPin, prefillData, isOpen]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving pin:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      type: "",
      title: "",
      latitude: null,
      longitude: null,
      locationName: "",
      reportId: undefined
    });
    setIsWaitingForMapClick(true);
  };

  const handleChangeLocation = () => {
    setIsWaitingForMapClick(true);
    if (onMapClick) {
      // Signal to parent that we're waiting for map click
    }
  };

  const isValid = () => {
    return (
      formData.type &&
      formData.title.trim() &&
      formData.locationName.trim() &&
      formData.latitude !== null &&
      formData.longitude !== null
    );
  };

  const isFromReport = !!prefillData?.reportId;
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop - only show on mobile */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Overlay Panel */}
      <div 
        className={cn(
          "bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          // Desktop: Right side overlay within map container
          "md:absolute md:right-0 md:top-0 md:h-full md:w-[450px] md:z-50",
          // Mobile: Bottom sheet (fixed for mobile)
          "fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl z-50",
          "md:rounded-none"
        )}
        style={{
          // Ensure it stays within bounds on desktop
          ...(isMobile ? {} : { 
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: '450px',
            zIndex: 50
          })
        }}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF4F0B]" />
              <h2 className="text-lg font-semibold">
                {mode === "create" ? "Add New Pin" : "Edit Pin"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isFromReport && (
                <Badge variant="secondary">
                  From Report
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {mode === "create" && !isFromReport && (
            <p className="text-sm text-gray-600">
              Location has been set from your map click. Fill out the details below to complete the pin.
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: isMobile ? 'calc(85vh - 160px)' : 'calc(100vh - 140px)' }}>
          <div className="space-y-4">
          {/* Pin Type */}
          <div className="space-y-2">
            <Label htmlFor="pin-type">Pin Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={isFromReport}
            >
              <SelectTrigger className={cn(isFromReport && "bg-gray-50 cursor-not-allowed")}>
                <SelectValue placeholder="Select pin type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-gray-600 px-2 py-1.5">
                    Accident/Hazard Types
                  </SelectLabel>
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
                
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-gray-600 px-2 py-1.5">
                    Emergency Facilities
                  </SelectLabel>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="pin-title">Title</Label>
            <div className="relative">
              <Input
                id="pin-title"
                placeholder="Enter marker title"
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 60) {
                    setFormData({ ...formData, title: value });
                  }
                }}
                maxLength={60}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.title.length}/60 characters
              </div>
            </div>
          </div>

          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              placeholder="Location will be set automatically"
              value={formData.locationName}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="0.000000"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="0.000000"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
              />
            </div>
          </div>

          {/* Map Click Helper */}
          {isWaitingForMapClick && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Click on the map to set coordinates automatically
                </p>
              </div>
            </div>
          )}

            {/* Report ID (if from report) */}
            {formData.reportId && (
              <div className="space-y-2">
                <Label>Linked Report</Label>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  Report ID: {formData.reportId}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleReset} 
              className="h-10 w-10"
              disabled={isSaving}
              title="Clear form"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-[#FF4F0B] hover:bg-[#FF4F0B]/90"
              disabled={!isValid() || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                mode === "create" ? "Add Pin" : "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

