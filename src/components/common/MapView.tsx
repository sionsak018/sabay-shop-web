import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
    lat: string;
    lng: string;
}

export const MapView: React.FC<MapViewProps> = ({ lat, lng }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);
    const [viewType, setViewType] = useState<'streets' | 'satellite'>('streets');
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    const streetsTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    useEffect(() => {
        if (!mapRef.current) return;

        const initialLat = parseFloat(lat);
        const initialLng = parseFloat(lng);

        if (isNaN(initialLat) || isNaN(initialLng)) return;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                dragging: false,
                scrollWheelZoom: false,
                zoomControl: false,
                doubleClickZoom: false,
                touchZoom: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 15);

            tileLayerRef.current = L.tileLayer(streetsTiles, {
                maxZoom: 19,
            }).addTo(mapInstance.current);

            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            }, 200);
        } else {
            mapInstance.current.setView([initialLat, initialLng], 15);
        }

        if (markerInstance.current) {
            markerInstance.current.remove();
        }
        markerInstance.current = L.marker([initialLat, initialLng]).addTo(mapInstance.current);
    }, [lat, lng]);

    useEffect(() => {
        if (mapInstance.current && tileLayerRef.current) {
            tileLayerRef.current.setUrl(viewType === 'streets' ? streetsTiles : satelliteTiles);
        }
    }, [viewType]);

    useEffect(() => {
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full z-0 group">
            <div ref={mapRef} className="w-full h-full" />

            {/* View Switcher */}
            <div className="absolute top-4 left-4 z-[1000] flex bg-white/90 backdrop-blur-md p-1 rounded-lg border border-gray-100 shadow-lg transition-opacity opacity-0 group-hover:opacity-100">
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setViewType('streets'); }}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${viewType === 'streets' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Map
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setViewType('satellite'); }}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${viewType === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Satellite
                </button>
            </div>
        </div>
    );
};
