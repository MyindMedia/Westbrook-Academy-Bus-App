import React, { useEffect, useRef } from 'react';
import { BUSES, SCHOOL_LOCATION } from '../services/mockData';
import { LiveTripState } from '../services/liveTracking';

declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  activeTrips: Record<string, LiveTripState>;
}

const MapView: React.FC<MapViewProps> = ({ activeTrips }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, any>>({});
  const busMarkersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    
    // Check if Leaflet is loaded
    if (!window.L) return;

    // Initialize Map
    const L = window.L;
    const map = L.map(containerRef.current).setView([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    // Define Icons
    const schoolIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #2D67AA; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const stopIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #d97706; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    // Add School Marker
    const schoolMarker = L.marker([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], { icon: schoolIcon }).addTo(map);
    schoolMarker.bindPopup("<b>Westbrook Academy</b><br>Home Base");

    // Add Route Lines and Endpoints
    BUSES.forEach(bus => {
        // Line
        const latlngs = [
            [SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng],
            [bus.endpointLocation.lat, bus.endpointLocation.lng]
        ];
        L.polyline(latlngs, { color: '#94a3b8', weight: 2, dashArray: '5, 10', opacity: 0.6 }).addTo(map);

        // Endpoint Marker
        const marker = L.marker([bus.endpointLocation.lat, bus.endpointLocation.lng], { icon: stopIcon }).addTo(map);
        marker.bindPopup(`<b>${bus.name}</b><br>${bus.endpointAddress}`);
    });

    return () => {
        map.remove();
        mapRef.current = null;
    };
  }, []);

  // Update Active Bus Markers
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    const map = mapRef.current;

    const activeBusIds = Object.keys(activeTrips);

    // Remove old markers for buses that are no longer active
    Object.keys(busMarkersRef.current).forEach(busId => {
        if (!activeTrips[busId]) {
            map.removeLayer(busMarkersRef.current[busId]);
            delete busMarkersRef.current[busId];
        }
    });

    // Update or Create markers
    activeBusIds.forEach(busId => {
        const trip = activeTrips[busId];
        // Only render if we have a valid location
        if (trip.currentLocation && trip.currentLocation.lat !== 0) {
            
            if (busMarkersRef.current[busId]) {
                // Move existing
                busMarkersRef.current[busId].setLatLng([trip.currentLocation.lat, trip.currentLocation.lng]);
                busMarkersRef.current[busId].setPopupContent(`<b>${busId}</b><br>${trip.driverName}<br>${trip.studentCount} Students`);
            } else {
                // Create new
                const busIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="
                        background-color: #16a34a; 
                        color: white; 
                        width: 28px; 
                        height: 28px; 
                        border-radius: 50%; 
                        border: 3px solid white; 
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 10px;
                    ">
                        ${busId.split('-')[1]}
                    </div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                });

                const marker = L.marker([trip.currentLocation.lat, trip.currentLocation.lng], { icon: busIcon }).addTo(map);
                marker.bindPopup(`<b>${busId}</b><br>${trip.driverName}<br>${trip.studentCount} Students`);
                busMarkersRef.current[busId] = marker;
            }
        }
    });

  }, [activeTrips]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;