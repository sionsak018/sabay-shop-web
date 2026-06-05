import React, { useEffect, useRef, useState } from 'react';
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

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    lat: string;
    lng: string;
    onSelect: (lat: string, lng: string) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, onClose, lat, lng, onSelect }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);
    const [tempCoords, setTempCoords] = useState({ lat, lng });
    const [viewType, setViewType] = useState<'streets' | 'satellite'>('streets');
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    const streetsTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    useEffect(() => {
        if (isOpen && mapRef.current && !mapInstance.current) {
            const initialLat = parseFloat(lat) || 11.5564;
            const initialLng = parseFloat(lng) || 104.9282;

            // Wait a bit for modal animation to finish so Leaflet calculates size correctly
            setTimeout(() => {
                if (!mapRef.current) return;

                mapInstance.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);

                tileLayerRef.current = L.tileLayer(viewType === 'streets' ? streetsTiles : satelliteTiles, {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);

                markerInstance.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance.current);

                markerInstance.current.on('dragend', (event) => {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    setTempCoords({ lat: position.lat.toFixed(6), lng: position.lng.toFixed(6) });
                });

                mapInstance.current.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    markerInstance.current?.setLatLng([lat, lng]);
                    setTempCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
                });

                // Force recalculate size
                mapInstance.current.invalidateSize();
            }, 100);
        }

        return () => {
            if (!isOpen && mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerInstance.current = null;
                tileLayerRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (mapInstance.current && tileLayerRef.current) {
            tileLayerRef.current.setUrl(viewType === 'streets' ? streetsTiles : satelliteTiles);
        }
    }, [viewType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#16171d] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-gray-800">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-8 py-3 sm:py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-black text-gray-700 dark:text-gray-100 uppercase tracking-widest">Select Location</h2>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5 sm:mt-1">Drag marker or click map</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition shrink-0">
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="h-[400px] sm:h-[500px] w-full relative">
                    <div ref={mapRef} className="w-full h-full" />

                    {/* View Switcher */}
                    <div className="absolute top-4 left-4 z-[1000] flex bg-white/90 dark:bg-[#1c1c1d]/90 backdrop-blur-md p-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setViewType('streets')}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded ${viewType === 'streets' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            Map
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewType('satellite')}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded ${viewType === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            Satellite
                        </button>
                    </div>

                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-white/90 dark:bg-[#1c1c1d]/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xl z-[1000] flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[7px] sm:text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Coordinates</span>
                            <span className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400">{tempCoords.lat}, {tempCoords.lng}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onSelect(tempCoords.lat, tempCoords.lng);
                            onClose();
                        }}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-blue-600 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition whitespace-nowrap"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
