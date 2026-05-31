import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    lat: string;
    lng: string;
    onChange: (lat: string, lng: string) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const initialLat = parseFloat(lat) || 11.5564;
        const initialLng = parseFloat(lng) || 104.9282;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            markerInstance.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.current);

            markerInstance.current.on('dragend', (event) => {
                const marker = event.target;
                const position = marker.getLatLng();
                onChange(position.lat.toFixed(6), position.lng.toFixed(6));
            });

            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                markerInstance.current?.setLatLng([lat, lng]);
                onChange(lat.toFixed(6), lng.toFixed(6));
            });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update marker if lat/lng props change from outside (e.g. initial load in edit)
    useEffect(() => {
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lng);
        if (mapInstance.current && markerInstance.current && !isNaN(newLat) && !isNaN(newLng)) {
            const currentPos = markerInstance.current.getLatLng();
            if (currentPos.lat !== newLat || currentPos.lng !== newLng) {
                markerInstance.current.setLatLng([newLat, newLng]);
                mapInstance.current.panTo([newLat, newLng]);
            }
        }
    }, [lat, lng]);

    return (
        <div className="relative w-full h-64 rounded-xl border-2 border-gray-200 overflow-hidden z-0">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
};
