/**
 * PinModal Component
 * 
 * A reusable modal for creating and editing map pins.
 * Supports three modes:
 * - Create: Add new pin manually
 * - Edit: Update existing pin
 * - FromReport: Create pin from emergency report
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";
import { Pin, PinType } from "@/types/pin";
import { cn } from "@/lib/utils";

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
      formData.latitude !== null &&
      formData.longitude !== null
    );
  };

  const isFromReport = !!prefillData?.reportId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF4F0B]" />
              {mode === "create" ? "Add New Pin" : "Edit Pin"}
            </DialogTitle>
            {isFromReport && (
              <Badge variant="secondary" className="ml-2">
                From Report
              </Badge>
            )}
          </div>
          {mode === "create" && !isFromReport && (
            <p className="text-sm text-gray-600 mt-2">
              Location has been set from your map click. Fill out the details below to complete the pin.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Pin Type */}
          <div className="space-y-2">
            <Label htmlFor="pin-type">Pin Type *</Label>
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
                
                <SelectSeparator className="my-1" />
                
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
            <Label htmlFor="pin-title">Title *</Label>
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

          {/* Location Section */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {formData.latitude !== null && formData.longitude !== null ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Location Set</span>
                  </div>
                  {!isFromReport && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleChangeLocation}
                      className="h-7 text-xs"
                    >
                      Change
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-1">{formData.locationName || "Unknown Location"}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              </>
            ) : (
              <div className="text-center py-3">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400 animate-pulse" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isWaitingForMapClick ? "Click on the map" : "Location set"}
                </p>
                <p className="text-xs text-gray-500">
                  {isWaitingForMapClick ? "to set the pin location" : "Click 'Change' to update location"}
                </p>
              </div>
            )}
          </div>

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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
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
      </DialogContent>
    </Dialog>
  );
}

