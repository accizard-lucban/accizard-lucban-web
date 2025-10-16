/**
 * Mapbox Map Component
 * 
 * Features:
 * - Interactive map with custom markers and icons
 * - Type-specific markers with emoji icons and color coding
 * - Toggleable map legend modal showing all marker types
 * - Click to show popups with location details
 * - Travel time and route calculation from user's location
 * - Geocoder for location search
 * - Responsive hover effects on markers
 * 
 * Marker Icons (Accident/Hazard Types):
 * - 🚗 Road Crash (Red)
 * - 🔥 Fire (Orange)
 * - 🚑 Medical Emergency (Pink)
 * - 🌊 Flooding (Blue)
 * - 🌋 Volcanic Activity (Amber)
 * - ⛰️ Landslide (Brown)
 * - ⚠️ Earthquake (Dark Red)
 * - 👥 Civil Disturbance (Violet)
 * - 🛡️ Armed Conflict (Darker Red)
 * - 🦠 Infectious Disease (Emerald)
 * 
 * Marker Icons (Emergency Facilities):
 * - 🏢 Evacuation Centers (Purple)
 * - 🏥 Health Facilities (Green)
 * - 🚔 Police Stations (Blue)
 * - 🚒 Fire Stations (Dark Red)
 * - 🏛️ Government Offices (Indigo)
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Required for proper marker positioning
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { Pin } from '@/types/pin';

// Use environment variable for Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface Marker {
  id: string;
  type: string;
  title: string;
  description: string;
  reportId?: string;
  coordinates: [number, number];
  status?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

interface MapboxMapProps {
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  showHeatmap?: boolean;
  center?: [number, number];
  zoom?: number;
  activeFilters?: {
    accidentTypes?: string[];
    facilityTypes?: string[];
  };
  singleMarker?: Marker;
  pins?: Pin[]; // Array of pins from database to display
  showOnlyCurrentLocation?: boolean;
  clickedLocation?: { lat: number; lng: number; address: string } | null;
  showGeocoder?: boolean;
  onGeocoderResult?: (result: { lat: number; lng: number; address: string }) => void;
  showDirections?: boolean; // Control whether to show routes and travel time
}

// Sample data for markers - currently empty, will be populated from database
const sampleMarkers: Marker[] = [];

// Helper function to parse coordinates
const parseCoordinates = (coordinateString: string): [number, number] => {
  if (!coordinateString) return [121.5556, 14.1139]; // Default to Lucban, Quezon
  
  const coords = coordinateString.split(',').map(coord => parseFloat(coord.trim()));
  
  if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    console.warn('Invalid coordinates:', coordinateString);
    return [121.5556, 14.1139]; // Default to Lucban, Quezon
  }
  
  // Ensure coordinates are in [longitude, latitude] format
  // If latitude > longitude, they might be swapped
  if (Math.abs(coords[0]) > 90 && Math.abs(coords[1]) <= 90) {
    // Likely swapped, so swap them back
    return [coords[1], coords[0]];
  }
  
  return [coords[0], coords[1]];
};

export function MapboxMap({ 
  onMapClick, 
  showHeatmap = false,
  center = [121.5556, 14.1139], // Lucban, Quezon
  zoom = 14,
  activeFilters,
  singleMarker,
  pins = [],
  showOnlyCurrentLocation = false,
  clickedLocation = null,
  showGeocoder = false,
  onGeocoderResult,
  showDirections = true // Default to true for backward compatibility
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [travelTime, setTravelTime] = useState<{duration: number, distance: number} | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [showRoute, setShowRoute] = useState(false);


  // Function to get marker icon based on type
  const getMarkerIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      // Default marker
      'Default': '📍',
      // Accident/Hazard Types
      'Road Crash': '🚗',
      'Fire': '🔥',
      'Medical Emergency': '🚑',
      'Flooding': '🌊',
      'Volcanic Activity': '🌋',
      'Landslide': '⛰️',
      'Earthquake': '⚠️',
      'Civil Disturbance': '👥',
      'Armed Conflict': '🛡️',
      'Infectious Disease': '🦠',
      // Emergency Facilities
      'Evacuation Centers': '🏢',
      'Health Facilities': '🏥',
      'Police Stations': '🚔',
      'Fire Stations': '🚒',
      'Government Offices': '🏛️'
    };
    
    return iconMap[type] || '📍';
  };

  // Function to get marker color based on type
  const getMarkerColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      // Default marker
      'Default': '#6B7280', // Gray-500
      // Accident/Hazard Types
      'Road Crash': '#EF4444', // Red
      'Fire': '#F97316', // Orange
      'Medical Emergency': '#EC4899', // Pink
      'Flooding': '#3B82F6', // Blue
      'Volcanic Activity': '#F59E0B', // Amber
      'Landslide': '#78350F', // Brown
      'Earthquake': '#DC2626', // Dark Red
      'Civil Disturbance': '#7C3AED', // Violet
      'Armed Conflict': '#991B1B', // Darker Red
      'Infectious Disease': '#059669', // Emerald
      // Emergency Facilities
      'Evacuation Centers': '#8B5CF6', // Purple
      'Health Facilities': '#10B981', // Green
      'Police Stations': '#3B82F6', // Blue
      'Fire Stations': '#DC2626', // Dark Red
      'Government Offices': '#6366F1' // Indigo
    };
    
    return colorMap[type] || '#6B7280';
  };

  // Function to get marker image URL based on type
  const getMarkerImageUrl = (type: string): string => {
    // Map each type to a custom marker image
    // You can replace these with paths to your custom marker images
    const markerImages: Record<string, string> = {
      // Accident/Hazard Types - you'll replace these paths with your actual marker images
      'Road Crash': '/markers/road-crash.svg',
      'Fire': '/markers/fire.svg',
      'Medical Emergency': '/markers/medical.svg',
      'Flooding': '/markers/flooding.svg',
      'Volcanic Activity': '/markers/volcano.svg',
      'Landslide': '/markers/landslide.svg',
      'Earthquake': '/markers/earthquake.svg',
      'Civil Disturbance': '/markers/civil.svg',
      'Armed Conflict': '/markers/conflict.svg',
      'Infectious Disease': '/markers/disease.svg',
      // Emergency Facilities
      'Evacuation Centers': '/markers/evacuation.svg',
      'Health Facilities': '/markers/health.svg',
      'Police Stations': '/markers/police.svg',
      'Fire Stations': '/markers/fire-station.svg',
      'Government Offices': '/markers/government.svg',
      // Default
      'Default': '/markers/default.svg'
    };
    
    return markerImages[type] || markerImages['Default'];
  };

  // Function to create a marker element with icon
  const createMarkerElement = (type: string, isSingleMarker = false) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    const size = isSingleMarker ? 40 : 32;
    
    // CRITICAL: Set dimensions on the container
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    
    // Create image element for the marker icon
    const img = document.createElement('img');
    img.src = getMarkerImageUrl(type);
    img.alt = type;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.objectFit = 'contain';
    
    // Fallback: if image fails to load, use emoji with background
    img.onerror = () => {
      console.warn(`Failed to load marker image for ${type}, using fallback`);
      el.innerHTML = '';
      el.style.backgroundColor = getMarkerColor(type);
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = `${size * 0.5}px`;
      el.textContent = getMarkerIcon(type);
    };
    
    el.style.cursor = 'pointer';
    
    // Add the image to the container
    el.appendChild(img);
    
    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.15)';
      el.style.transition = 'transform 0.2s ease';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });
    
    // Add a pulsing animation for single markers
    if (isSingleMarker) {
      el.style.animation = 'pulse 2s infinite';
      el.style.filter = 'drop-shadow(0 0 8px rgba(255, 79, 11, 0.6))';
    }
    
    console.log('Created custom marker element:', {
      type,
      isSingleMarker,
      width: el.style.width,
      height: el.style.height,
      imageUrl: getMarkerImageUrl(type)
    });
    
    return el;
  };

  // Function to create popup content
  const createPopupContent = (marker: Marker) => {
    return `
      <div class="p-3 min-w-[200px] max-w-[300px] overflow-hidden">
        <h3 class="font-bold text-lg mb-2 text-gray-800 break-words leading-tight">${marker.title}</h3>
        
        <div class="space-y-2 text-sm overflow-hidden">
          ${marker.locationName ? `
            <div class="flex items-start gap-2">
              <span class="font-medium text-gray-700 flex-shrink-0 mt-0.5">Location:</span>
              <span class="text-gray-600 break-words leading-relaxed">${marker.locationName}</span>
            </div>
          ` : ''}
          
          ${marker.latitude !== undefined && marker.longitude !== undefined ? `
            <div class="flex items-start gap-2">
              <span class="font-medium text-gray-700 flex-shrink-0 mt-0.5">Coordinates:</span>
              <span class="text-gray-600 font-mono text-xs break-all">
                ${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Function to get user's current location
  const getUserLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Function to calculate travel time using Mapbox Directions API
  const calculateTravelTime = async (origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
    try {
      const accessToken = mapboxgl.accessToken;
      if (!accessToken) {
        throw new Error('Mapbox access token not available');
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${accessToken}&geometries=geojson&overview=full&steps=true&annotations=duration,distance`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Directions API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const totalMinutes = Math.round(route.duration / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        // Format time display
        let timeDisplay;
        if (hours > 0) {
          timeDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        } else {
          timeDisplay = `${minutes}m`;
        }
        
        return {
          duration: timeDisplay,
          totalMinutes: totalMinutes,
          distance: Math.round(route.distance / 1000 * 10) / 10, // Convert meters to kilometers
          routeData: data // Return full route data for display
        };
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Error calculating travel time:', error);
      return null;
    }
  };

  // Function to reverse geocode coordinates to get location name
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const accessToken = mapboxgl.accessToken;
      if (!accessToken) {
        throw new Error('Mapbox access token not available');
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=address,poi,place,locality,neighborhood`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Try to get the most specific address first, then fall back to place names
        const feature = data.features[0];
        const placeName = feature.place_name || feature.text || 'Unknown Location';
        return placeName;
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown Location';
    }
  };

  // Function to display route on map
  const displayRoute = (routeData: any) => {
    if (!map.current || !routeData) return;

    // Remove existing route if any
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    // Add route source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: routeData.routes[0].geometry
      }
    });

    // Add route layer
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF4F0B',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Fit map to route bounds
    const coordinates = routeData.routes[0].geometry.coordinates;
    const bounds = coordinates.reduce((bounds: any, coord: any) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.current.fitBounds(bounds, {
      padding: 50
    });
  };

  // Function to create popup content with travel time
  const createPopupContentWithTravelTime = async (marker: Marker) => {
    let travelTimeInfo = '';
    
    if (userLocation && marker.latitude && marker.longitude) {
      const travelData = await calculateTravelTime(
        userLocation,
        { lat: marker.latitude, lng: marker.longitude }
      );
      
      if (travelData) {
        // Store route data and display route automatically
        setRouteData(travelData.routeData);
        setShowRoute(true);
        displayRoute(travelData.routeData);
        
        travelTimeInfo = `
          <div class="mt-3 pt-3 border-t border-gray-300">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-700">Travel time</span>
            </div>
            <div class="text-xs text-gray-500 ml-6">${travelData.duration} (${travelData.distance} km)</div>
          </div>
        `;
      }
    }

    // Get geocoded location name from coordinates
    let locationName = marker.locationName || marker.title;
    if (marker.latitude && marker.longitude) {
      try {
        const geocodedName = await reverseGeocode(marker.latitude, marker.longitude);
        locationName = geocodedName;
      } catch (error) {
        console.error('Error getting geocoded location name:', error);
        // Fall back to original location name if geocoding fails
      }
    }

    return `
      <div class="w-[200px]">
        <div class="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Report Details</h4>
        </div>
        <div class="p-3">
          <div class="flex items-start gap-2 mb-2">
            <svg class="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <div class="min-w-0 flex-1">
              <span class="text-sm font-medium text-gray-900 break-words leading-tight block">${locationName}</span>
              <span class="text-xs text-gray-500 font-mono block mt-1">${marker.latitude?.toFixed(6)}, ${marker.longitude?.toFixed(6)}</span>
            </div>
          </div>
          
          ${travelTimeInfo}
        </div>
      </div>
    `;
  };

  // Get user's current location on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
        console.log('User location obtained:', location);
      } catch (error) {
        console.error('Error getting user location:', error);
        // Don't set error state, just log it - travel time will be unavailable
      }
    };

    getLocation();
  }, []);

  // Initialize map
  useEffect(() => {
    const initializeMap = () => {
      if (!mapContainer.current) {
        console.log('Map container not ready');
        return;
      }

      // Check if Mapbox access token is available
      if (!mapboxgl.accessToken) {
        console.error('Mapbox access token is not available');
        setMapError('Mapbox access token is not configured');
        return;
      }

      console.log('Initializing map with center:', center, 'zoom:', zoom);

      // Set a timeout to handle cases where map doesn't load
      const loadTimeout = setTimeout(() => {
        if (!mapLoaded) {
          console.error('Map load timeout');
          setMapError('Map failed to load within timeout');
        }
      }, 10000); // 10 second timeout

      try {
        // Clean up existing map
        if (map.current) {
          map.current.remove();
          map.current = null;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center,
          zoom: zoom
        });

        // Add geolocate control
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        });
        
        map.current.addControl(geolocate);
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl());

        // Add geocoder if enabled
        if (showGeocoder) {
          const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false, // We'll handle markers ourselves
            placeholder: 'Search for a location, institution, or facility...',
            bbox: [120.0, 14.0, 122.0, 15.0], // Focus on Philippines area
            proximity: { longitude: 121.5556, latitude: 14.1139 }, // Center on Lucban, Quezon
            countries: 'ph', // Limit to Philippines
            types: 'place,locality,neighborhood,address,poi,region,district',
            language: 'en',
            limit: 10,
            minLength: 2,
            autocomplete: true,
            fuzzyMatch: true
          });

          // Add geocoder to map
          map.current.addControl(geocoder, 'top-left');
          geocoderRef.current = geocoder;

          // Handle geocoder result
          geocoder.on('result', async (e) => {
            const result = e.result;
            const coordinates = result.geometry.coordinates;
            const address = result.place_name || result.text || 'Selected location';
            
            // Center the map on the selected location
            if (map.current) {
              map.current.flyTo({
                center: coordinates,
                zoom: 16, // Zoom in closer to the selected location
                essential: true
              });
            }

            // Display route if user location is available and directions are enabled
            if (showDirections && userLocation && map.current) {
              try {
                const routeData = await calculateTravelTime(
                  { lat: userLocation.lat, lng: userLocation.lng },
                  { lat: coordinates[1], lng: coordinates[0] }
                );
                
                if (routeData && routeData.routeData) {
                  setRouteData(routeData.routeData);
                  setShowRoute(true);
                  displayRoute(routeData.routeData);
                }
              } catch (error) {
                console.error('Error calculating route:', error);
              }
            }
            
            if (onGeocoderResult) {
              onGeocoderResult({
                lng: coordinates[0],
                lat: coordinates[1],
                address: address
              });
            }
          });
        }

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          clearTimeout(loadTimeout);
          setMapLoaded(true);
          setMapError(null);
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
          clearTimeout(loadTimeout);
          setMapError('Failed to load map');
        });

        if (onMapClick) {
          map.current.on('click', async (e) => {
            // Only center and zoom if directions are enabled
            if (showDirections) {
              // Center the map on the clicked location
              map.current.flyTo({
                center: [e.lngLat.lng, e.lngLat.lat],
                zoom: 12, // Zoom in closer to the clicked location
                essential: true
              });

              // Display route if user location is available
              if (userLocation) {
                try {
                  const routeData = await calculateTravelTime(
                    { lat: userLocation.lat, lng: userLocation.lng },
                    { lat: e.lngLat.lat, lng: e.lngLat.lng }
                  );
                  
                  if (routeData && routeData.routeData) {
                    setRouteData(routeData.routeData);
                    setShowRoute(true);
                    displayRoute(routeData.routeData);
                  }
                } catch (error) {
                  console.error('Error calculating route:', error);
                }
              }
            }
            
            onMapClick(e.lngLat);
          });
        }

        return () => {
          clearTimeout(loadTimeout);
          if (geocoderRef.current) {
            geocoderRef.current = null;
          }
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        };
      } catch (error) {
        console.error('Error initializing map:', error);
        clearTimeout(loadTimeout);
        setMapError('Failed to initialize map');
      }
    };

    // Use a small delay to ensure the container is properly rendered
    const timer = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Handle center and zoom changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Don't auto-center if we're in location selection mode (showOnlyCurrentLocation)
    // This allows the map to stay centered on user-selected locations
    if (showOnlyCurrentLocation) {
      console.log('Skipping auto-center in location selection mode');
      return;
    }

    console.log('Setting map center to:', center, 'zoom:', zoom);
    map.current.setCenter(center);
    map.current.setZoom(zoom);
  }, [center, zoom, mapLoaded, showOnlyCurrentLocation]);

  // Handle markers and popups
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Handle single marker (from database)
    if (singleMarker) {
      console.log('=== MAPBOX MARKER RENDER ===');
      console.log('Full singleMarker object:', singleMarker);
      console.log('Coordinates array:', singleMarker.coordinates);
      console.log('Individual lat/lng:', { lat: singleMarker.latitude, lng: singleMarker.longitude });
      
      // Validate coordinates
      const [lng, lat] = singleMarker.coordinates;
      console.log('Destructured from array - lng:', lng, 'lat:', lat);
      
      if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.error('❌ Invalid marker coordinates - aborting marker creation');
        console.error('Invalid values:', { lng, lat, marker: singleMarker });
        return;
      }
      
      console.log('✅ Coordinates valid, creating custom marker...');
      
      // Create custom marker element
      const el = createMarkerElement(singleMarker.type, true);
      
      // Create Mapbox marker with custom element
      const markerInstance = new mapboxgl.Marker({
        element: el,
        anchor: 'center' // Anchor point is center of the element
      })
      .setLngLat(singleMarker.coordinates)
      .addTo(map.current);
      
      markersRef.current.push(markerInstance);
      
      console.log('✅ Custom marker added at:', singleMarker.coordinates);
      
      // Add click event to show popup
      el.addEventListener('click', async () => {
        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: true,
          className: 'custom-popup',
          maxWidth: '200px'
        })
        .setLngLat(singleMarker.coordinates)
        .setHTML(showDirections ? await createPopupContentWithTravelTime(singleMarker) : createPopupContent(singleMarker))
        .addTo(map.current);

        popupRef.current = popup;
      });
      
      // Debug marker wrapper
      setTimeout(() => {
        const allMarkers = document.querySelectorAll('.mapboxgl-marker');
        console.log('Total markers on map:', allMarkers.length);
        allMarkers.forEach((marker, index) => {
          const computedStyle = window.getComputedStyle(marker);
          console.log(`Marker ${index}:`, {
            element: marker,
            classes: marker.className,
            transform: computedStyle.transform,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height
          });
        });
      }, 100);

      // Add current location marker if available and not showing only current location
      if (userLocation && !showOnlyCurrentLocation) {
        console.log('Adding current location marker at:', userLocation);
        
        const currentLocationEl = document.createElement('div');
        currentLocationEl.className = 'current-location-marker';
        currentLocationEl.style.width = '20px';
        currentLocationEl.style.height = '20px';
        currentLocationEl.style.backgroundColor = '#3B82F6';
        currentLocationEl.style.borderRadius = '50%';
        currentLocationEl.style.border = '3px solid white';
        currentLocationEl.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
        currentLocationEl.style.cursor = 'pointer';
        currentLocationEl.title = 'Your current location';

        const currentLocationMarker = new mapboxgl.Marker({
          element: currentLocationEl,
          anchor: 'center'
        })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

        markersRef.current.push(currentLocationMarker);
      }

      // Add clicked location marker if provided
      if (clickedLocation) {
        const clickedLocationEl = document.createElement('div');
        clickedLocationEl.className = 'clicked-location-marker';
        clickedLocationEl.style.width = '24px';
        clickedLocationEl.style.height = '24px';
        clickedLocationEl.style.backgroundColor = '#FF4F0B';
        clickedLocationEl.style.borderRadius = '50%';
        clickedLocationEl.style.border = '3px solid white';
        clickedLocationEl.style.boxShadow = '0 0 12px rgba(255, 79, 11, 0.6)';
        clickedLocationEl.style.cursor = 'pointer';
        clickedLocationEl.title = 'Selected location';

        const clickedLocationMarker = new mapboxgl.Marker({
          element: clickedLocationEl,
          anchor: 'center'
        })
        .setLngLat([clickedLocation.lng, clickedLocation.lat])
        .addTo(map.current);

        markersRef.current.push(clickedLocationMarker);

        // Add popup for clicked location
        const clickedPopup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: true,
          className: 'custom-popup',
          maxWidth: '200px'
        })
        .setLngLat([clickedLocation.lng, clickedLocation.lat])
        .setHTML(`
          <div class="w-[200px]">
            <div class="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Selected Location</h4>
            </div>
            <div class="p-3">
              <div class="flex items-start gap-2 mb-2">
                <svg class="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-medium text-gray-900 break-words leading-tight block">${clickedLocation.address}</span>
                  <span class="text-xs text-gray-500 font-mono block mt-1">${clickedLocation.lat.toFixed(6)}, ${clickedLocation.lng.toFixed(6)}</span>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-300">
                <div class="flex items-center gap-2 mb-1">
                  <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">Travel time</span>
                </div>
                <div class="text-xs text-gray-500 ml-6" id="travel-time-${clickedLocation.lat}-${clickedLocation.lng}">Calculating...</div>
              </div>
            </div>
          </div>
        `)
        .addTo(map.current);

        // Calculate and update travel time asynchronously, and display route
        if (userLocation) {
          calculateTravelTime(
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: clickedLocation.lat, lng: clickedLocation.lng }
          ).then(travelTimeData => {
            if (travelTimeData) {
              // Update travel time display
              const travelTimeElement = document.getElementById(`travel-time-${clickedLocation.lat}-${clickedLocation.lng}`);
              if (travelTimeElement) {
                travelTimeElement.textContent = `${travelTimeData.duration} (${travelTimeData.distance} km)`;
              }
              
              // Display route automatically
              if (travelTimeData.routeData) {
                setRouteData(travelTimeData.routeData);
                setShowRoute(true);
                displayRoute(travelTimeData.routeData);
              }
            }
          }).catch(error => {
            console.error('Error calculating travel time:', error);
            const travelTimeElement = document.getElementById(`travel-time-${clickedLocation.lat}-${clickedLocation.lng}`);
            if (travelTimeElement) {
              travelTimeElement.textContent = 'Unable to calculate';
            }
          });
        }

        popupRef.current = clickedPopup;
      }

      return; // Exit early since we're showing a single marker
    }

    // Render pins from database
    if (pins && pins.length > 0) {
      console.log('Rendering database pins:', pins.length);
      
      pins.forEach(pin => {
        // Create marker element
        const el = createMarkerElement(pin.type, false);
        
        // Create marker instance
        const markerInstance = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map.current!);

        // Add click event to show popup
        el.addEventListener('click', async () => {
          if (popupRef.current) {
            popupRef.current.remove();
          }

          // Convert Pin to Marker format for popup
          const markerData: Marker = {
            id: pin.id,
            type: pin.type,
            title: pin.title,
            description: pin.locationName,
            reportId: pin.reportId,
            coordinates: [pin.longitude, pin.latitude],
            locationName: pin.locationName,
            latitude: pin.latitude,
            longitude: pin.longitude
          };

          popupRef.current = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            closeOnClick: true,
            className: 'custom-popup',
            maxWidth: '200px'
          })
          .setLngLat([pin.longitude, pin.latitude])
          .setHTML(showDirections ? await createPopupContentWithTravelTime(markerData) : createPopupContent(markerData))
          .addTo(map.current!);
        });

        markersRef.current.push(markerInstance);
      });
    }

    // Also render legacy sample markers (backward compatibility)
    const filteredMarkers = sampleMarkers.filter(marker => {
      if (!activeFilters) return true;
      
      const isAccidentType = activeFilters.accidentTypes?.includes(marker.type);
      const isFacilityType = activeFilters.facilityTypes?.includes(marker.type);
      
      return isAccidentType || isFacilityType;
    });

    // Add legacy markers
    filteredMarkers.forEach(marker => {
      const el = createMarkerElement(marker.type, false);
      const markerInstance = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      // Add click event to marker
      el.addEventListener('click', async () => {
        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new mapboxgl.Popup({ 
          offset: [0, -10],
          closeButton: false,
          closeOnClick: true,
          className: 'custom-popup',
          maxWidth: '200px'
        })
          .setLngLat(marker.coordinates)
          .setHTML(showDirections ? await createPopupContentWithTravelTime(marker) : createPopupContent(marker))
          .addTo(map.current!);
      });

      markersRef.current.push(markerInstance);
    });
  }, [mapLoaded, activeFilters, singleMarker, pins, userLocation, showOnlyCurrentLocation, clickedLocation]);

  // Handle route display
  useEffect(() => {
    if (map.current && mapLoaded && routeData && showRoute) {
      displayRoute(routeData);
    }
  }, [mapLoaded, routeData, showRoute]);

  // Handle route display for location selection mode
  useEffect(() => {
    if (map.current && mapLoaded && routeData && showOnlyCurrentLocation) {
      displayRoute(routeData);
    }
  }, [mapLoaded, routeData, showOnlyCurrentLocation]);

  // Handle heatmap
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (showHeatmap) {
      if (!map.current.getSource('heatmap')) {
        map.current.addSource('heatmap', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: sampleMarkers.map(marker => ({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: marker.coordinates
              }
            }))
          }
        });

        map.current.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 0, 255, 0)',
              0.2, 'royalblue',
              0.4, 'cyan',
              0.6, 'lime',
              0.8, 'yellow',
              1, 'red'
            ],
            'heatmap-radius': 30,
            'heatmap-opacity': 0.8
          }
        });
      }
    } else {
      if (map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer');
      }
      if (map.current.getSource('heatmap')) {
        map.current.removeSource('heatmap');
      }
    }
  }, [showHeatmap, mapLoaded]);


  return (
    <div className="w-full h-full relative">
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
            max-width: 380px !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            background: white !important;
            border: 1px solid #e5e7eb !important;
            position: relative !important;
          }
          
          .mapboxgl-popup-tip {
            border-top-color: white !important;
            border-bottom-color: white !important;
            width: 0 !important;
            height: 0 !important;
            border-left: 8px solid transparent !important;
            border-right: 8px solid transparent !important;
            border-bottom: 8px solid white !important;
            margin: 0 auto !important;
          }
          
          .mapboxgl-popup {
            z-index: 1001 !important;
            max-width: 380px !important;
          }
        `}
      </style>
      
      {/* Map Legend Toggle Button */}
      {!singleMarker && !showOnlyCurrentLocation && (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              size="icon"
              className="absolute bottom-6 right-6 z-10 bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-300 shadow-lg rounded-full w-12 h-12"
              title="Show Map Legend"
            >
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
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
      )}
      
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ width: '100%', height: '100%', minHeight: '480px' }}
      />
      
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
            <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-red-600">
            <p className="text-sm font-medium">{mapError}</p>
            <p className="text-xs mt-1">Check console for details</p>
            <button 
              onClick={() => {
                setMapError(null);
                setMapLoaded(false);
                // Force re-initialization
                if (mapContainer.current) {
                  const event = new Event('resize');
                  window.dispatchEvent(event);
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}