"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, Navigation, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Fix Leaflet marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default?.src || '/images/marker-icon-2x.png',
  iconUrl: require('leaflet/dist/images/marker-icon.png').default?.src || '/images/marker-icon.png',
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default?.src || '/images/marker-shadow.png',
});

// Create custom icon to avoid webpack issues if the above fails
const customIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks for reverse geocoding
function MapEvents({ onLocationSelect, markerPosition, setMarkerPosition }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setMarkerPosition(newPos);
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return markerPosition === null ? null : (
    <Marker position={markerPosition} icon={customIcon} />
  );
}

export default function LocationPicker({ 
  onLocationFound, 
  onConfirm,
  initialLat = 14.2952, // Default to Lumban, Laguna approx
  initialLng = 121.4647,
  autoLocate = true
}) {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [addressDetails, setAddressDetails] = useState('');
  const mapRef = useRef(null);
  const initialLocateRef = useRef(false);

  // Auto-locate user on mount if requested
  useEffect(() => {
    if (autoLocate && !initialLocateRef.current) {
        initialLocateRef.current = true;
        
        // Slight timeout to ensure map context is ready
        const timer = setTimeout(() => {
            handleCurrentLocation();
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [autoLocate]);

  // Auto-fetch details if initial position changes externally
  useEffect(() => {
    if (initialLat !== 14.2952 || initialLng !== 121.4647) {
      setPosition([initialLat, initialLng]);
      performReverseGeocoding(initialLat, initialLng);
    }
  }, [initialLat, initialLng]);

  const handleCurrentLocation = async () => {
    setSearching(true);
    try {
      let coords;
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition();
        coords = position.coords;
      } else {
        // Fallback to browser geolocation
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        coords = pos.coords;
      }

      const { latitude: lat, longitude: lon } = coords;
      setPosition([lat, lon]);
      
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 16);
      }
      
      await performReverseGeocoding(lat, lon);
      
      if (onConfirm) {
        setTimeout(() => onConfirm(), 500); // Auto-confirm after locating
      }
    } catch (error) {
      console.error("Geolocation failed:", error);
      alert("Could not determine your current location. Please check your permissions.");
    } finally {
      setSearching(false);
    }
  };

  const performReverseGeocoding = async (lat, lon) => {
    setSearching(true);
    try {
      // Using accept-language as a query parameter instead of a header to avoid CORS preflight issues
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en-US`);
      const data = await res.json();
      if (data && data.address) {
        const { address } = data;
        const formattedAddress = data.display_name;
        setAddressDetails(formattedAddress);
        
        // Map Nominatim fields to our form fields
        const parsedData = {
          houseNumber: address.house_number || '',
          street: address.road || address.pedestrian || address.neighbourhood || '',
          barangay: address.suburb || address.quarter || address.village || '',
          city: address.city || address.town || address.municipality || '',
          province: address.state || address.region || address.county || '',
          postalCode: address.postcode || '',
        };
        
        if (onLocationFound) {
          onLocationFound({ lat, lng: lon, address: parsedData, formatted: formattedAddress });
        }
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await handleSearch();
    } else {
      await handleCurrentLocation();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const searchTerms = searchQuery + ", Philippines";
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerms)}&limit=1&accept-language=en-US`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const numLat = parseFloat(lat);
        const numLon = parseFloat(lon);
        
        setPosition([numLat, numLon]);
        setAddressDetails(display_name);
        performReverseGeocoding(numLat, numLon);
        
        if (mapRef.current) {
          mapRef.current.flyTo([numLat, numLon], 16);
        }
      } else {
        alert("Location not found. Try variations of the address.");
      }
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setSearching(false);
    }
  };

  const handleMapSelect = (lat, lng) => {
    setPosition([lat, lng]);
    performReverseGeocoding(lat, lng);
  };

  return (
    <div className="flex flex-col gap-4 border-2 border-[var(--border)] rounded-3xl p-5 bg-white shadow-xl relative overflow-hidden z-20">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] group-focus-within:text-[var(--rust)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search city, street, or landmark..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-4 bg-[var(--input-bg)] text-[var(--charcoal)] placeholder:text-[var(--muted)]/50 border-2 border-transparent outline-none focus:border-[var(--rust)] focus:bg-white rounded-2xl text-xs font-bold transition-all shadow-inner"
          />
        </div>
        <button 
          type="button" 
          onClick={handleSearchClick}
          disabled={searching}
          className="bg-[var(--rust)] text-white px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-extrabold hover:bg-[#b03b25] transition-all flex items-center justify-center min-h-[56px] gap-3 shrink-0 shadow-[0_10px_20px_rgba(185,66,50,0.2)] active:scale-95"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-3.5 h-3.5" /> Pin Address</>}
        </button>
      </div>

      {/* Interactive Map Area */}
      <div className="h-72 w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--border)] relative z-10 group">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents 
            markerPosition={position} 
            setMarkerPosition={setPosition} 
            onLocationSelect={handleMapSelect} 
          />
        </MapContainer>
        
        {/* Map Overlay Button */}
        <button 
          onClick={handleCurrentLocation}
          className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-xl shadow-lg border border-[var(--border)] text-[var(--rust)] hover:bg-[var(--rust)] hover:text-white transition-all active:scale-90"
          title="Use Current Location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Intelligence Status Bar */}
      <div className="pt-2">
         {addressDetails ? (
            <motion.div 
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-[#F8FAF9] border-2 border-green-100 text-green-800 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
            >
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                     <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-[11px] font-bold leading-relaxed">{addressDetails}</span>
               </div>
               
               <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-green-600 bg-white px-2 py-1 rounded-md border border-green-200">Locked</span>
                  {onConfirm && (
                    <button 
                      onClick={onConfirm}
                      className="text-[9px] font-bold text-[var(--rust)] underline uppercase tracking-widest mt-1 hover:text-[#b03b25]"
                    >
                      Confirm
                    </button>
                  )}
               </div>
            </motion.div>
         ) : (
            <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted)]/50">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Drop a pin to capture location</span>
            </div>
         )}
         <div className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-[0.3em] text-center mt-4 opacity-40">
             Drag map or tap heritage sites to set coordinates
         </div>
      </div>
    </div>
  );
}
