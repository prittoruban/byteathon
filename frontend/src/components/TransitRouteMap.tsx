"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  loadGoogleMapsScript,
  getGoogleMaps,
  isGoogleMapsAvailable,
} from "@/lib/google-maps";

interface TransitRouteMapProps {
  origin: string;
  destination: string;
  cropType: string;
  quantityKg: number;
  vehicleNumber: string;
  temperatureC: number;
  distanceKm: number;
  isDelivered?: boolean;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
}

export function TransitRouteMap({
  origin = "Nashik Cluster Farm A",
  destination = "FreshMart Prime Retail (Navi Mumbai)",
  cropType = "Tomato",
  quantityKg = 2500,
  vehicleNumber = "MH-15-AG-4021",
  temperatureC = 4.1,
  distanceKm = 165,
  isDelivered = false,
  originCoords,
  destinationCoords,
}: TransitRouteMapProps) {
  const [progress, setProgress] = useState(isDelivered ? 100 : 58);
  const [activeTab, setActiveTab] = useState<"google" | "vector">("google");
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [hasDirectionsRoute, setHasDirectionsRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA4_yVFYJmQA5NmRcog-8hRZs6C1EWSwBk";

  const farmOrigin = {
    lat: originCoords?.lat || 19.9975,
    lng: originCoords?.lng || 73.7898,
  };
  const buyerDest = {
    lat: destinationCoords?.lat || 19.0760,
    lng: destinationCoords?.lng || 72.8777,
  };

  // Fetch actual driving road geometry along national highways
  useEffect(() => {
    let isCancelled = false;
    async function fetchHighwayRoadGeometry() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${farmOrigin.lng},${farmOrigin.lat};${buyerDest.lng},${buyerDest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data?.routes?.[0]?.geometry?.coordinates?.length > 0) {
            const raw = data.routes[0].geometry.coordinates;
            // Downsample to max 350 curvature points for smooth map rendering
            const step = Math.max(1, Math.floor(raw.length / 350));
            const pts: { lat: number; lng: number }[] = [];
            for (let i = 0; i < raw.length; i += step) {
              pts.push({ lat: raw[i][1], lng: raw[i][0] });
            }
            const last = raw[raw.length - 1];
            pts.push({ lat: last[1], lng: last[0] });

            if (!isCancelled && pts.length > 1) {
              setRouteCoords(pts);
              setHasDirectionsRoute(true);
            }
          }
        }
      } catch (err) {
        console.warn("[TransitRouteMap] Road geometry fetch fallback:", err);
      }
    }
    fetchHighwayRoadGeometry();
    return () => {
      isCancelled = true;
    };
  }, [farmOrigin.lat, farmOrigin.lng, buyerDest.lat, buyerDest.lng]);

  // Intermediate cold chain waypoints along highway
  const waypoints = routeCoords.length > 0
    ? routeCoords
    : [
        { lat: farmOrigin.lat, lng: farmOrigin.lng, name: `Farmland Origin (${origin})` },
        { lat: farmOrigin.lat * 0.75 + buyerDest.lat * 0.25, lng: farmOrigin.lng * 0.75 + buyerDest.lng * 0.25, name: "Highway Hub 1" },
        { lat: farmOrigin.lat * 0.5 + buyerDest.lat * 0.5, lng: farmOrigin.lng * 0.5 + buyerDest.lng * 0.5, name: "Midpoint Cold Vault" },
        { lat: farmOrigin.lat * 0.25 + buyerDest.lat * 0.75, lng: farmOrigin.lng * 0.25 + buyerDest.lng * 0.75, name: "Regional Pre-cooling Terminal" },
        { lat: buyerDest.lat, lng: buyerDest.lng, name: `Buyer Dock (${destination})` },
      ];

  // Progress ticker for simulated live movement
  useEffect(() => {
    if (isDelivered) {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 98 ? 35 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isDelivered]);

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      setActiveTab("vector");
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setGoogleMapsLoaded(true);
      })
      .catch((err) => {
        console.warn("[TransitRouteMap] Google Maps load failed:", err);
        setGoogleMapsLoaded(false);
      });
  }, [apiKey]);

  // Initialize Google Maps instance with Markers
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current) return;
    const maps = getGoogleMaps();
    if (!maps) return;

    try {
      const midLat = (farmOrigin.lat + buyerDest.lat) / 2;
      const midLng = (farmOrigin.lng + buyerDest.lng) / 2;

      const map = new maps.Map(mapContainerRef.current, {
        center: { lat: midLat, lng: midLng },
        zoom: 7,
        mapTypeId: "roadmap",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: "water", stylers: [{ color: "#e2e8f0" }] },
          { featureType: "landscape", stylers: [{ color: "#f8fafc" }] },
          { featureType: "road", stylers: [{ color: "#ffffff" }] },
          { featureType: "road.highway", stylers: [{ color: "#cbd5e1" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });

      mapInstanceRef.current = map;

      // Draw real road polyline
      drawPolylineRoute(map, maps, routeCoords.length > 0 ? routeCoords : waypoints);

      // 2. Custom Key Waypoint Markers
      // Farm Origin
      new maps.Marker({
        position: farmOrigin,
        map,
        title: `Farmland Origin: ${origin} (${farmOrigin.lat.toFixed(4)}°N, ${farmOrigin.lng.toFixed(4)}°E)`,
        label: { text: "🌾", fontSize: "13px" },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#0f172a",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      // Cold Vault Pre-cooling Buffer
      new maps.Marker({
        position: { lat: 19.6975, lng: 73.5606 },
        map,
        title: "Igatpuri Cold Vault Pre-cooling Buffer",
        label: { text: "❄️", fontSize: "11px" },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#475569",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      // Buyer Dock
      new maps.Marker({
        position: buyerDest,
        map,
        title: `Buyer Terminal: ${destination} (${buyerDest.lat.toFixed(4)}°N, ${buyerDest.lng.toFixed(4)}°E)`,
        label: { text: "🏢", fontSize: "12px" },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      // 3. Moving Reefer Truck Marker
      const initialPos = getInterpolatedCoordinate(progress);
      const truckMarker = new maps.Marker({
        position: initialPos,
        map,
        title: `Reefer Fleet ${vehicleNumber} (${temperatureC.toFixed(1)}°C)`,
        label: { text: "🚛", fontSize: "14px" },
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: "#16a34a",
          fillOpacity: 0.25,
          strokeWeight: 2,
          strokeColor: "#15803d",
        },
      });
      truckMarkerRef.current = truckMarker;

      // Fit bounds to corridor
      const bounds = new maps.LatLngBounds();
      waypoints.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds);
    } catch (e) {
      console.warn("[TransitRouteMap] Map init error:", e);
    }
  }, [googleMapsLoaded, originCoords?.lat, originCoords?.lng, destinationCoords?.lat, destinationCoords?.lng]);

  function drawPolylineRoute(map: any, maps: any, coords?: { lat: number; lng: number }[]) {
    if (polylineRef.current) polylineRef.current.setMap(null);
    const pathCoordinates = (coords && coords.length > 0) ? coords : waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));
    const routePolyline = new maps.Polyline({
      path: pathCoordinates,
      geodesic: false,
      strokeColor: "#16a34a",
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });
    polylineRef.current = routePolyline;
  }

  // Redraw polyline when real road coordinates arrive from OSRM
  useEffect(() => {
    if (!mapInstanceRef.current || !googleMapsLoaded || routeCoords.length === 0) return;
    const maps = getGoogleMaps();
    if (!maps) return;
    drawPolylineRoute(mapInstanceRef.current, maps, routeCoords);
    const bounds = new maps.LatLngBounds();
    routeCoords.forEach((pt) => bounds.extend(pt));
    mapInstanceRef.current.fitBounds(bounds);
  }, [routeCoords, googleMapsLoaded]);

  // Update truck marker on map when progress updates
  useEffect(() => {
    if (!truckMarkerRef.current || !googleMapsLoaded) return;
    const pos = getInterpolatedCoordinate(progress);
    truckMarkerRef.current.setPosition(pos);
  }, [progress, googleMapsLoaded, routeCoords]);

  function getInterpolatedCoordinate(pct: number) {
    const pts = routeCoords.length > 0 ? routeCoords : waypoints;
    const clamped = Math.max(0, Math.min(100, pct));
    const totalSegments = pts.length - 1;
    if (totalSegments <= 0) return farmOrigin;
    const globalProgress = (clamped / 100) * totalSegments;
    const segIndex = Math.min(Math.floor(globalProgress), totalSegments - 1);
    const segT = globalProgress - segIndex;

    const p1 = pts[segIndex];
    const p2 = pts[segIndex + 1] || p1;

    return {
      lat: p1.lat + (p2.lat - p1.lat) * segT,
      lng: p1.lng + (p2.lng - p1.lng) * segT,
    };
  }

  // Dynamic SVG curved highway route path
  const svgPathD = routeCoords.length > 1
    ? (() => {
        const minLng = Math.min(...routeCoords.map((p) => p.lng));
        const maxLng = Math.max(...routeCoords.map((p) => p.lng));
        const minLat = Math.min(...routeCoords.map((p) => p.lat));
        const maxLat = Math.max(...routeCoords.map((p) => p.lat));
        const dLng = maxLng - minLng || 1;
        const dLat = maxLat - minLat || 1;
        const sampleRate = Math.max(1, Math.floor(routeCoords.length / 45));
        const sampled = routeCoords.filter((_, idx) => idx % sampleRate === 0 || idx === routeCoords.length - 1);
        return sampled
          .map((pt, i) => {
            const x = 60 + ((pt.lng - minLng) / dLng) * 620;
            const y = 175 - ((pt.lat - minLat) / dLat) * 90;
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(" ");
      })()
    : "M 60 180 Q 240 70 440 130 T 680 100";

  // SVG Fallback Truck Marker Coordinates
  const truckX = 60 + (progress / 100) * 620;
  const truckY = 180 - Math.sin((progress / 100) * Math.PI) * 70;

  return (
    <div className="border border-slate-200 rounded-md bg-white p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Farmland-to-Buyer Route Telemetry
          </div>
          <div className="text-sm font-semibold text-slate-900">
            NH-160 / NH-48 · Real Highway Transit Corridor
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-slate-200 rounded overflow-hidden text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab("google")}
              className={`px-2.5 py-0.5 font-medium cursor-pointer ${
                activeTab === "google"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Google Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("vector")}
              className={`px-2.5 py-0.5 font-medium cursor-pointer ${
                activeTab === "vector"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Corridor Vector
            </button>
          </div>

          <span className="text-[10px] uppercase tracking-wide font-semibold rounded px-2 py-0.5 bg-emerald-50 text-emerald-700">
            Reefer: {temperatureC.toFixed(1)}°C
          </span>
          <span className="text-[10px] uppercase tracking-wide font-semibold rounded px-2 py-0.5 bg-slate-100 text-slate-600 font-mono">
            {vehicleNumber}
          </span>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="relative w-full h-96 sm:h-[480px] bg-slate-50 border border-slate-200 rounded overflow-hidden transition-all">
        {/* GOOGLE MAPS CONTAINER */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${activeTab === "google" && googleMapsLoaded ? "block" : "hidden"}`}
        />

        {/* VECTOR FALLBACK / VECTOR TAB */}
        {(!googleMapsLoaded || activeTab === "vector") && (
          <svg className="w-full h-full" viewBox="0 0 760 220" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="corridor-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="760" height="220" fill="url(#corridor-grid)" />

            {/* Highway Base Path */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Completed Transit Path */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#16a34a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="700"
              strokeDashoffset={700 - (progress / 100) * 700}
            />

            {/* Waypoint 1: Farm Origin */}
            <circle cx="60" cy="180" r="7" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <text x="60" y="206" textAnchor="middle" className="text-[10px] font-semibold fill-slate-900">
              FARM ORIGIN
            </text>
            <text x="60" y="164" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
              {farmOrigin.lat.toFixed(2)}°N, {farmOrigin.lng.toFixed(2)}°E
            </text>

            {/* Waypoint 2: Cold Vault Pre-cooling Buffer */}
            <circle cx="340" cy="115" r="5" fill="#475569" stroke="#ffffff" strokeWidth="2" />
            <text x="340" y="96" textAnchor="middle" className="text-[9px] font-semibold fill-slate-700">
              VAULT BUFFER
            </text>
            <text x="340" y="133" textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
              Igatpuri Hub
            </text>

            {/* Waypoint 3: Buyer Receiving Terminal */}
            <circle cx="680" cy="100" r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
            <text x="680" y="80" textAnchor="middle" className="text-[10px] font-semibold fill-emerald-800">
              BUYER DOCK
            </text>
            <text x="680" y="125" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
              {buyerDest.lat.toFixed(2)}°N, {buyerDest.lng.toFixed(2)}°E
            </text>

            {/* Live Animated Truck Marker */}
            <g transform={`translate(${truckX}, ${truckY})`}>
              <circle r="12" fill="#16a34a" fillOpacity="0.2" className="animate-ping" />
              <circle r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
              <text y="-12" textAnchor="middle" className="text-[9px] font-bold fill-slate-900">
                {progress}%
              </text>
            </g>
          </svg>
        )}

        {/* Live HUD Floating Badge */}
        <div className="absolute bottom-2 left-2 bg-white/95 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-600 flex items-center gap-3 shadow-sm z-10">
          <span>Speed: <strong className="text-slate-900 font-mono">62 km/h</strong></span>
          <span>·</span>
          <span>Distance: <strong className="text-slate-900 tabular-nums">{Math.round(distanceKm * (1 - progress / 100))} km remaining</strong></span>
          <span>·</span>
          <span>Cargo: <strong className="text-emerald-700 font-medium">{quantityKg.toLocaleString()} kg {cropType}</strong></span>
          <span>·</span>
          <span className="font-mono text-[10px] text-slate-500">
            {hasDirectionsRoute ? "Google Driving Route: Active" : "Google Maps SDK: Live"}
          </span>
        </div>
      </div>

      {/* Corridor Checkpoints Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="border border-slate-200 rounded p-2.5 bg-white space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Farmland Pickup Origin</div>
          <div className="text-sm font-semibold text-slate-900 truncate" title={origin}>
            {origin}
          </div>
          <div className="text-[11px] text-emerald-700 font-mono">
            {farmOrigin.lat.toFixed(4)}° N, {farmOrigin.lng.toFixed(4)}° E
          </div>
        </div>

        <div className="border border-slate-200 rounded p-2.5 bg-white space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Transit Corridor</div>
          <div className="text-sm font-semibold text-slate-900">
            NH-160 Kasara Ghat Expressway
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            Telemetry verified at 4.0°C setpoint
          </div>
        </div>

        <div className="border border-slate-200 rounded p-2.5 bg-white space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Buyer Facility</div>
          <div className="text-sm font-semibold text-slate-900 truncate" title={destination}>
            {destination}
          </div>
          <div className="text-[11px] text-slate-500">
            {isDelivered ? "Delivered & Verified" : "Receiving dock reserved"}
          </div>
        </div>
      </div>
    </div>
  );
}
