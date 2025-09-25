import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

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
}

// Sample data for markers
const sampleMarkers: Marker[] = [
  // Road Crash markers
  {
    id: 'rc1',
    type: 'Road Crash',
    title: 'Major Traffic Accident on EDSA',
    description: 'Multi-vehicle collision near SM Megamall',
    reportId: 'REP-001',
    coordinates: [121.0560, 14.5854]
  },
  {
    id: 'rc2',
    type: 'Road Crash',
    title: 'Truck Accident on C5',
    description: 'Truck overturned near Market Market',
    reportId: 'REP-002',
    coordinates: [121.0547, 14.5486]
  },
  {
    id: 'rc3',
    type: 'Road Crash',
    title: 'Motorcycle Accident in Makati',
    description: 'Motorcycle collision on Ayala Avenue',
    reportId: 'REP-003',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'rc4',
    type: 'Road Crash',
    title: 'Bus Accident in Quezon City',
    description: 'Bus collision on Commonwealth Avenue',
    reportId: 'REP-004',
    coordinates: [121.0588, 14.7022]
  },
  {
    id: 'rc5',
    type: 'Road Crash',
    title: 'Car Accident in Manila',
    description: 'Two-car collision on Roxas Boulevard',
    reportId: 'REP-005',
    coordinates: [120.9817, 14.5895]
  },

  // Fire markers
  {
    id: 'f1',
    type: 'Fire',
    title: 'Building Fire in Makati',
    description: 'Commercial building fire in Salcedo Village',
    reportId: 'REP-006',
    coordinates: [120.9942, 14.5895]
  },
  {
    id: 'f2',
    type: 'Fire',
    title: 'Residential Fire in Quezon City',
    description: 'House fire in Project 4',
    reportId: 'REP-007',
    coordinates: [121.0433, 14.6333]
  },
  {
    id: 'f3',
    type: 'Fire',
    title: 'Factory Fire in Pasig',
    description: 'Industrial fire in Ortigas',
    reportId: 'REP-008',
    coordinates: [121.0567, 14.5833]
  },
  {
    id: 'f4',
    type: 'Fire',
    title: 'Market Fire in Manila',
    description: 'Fire at Quiapo Market',
    reportId: 'REP-009',
    coordinates: [120.9833, 14.5983]
  },
  {
    id: 'f5',
    type: 'Fire',
    title: 'Warehouse Fire in Taguig',
    description: 'Fire at BGC warehouse',
    reportId: 'REP-010',
    coordinates: [121.0500, 14.5500]
  },

  // Medical Emergency markers
  {
    id: 'me1',
    type: 'Medical Emergency',
    title: 'Emergency Response in Makati',
    description: 'Medical emergency at Greenbelt',
    reportId: 'REP-011',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'me2',
    type: 'Medical Emergency',
    title: 'Emergency in Quezon City',
    description: 'Medical emergency at SM North',
    reportId: 'REP-012',
    coordinates: [121.0333, 14.6500]
  },
  {
    id: 'me3',
    type: 'Medical Emergency',
    title: 'Emergency in Manila',
    description: 'Medical emergency at Rizal Park',
    reportId: 'REP-013',
    coordinates: [120.9717, 14.5917]
  },
  {
    id: 'me4',
    type: 'Medical Emergency',
    title: 'Emergency in Pasig',
    description: 'Medical emergency at Tiendesitas',
    reportId: 'REP-014',
    coordinates: [121.0667, 14.5833]
  },
  {
    id: 'me5',
    type: 'Medical Emergency',
    title: 'Emergency in Taguig',
    description: 'Medical emergency at Market Market',
    reportId: 'REP-015',
    coordinates: [121.0547, 14.5486]
  },

  // Health Facilities markers
  {
    id: 'hf1',
    type: 'Health Facilities',
    title: 'Makati Medical Center',
    description: '24/7 Emergency Services Available',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'hf2',
    type: 'Health Facilities',
    title: 'St. Luke\'s Medical Center',
    description: 'Full-service hospital in Quezon City',
    coordinates: [121.0333, 14.6333]
  },
  {
    id: 'hf3',
    type: 'Health Facilities',
    title: 'Manila Doctors Hospital',
    description: 'Emergency and specialized care',
    coordinates: [120.9817, 14.5895]
  },
  {
    id: 'hf4',
    type: 'Health Facilities',
    title: 'The Medical City',
    description: 'Comprehensive healthcare services',
    coordinates: [121.0567, 14.5833]
  },
  {
    id: 'hf5',
    type: 'Health Facilities',
    title: 'Asian Hospital',
    description: 'Modern medical facility in Alabang',
    coordinates: [121.0167, 14.4167]
  },

  // Police Stations markers
  {
    id: 'ps1',
    type: 'Police Stations',
    title: 'Manila Police Station',
    description: 'Main police station in Manila',
    coordinates: [120.9842, 14.5895]
  },
  {
    id: 'ps2',
    type: 'Police Stations',
    title: 'Makati Police Station',
    description: 'Police station in Makati CBD',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'ps3',
    type: 'Police Stations',
    title: 'Quezon City Police Station',
    description: 'Police station in Quezon City',
    coordinates: [121.0333, 14.6500]
  },
  {
    id: 'ps4',
    type: 'Police Stations',
    title: 'Pasig Police Station',
    description: 'Police station in Pasig City',
    coordinates: [121.0667, 14.5833]
  },
  {
    id: 'ps5',
    type: 'Police Stations',
    title: 'Taguig Police Station',
    description: 'Police station in Taguig City',
    coordinates: [121.0500, 14.5500]
  },

  // Fire Stations markers
  {
    id: 'fs1',
    type: 'Fire Stations',
    title: 'Manila Fire Station',
    description: '24/7 Fire Emergency Services',
    coordinates: [120.9842, 14.5795]
  },
  {
    id: 'fs2',
    type: 'Fire Stations',
    title: 'Makati Fire Station',
    description: 'Fire station in Makati CBD',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'fs3',
    type: 'Fire Stations',
    title: 'Quezon City Fire Station',
    description: 'Fire station in Quezon City',
    coordinates: [121.0333, 14.6500]
  },
  {
    id: 'fs4',
    type: 'Fire Stations',
    title: 'Pasig Fire Station',
    description: 'Fire station in Pasig City',
    coordinates: [121.0667, 14.5833]
  },
  {
    id: 'fs5',
    type: 'Fire Stations',
    title: 'Taguig Fire Station',
    description: 'Fire station in Taguig City',
    coordinates: [121.0500, 14.5500]
  },

  // Evacuation Centers markers
  {
    id: 'ec1',
    type: 'Evacuation Centers',
    title: 'Manila City Hall Evacuation Center',
    description: 'Emergency evacuation center in Manila',
    coordinates: [120.9842, 14.5895]
  },
  {
    id: 'ec2',
    type: 'Evacuation Centers',
    title: 'Makati Evacuation Center',
    description: 'Emergency evacuation center in Makati',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'ec3',
    type: 'Evacuation Centers',
    title: 'Quezon City Evacuation Center',
    description: 'Emergency evacuation center in QC',
    coordinates: [121.0333, 14.6500]
  },
  {
    id: 'ec4',
    type: 'Evacuation Centers',
    title: 'Pasig Evacuation Center',
    description: 'Emergency evacuation center in Pasig',
    coordinates: [121.0667, 14.5833]
  },
  {
    id: 'ec5',
    type: 'Evacuation Centers',
    title: 'Taguig Evacuation Center',
    description: 'Emergency evacuation center in Taguig',
    coordinates: [121.0500, 14.5500]
  },

  // Government Offices markers
  {
    id: 'go1',
    type: 'Government Offices',
    title: 'Manila City Hall',
    description: 'Main government office in Manila',
    coordinates: [120.9842, 14.5895]
  },
  {
    id: 'go2',
    type: 'Government Offices',
    title: 'Makati City Hall',
    description: 'Government office in Makati',
    coordinates: [120.9917, 14.5547]
  },
  {
    id: 'go3',
    type: 'Government Offices',
    title: 'Quezon City Hall',
    description: 'Government office in Quezon City',
    coordinates: [121.0333, 14.6500]
  },
  {
    id: 'go4',
    type: 'Government Offices',
    title: 'Pasig City Hall',
    description: 'Government office in Pasig',
    coordinates: [121.0667, 14.5833]
  },
  {
    id: 'go5',
    type: 'Government Offices',
    title: 'Taguig City Hall',
    description: 'Government office in Taguig',
    coordinates: [121.0500, 14.5500]
  }
];

// Helper function to parse coordinates
const parseCoordinates = (coordinateString: string): [number, number] => {
  if (!coordinateString) return [120.9842, 14.5995]; // Default to Manila
  
  const coords = coordinateString.split(',').map(coord => parseFloat(coord.trim()));
  
  if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    console.warn('Invalid coordinates:', coordinateString);
    return [120.9842, 14.5995]; // Default to Manila
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
  center = [-122.4194, 37.7749],
  zoom = 12,
  activeFilters
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);


  // Function to create a marker element
  const createMarkerElement = (type: string, isSingleMarker = false) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = isSingleMarker ? '40px' : '24px';
    el.style.height = isSingleMarker ? '40px' : '24px';
    el.style.backgroundColor = '#FF4F0B';
    el.style.borderRadius = '50%';
    el.style.border = '4px solid white';
    el.style.boxShadow = '0 0 12px rgba(0,0,0,0.6)';
    el.style.cursor = 'pointer';
    el.style.zIndex = '1000';
    el.style.position = 'relative';
    
    // Add a pulsing animation for single markers
    if (isSingleMarker) {
      el.style.animation = 'pulse 2s infinite';
      // Add a larger shadow for single markers
      el.style.boxShadow = '0 0 20px rgba(255, 79, 11, 0.8), 0 0 12px rgba(0,0,0,0.6)';
    }
    
    console.log('Created marker element:', el, 'for type:', type, 'isSingleMarker:', isSingleMarker);
    
    return el;
  };

  // Function to create popup content
  const createPopupContent = (marker: Marker) => {
    return `
      <div class="p-3 min-w-[280px] max-w-[380px] overflow-hidden">
        <h3 class="font-bold text-lg mb-2 text-gray-800 break-words leading-tight">${marker.title}</h3>
        
        <div class="space-y-2 text-sm overflow-hidden">
          ${marker.reportId ? `
            <div class="flex items-start gap-2">
              <span class="font-medium text-gray-700 flex-shrink-0 mt-0.5">Report ID:</span>
              <span class="text-blue-600 font-mono break-all">${marker.reportId}</span>
            </div>
          ` : ''}
          
          <div class="flex items-start gap-2">
            <span class="font-medium text-gray-700 flex-shrink-0 mt-0.5">Type:</span>
            <span class="text-gray-600 break-words">${marker.type}</span>
          </div>
          
          ${marker.status ? `
            <div class="flex items-start gap-2">
              <span class="font-medium text-gray-700 flex-shrink-0 mt-0.5">Status:</span>
              <span class="px-2 py-1 rounded-full text-xs font-medium inline-block ${
                marker.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                marker.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                marker.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }">${marker.status}</span>
            </div>
          ` : ''}
          
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
          
          ${marker.description ? `
            <div class="mt-3 pt-2 border-t border-gray-200">
              <p class="text-gray-600 text-xs leading-relaxed break-words">${marker.description}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

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
          map.current.on('click', (e) => {
            onMapClick(e.lngLat);
          });
        }

        return () => {
          clearTimeout(loadTimeout);
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

    console.log('Setting map center to:', center, 'zoom:', zoom);
    map.current.setCenter(center);
    map.current.setZoom(zoom);
  }, [center, zoom, mapLoaded]);

  // Handle markers and popups
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
    }


    // Filter markers based on active filters
    const filteredMarkers = sampleMarkers.filter(marker => {
      if (!activeFilters) return true;
      
      const isAccidentType = activeFilters.accidentTypes?.includes(marker.type);
      const isFacilityType = activeFilters.facilityTypes?.includes(marker.type);
      
      return isAccidentType || isFacilityType;
    });

    // Add markers
    filteredMarkers.forEach(marker => {
      const el = createMarkerElement(marker.type);
      const markerInstance = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(marker.coordinates)
        .addTo(map.current!);

      // Add click event to marker
      el.addEventListener('click', () => {
        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new mapboxgl.Popup({ 
          offset: [0, -10],
          closeButton: false,
          className: 'custom-popup',
          maxWidth: '380px'
        })
          .setLngLat(marker.coordinates)
          .setHTML(createPopupContent(marker))
          .addTo(map.current!);
      });

      markersRef.current.push(markerInstance);
    });
  }, [mapLoaded, activeFilters]);

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
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
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