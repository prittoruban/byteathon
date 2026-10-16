"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  loadGoogleMapsScript,
  getGoogleMaps,
  isGoogleMapsAvailable,
} from "@/lib/google-maps";
import { useLanguage } from "@/lib/i18n";

interface FarmLandLocationPickerProps {
  locationName: string;
  latitude: number;
  longitude: number;
  onChange: (location: {
    locationName: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export function FarmLandLocationPicker({
  locationName,
  latitude,
  longitude,
  onChange,
}: FarmLandLocationPickerProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid" | "roadmap">("satellite");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const { t } = useLanguage();

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA4_yVFYJmQA5NmRcog-8hRZs6C1EWSwBk";

  // Pre-load Google Maps SDK
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMapsScript(apiKey)
      .then(() => setMapsLoaded(true))
      .catch((err) => {
        console.warn("[FarmLandLocationPicker] Google Maps failed to load:", err);
      });
  }, [apiKey]);

  // Initialize interactive land picker map when mapOpen is toggled
  useEffect(() => {
    if (!mapOpen || !mapsLoaded || !mapContainerRef.current) return;
    const maps = getGoogleMaps();
    if (!maps) return;

    try {
      const initialPos = { lat: latitude || 20.0, lng: longitude || 73.8 };

      const map = new maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15, // Detailed zoom for farm land parcels
        mapTypeId: mapType,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Draggable farm land pin
      const marker = new maps.Marker({
        position: initialPos,
        map,
        draggable: true,
        title: "Exact Farmland Parcel Location",
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      markerRef.current = marker;

      // Click anywhere on farmland to move pin
      map.addListener("click", (e: any) => {
        const lat = parseFloat(e.latLng.lat().toFixed(5));
        const lng = parseFloat(e.latLng.lng().toFixed(5));
        marker.setPosition({ lat, lng });
        reverseGeocode(lat, lng, maps);
      });

      // Drag pin to adjust exact parcel boundary
      marker.addListener("dragend", (e: any) => {
        const lat = parseFloat(e.latLng.lat().toFixed(5));
        const lng = parseFloat(e.latLng.lng().toFixed(5));
        reverseGeocode(lat, lng, maps);
      });
    } catch (e) {
      console.warn("[FarmLandLocationPicker] Map initialization error:", e);
    }
  }, [mapOpen, mapsLoaded, mapType]);

  // Reverse geocoding helper using Google Geocoder
  const reverseGeocode = (lat: number, lng: number, maps?: any) => {
    const googleMaps = maps || getGoogleMaps();
    if (googleMaps && googleMaps.Geocoder) {
      setGeocoding(true);
      const geocoder = new googleMaps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          setGeocoding(false);
          if (status === "OK" && results && results[0]) {
            const formatted = results[0].formatted_address;
            onChange({
              locationName: formatted,
              latitude: lat,
              longitude: lng,
            });
          } else {
            onChange({
              locationName: `Farmland Plot (${lat}° N, ${lng}° E)`,
              latitude: lat,
              longitude: lng,
            });
          }
        }
      );
    } else {
      onChange({
        locationName: `Farmland Plot (${lat}° N, ${lng}° E)`,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  // Search location using Geocoder
  const handleSearchAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const maps = getGoogleMaps();
    if (!maps || !maps.Geocoder) return;

    setGeocoding(true);
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any[], status: string) => {
      setGeocoding(false);
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = parseFloat(loc.lat().toFixed(5));
        const lng = parseFloat(loc.lng().toFixed(5));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }

        onChange({
          locationName: results[0].formatted_address,
          latitude: lat,
          longitude: lng,
        });
      }
    });
  };

  // Browser GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }

        reverseGeocode(lat, lng);
        setDetectingGps(false);
      },
      () => {
        setDetectingGps(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2">
      {/* Location & GPS Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-[#475569]">
              {t("farmer.farmland_address", "Farmland Address / Village")}
            </label>
            {geocoding && (
              <span className="text-[11px] text-emerald-600 font-medium">
                {t("farmer.resolving_address", "Resolving address...")}
              </span>
            )}
          </div>
          <input
            type="text"
            value={locationName}
            onChange={(e) =>
              onChange({
                locationName: e.target.value,
                latitude,
                longitude,
              })
            }
            placeholder={t("farmer.address_placeholder", "e.g. Survey No. 42, Deola Taluka, Nashik")}
            required
            className="w-full h-10 px-3 rounded-md border border-[#cbd5e1] text-[14px] text-[#1e293b] bg-white focus:border-[#16a34a] focus:ring-4 focus:ring-emerald-600/10 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <label className="text-[12px] font-medium text-[#475569]">
              {t("farmer.gps_coordinates", "GPS Coordinates")}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingGps}
                className="h-7 px-2.5 sm:px-3 text-[11px] font-semibold border border-[#cbd5e1] rounded text-[#475569] hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition-colors touch-manipulation"
              >
                <svg
                  className="w-3 h-3 text-[#64748b]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                {detectingGps ? t("farmer.detecting", "Detecting...") : t("farmer.detect_gps", "Detect GPS")}
              </button>
              <button
                type="button"
                onClick={() => setMapOpen(!mapOpen)}
                className="text-[11px] font-medium text-[#64748b] hover:text-[#0f172a] cursor-pointer transition-colors touch-manipulation py-1"
              >
                {mapOpen ? t("farmer.close_pin", "Close Pin") : t("farmer.pin_map", "Pin on Map")}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`}
            readOnly
            className="w-full h-10 px-3 rounded-md border border-[#cbd5e1] text-[14px] text-[#1e293b] bg-[#f8fafc] font-mono tabular-nums"
          />
        </div>
      </div>

      {/* Interactive Satellite Land Parcel Picker Drawer */}
      {mapOpen && (
        <div className="border border-slate-200 rounded-md bg-white p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {t("farmer.satellite_pinpoint", "Satellite Farmland Boundary Pinpoint")}
              </div>
              <p className="text-xs text-slate-500">
                {t("farmer.satellite_guide", "Click anywhere on your field or drag the green pin to set the exact harvest pickup dock.")}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setMapType("satellite")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  mapType === "satellite"
                    ? "bg-slate-900 text-white font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapType("hybrid")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  mapType === "hybrid"
                    ? "bg-slate-900 text-white font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Hybrid
              </button>
              <button
                type="button"
                onClick={() => setMapType("roadmap")}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  mapType === "roadmap"
                    ? "bg-slate-900 text-white font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Roadmap
              </button>
            </div>
          </div>

          {/* Search bar inside map */}
          <form onSubmit={handleSearchAddress} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("farmer.search_land_placeholder", "Search village, taluka, landmark (e.g. Pimpalgaon Baswant, Nashik)...")}
              className="flex-1 min-w-0 h-8 sm:h-7 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
            />
            <button
              type="submit"
              className="h-8 sm:h-7 px-3 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0 touch-manipulation"
            >
              {t("farmer.locate_land", "Locate Land")}
            </button>
          </form>

          {/* Google Map Container */}
          <div className="relative w-full h-96 sm:h-[480px] rounded border border-slate-200 overflow-hidden bg-slate-100 transition-all">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 bg-white/95 border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-600 font-mono shadow-xs">
              Target: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
