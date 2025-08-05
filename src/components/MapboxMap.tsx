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

export function MapboxMap({ 
  onMapClick, 
  showHeatmap = false,
  center = [-122.4194, 37.7749],
  zoom = 12,
  activeFilters,
  singleMarker
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Function to create a marker element
  const createMarkerElement = (type: string) => {
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.backgroundColor = '#FF4F0B';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    return el;
  };

  // Function to create popup content
  const createPopupContent = (marker: Marker) => {
    return `
      <div class="p-2">
        <h3 class="font-bold text-lg">${marker.title}</h3>
        <p class="text-sm text-gray-600">${marker.description}</p>
        ${marker.reportId ? `<p class="text-xs text-blue-600 mt-1">Report ID: ${marker.reportId}</p>` : ''}
        <p class="text-xs text-gray-500 mt-1">Type: ${marker.type}</p>
      </div>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Handle markers and popups
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // If singleMarker is provided, only show that marker
    if (singleMarker) {
      const el = createMarkerElement(singleMarker.type);
      const markerInstance = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(singleMarker.coordinates)
        .addTo(map.current!);

      // Add click event to marker
      el.addEventListener('click', () => {
        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          className: 'custom-popup'
        })
          .setLngLat(singleMarker.coordinates)
          .setHTML(createPopupContent(singleMarker))
          .addTo(map.current!);
      });

      markersRef.current.push(markerInstance);
      
      // Automatically show popup for single marker
      popupRef.current = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      })
        .setLngLat(singleMarker.coordinates)
        .setHTML(createPopupContent(singleMarker))
        .addTo(map.current!);
      
      return;
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
          offset: 25,
          closeButton: false,
          className: 'custom-popup'
        })
          .setLngLat(marker.coordinates)
          .setHTML(createPopupContent(marker))
          .addTo(map.current!);
      });

      markersRef.current.push(markerInstance);
    });
  }, [mapLoaded, activeFilters, singleMarker]);

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
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }}
    />
  );
}