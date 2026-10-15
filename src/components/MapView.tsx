import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Donor, UserCoordinates } from '../types/blood';
import { formatDistance } from '../utils/geo';
import { Navigation, Crosshair } from 'lucide-react';

interface MapViewProps {
  donors: Donor[];
  userCoords: UserCoordinates;
  radiusKm: number;
  onOpenDialerModal: (donor: Donor) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  donors,
  userCoords,
  radiusKm,
  onOpenDialerModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userCoords.latitude, userCoords.longitude],
        zoom: radiusKm > 0 ? (radiusKm <= 5 ? 13 : radiusKm <= 15 ? 12 : 10) : 12,
        zoomControl: true,
      });

      // Free OpenStreetMap CartoDB Positron / OSM standard tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view & markers whenever coordinates, donors, or radius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([userCoords.latitude, userCoords.longitude], map.getZoom());
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Update or create Radius Circle
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }

    if (radiusKm > 0) {
      circleLayerRef.current = L.circle([userCoords.latitude, userCoords.longitude], {
        radius: radiusKm * 1000,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);
    }

    // Clear old markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    // 1. Add User / Patient Marker
    const userIcon = L.divIcon({
      className: 'custom-patient-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const userMarker = L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon });
    userMarker.bindPopup(`
      <div style="font-family: inherit; padding: 2px;">
        <div style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">Patient / Search Location</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${userCoords.locationName}</div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">${userCoords.latitude.toFixed(4)}°, ${userCoords.longitude.toFixed(4)}°</div>
      </div>
    `);
    markersLayerRef.current?.addLayer(userMarker);

    // 2. Add Donor Markers
    donors.forEach((donor) => {
      const donorIcon = L.divIcon({
        className: 'custom-donor-pin',
        html: `
          <div style="
            background: #dc2626;
            color: #ffffff;
            font-weight: 800;
            font-family: monospace;
            font-size: 11px;
            padding: 3px 6px;
            border-radius: 6px;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 8px rgba(220, 38, 38, 0.4);
            display: inline-flex;
            align-items: center;
            gap: 2px;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>🩸</span> ${donor.bloodGroup}
          </div>
        `,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const rawPhone = donor.phone.replace(/[^0-9+]/g, '');
      const marker = L.marker([donor.latitude, donor.longitude], { icon: donorIcon });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'inherit';
      popupContent.style.minWidth = '200px';
      popupContent.innerHTML = `
        <div style="padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-weight: 800; font-size: 15px; color: #0f172a;">${donor.name}</span>
            <span style="background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${donor.bloodGroup}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px;">
            📍 ${donor.area || donor.city || `${donor.latitude.toFixed(4)}°, ${donor.longitude.toFixed(4)}°`}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #059669; font-weight: 600;">
            <span>⚡ ${donor.distanceKm !== undefined ? formatDistance(donor.distanceKm) : 'Nearby'}</span>
            <span>~${donor.responseTimeMinutes || 15}m transit</span>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 6px;">
            <a href="tel:${rawPhone}" style="flex: 1; text-align: center; background: #dc2626; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px; text-decoration: none; display: inline-block;">
              📞 Call ${donor.phone}
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });

    return () => clearTimeout(timer);
  }, [donors, userCoords, radiusKm]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.latitude, userCoords.longitude], 13);
    }
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[580px] flex flex-col">
      {/* Map toolbar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="font-semibold">Patient GPS Center</span>
          <span className="text-slate-400">·</span>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>{donors.length} Verified Donors Plotted</span>
        </div>

        <button
          onClick={handleRecenter}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors text-xs font-medium"
        >
          <Crosshair className="w-3.5 h-3.5 text-red-400" />
          <span>Center to Patient</span>
        </button>
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Floating Info Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-md text-xs text-slate-700 space-y-1 max-w-xs pointer-events-none">
        <div className="font-bold text-slate-900 flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-red-600" />
          <span>Click any marker to dial instantly</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Showing donors sorted by direct geographic coordinates. All pins include live phone dialer triggers.
        </p>
      </div>
    </div>
  );
};
