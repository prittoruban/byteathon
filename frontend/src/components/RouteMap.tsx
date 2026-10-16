"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Truck,
  Warehouse,
  Sprout,
  ThermometerSnowflake,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Route,
  Flame,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  loadGoogleMapsScript,
  isGoogleMapsAvailable,
  getGoogleMaps,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DEMO_COORDINATES,
} from "@/lib/google-maps";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: "farmer" | "buyer" | "storage" | "vehicle";
  crop?: string;
  status?: string;
  isRefrigerated?: boolean;
  currentTemp?: number;
}

interface MapRoute {
  id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  cropType: string;
  quantityKg: number;
  distanceKm: number;
  transitHours: number;
  netMargin: number;
  shelfLifeMarginHours: number;
  buyerType: string;
  vehicleNumber: string;
  isRefrigerated: boolean;
  spoilageRiskScore: number;
  riskLevel: "SAFE" | "WARNING" | "CRITICAL";
  isReroute: boolean;
  explanation: string;
  accelerationFactor?: number;
  updatedRemainingShelfLifeHours?: number;
}

interface RouteMapProps {
  recommendations: MapRoute[];
  markers: MapMarker[];
  workflowData: any | null;
  onRouteClick?: (route: MapRoute) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Spoilage-based route color                                         */
/* ------------------------------------------------------------------ */

function getRouteColor(riskLevel: MapRoute["riskLevel"], isReroute: boolean) {
  if (isReroute) {
    return { color: "#A16207", weight: 4, opacity: 0.9, dashArray: "6, 6" };
  }
  switch (riskLevel) {
    case "CRITICAL":
      return { color: "#DC2626", weight: 4, opacity: 0.9 };
    case "WARNING":
      return { color: "#D97706", weight: 4, opacity: 0.8 };
    case "SAFE":
    default:
      return { color: "#15803D", weight: 3, opacity: 0.7 };
  }
}

/* ------------------------------------------------------------------ */
/* Fallback SVG Map (when Google Maps API key is not available)       */
/* ------------------------------------------------------------------ */

const FALLBACK_BOUNDS = {
  minLat: 18.4,
  maxLat: 20.1,
  minLng: 72.7,
  maxLng: 74.1,
};

function projectLatLng(lat: number, lng: number, width: number, height: number) {
  const x =
    ((lng - FALLBACK_BOUNDS.minLng) /
      (FALLBACK_BOUNDS.maxLng - FALLBACK_BOUNDS.minLng)) *
    width;
  const y =
    height -
    ((lat - FALLBACK_BOUNDS.minLat) /
      (FALLBACK_BOUNDS.maxLat - FALLBACK_BOUNDS.minLat)) *
      height;
  return { x, y };
}

export function RouteMap({
  recommendations,
  markers,
  workflowData,
  onRouteClick,
  className,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const googleRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routesRef = useRef<Map<string, any>>(new Map());

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyA4_yVFYJmQA5NmRcog-8hRZs6C1EWSwBk";

  /* -------- Load Google Maps API -------- */
  useEffect(() => {
    if (!apiKey || apiKey.includes("your-google-maps")) {
      setLoadError("Google Maps API key not configured. Showing demo map.");
      setMapsLoaded(false);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setMapsLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err.message);
        setMapsLoaded(false);
      });
  }, [apiKey]);

  /* -------- Initialize Google Map -------- */
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    const maps = getGoogleMaps();
    if (!maps) return;

    const map = new maps.Map(mapRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      clickableIcons: false,
    });

    googleRef.current = maps;
    mapInstanceRef.current = map;

    renderMarkers(map, maps);
    renderRoutes(map, maps);
  }, [mapsLoaded, recommendations, markers]);

  /* -------- Re-render when workflow data changes (reroute) -------- */
  useEffect(() => {
    if (!mapInstanceRef.current || !googleRef.current) return;
    const maps = googleRef.current;
    renderMarkers(mapInstanceRef.current, maps);
    renderRoutes(mapInstanceRef.current, maps);
  }, [workflowData]);

  /* -------- Render Markers -------- */
  const renderMarkers = useCallback((map: any, maps: any) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    const markerIcons: Record<string, string> = {
      farmer: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      buyer: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      storage: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
      vehicle: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    };

    markers.forEach((marker) => {
      const position = { lat: marker.lat, lng: marker.lng };
      const gMarker = new maps.Marker({
        position,
        map,
        title: marker.label,
        icon: {
          url: markerIcons[marker.type],
          scaledSize: new maps.Size(32, 32),
        },
      });

      const infoWindow = new maps.InfoWindow({
        content: buildMarkerInfoContent(marker),
      });

      gMarker.addListener("click", () => {
        infoWindow.open(map, gMarker);
      });

      markersRef.current.set(marker.id, gMarker);
    });
  }, [markers]);

  /* -------- Render Routes -------- */
  const renderRoutes = useCallback((map: any, maps: any) => {
    routesRef.current.forEach((r) => r.setMap(null));
    routesRef.current.clear();

    recommendations.forEach((route) => {
      const style = getRouteColor(route.riskLevel, route.isReroute);
      const path = [route.origin, route.destination];

      const polyline = new maps.Polyline({
        path: path as any,
        geodesic: true,
        strokeColor: style.color,
        strokeOpacity: style.opacity,
        strokeWeight: style.weight,
        icons: route.isReroute
          ? [
              {
                icon: {
                  path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: style.color,
                },
                offset: "50%",
                repeat: "100px",
              },
            ]
          : [],
      });
      polyline.setMap(map);

      const infoWindow = new maps.InfoWindow({
        content: buildRouteInfoContent(route),
      });

      polyline.addListener("click", () => {
        if (onRouteClick) onRouteClick(route);
        infoWindow.setPosition(route.destination);
        infoWindow.open(map);
      });

      routesRef.current.set(route.id, polyline);
    });
  }, [recommendations, onRouteClick]);

  /* -------- HTML content builders (plain HTML strings for InfoWindow) -------- */
  const buildMarkerInfoContent = (marker: MapMarker) => {
    const typeLabels: Record<string, string> = {
      farmer: "Farm / Producer",
      buyer: "Buyer / Market",
      storage: "Cold Storage Facility",
      vehicle: "Transport Vehicle",
    };
    return `
      <div style="font-family: 'Fira Sans', sans-serif; min-width: 180px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="background: #15803D; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">
            ${marker.type === "farmer" ? "🌱" : marker.type === "buyer" ? "🏭" : marker.type === "storage" ? "❄️" : "🚚"}
          </div>
          <div>
            <div style="font-weight: 700; color: #14532D; font-size: 14px;">${escapeHtml(marker.label)}</div>
            <div style="font-size: 11px; color: #6B7280;">${typeLabels[marker.type]}</div>
          </div>
        </div>
        ${marker.crop ? `<div style="font-size: 11px; color: #15803D;"><strong>Crop:</strong> ${escapeHtml(marker.crop)}</div>` : ""}
        ${marker.status ? `<div style="font-size: 11px; color: #6B7280;"><strong>Status:</strong> ${escapeHtml(marker.status)}</div>` : ""}
        ${marker.currentTemp !== undefined ? `<div style="font-size: 11px; color: #D97706;"><strong>Temp:</strong> ${marker.currentTemp}°C</div>` : ""}
        <div style="font-size: 11px; color: #9CA3AF;">${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</div>
      </div>
    `;
  };

  const buildRouteInfoContent = (route: MapRoute) => {
    const riskColors: Record<string, string> = {
      SAFE: "#15803D",
      WARNING: "#D97706",
      CRITICAL: "#DC2626",
    };
    const riskColor = riskColors[route.riskLevel];
    const isRerouteBadge = route.isReroute
      ? '<span style="background:#A16207;color:white;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">REROUTE</span>'
      : "";

    return `
      <div style="font-family: 'Fira Sans', sans-serif; min-width: 260px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div style="font-weight: 700; color: #14532D; font-size: 14px;">${escapeHtml(route.origin.name)} → ${escapeHtml(route.destination.name)}</div>
          ${isRerouteBadge}
        </div>
        <div style="font-size: 11px; color: #6B7280; margin-bottom: 6px;">
          ${escapeHtml(route.cropType)} • ${route.quantityKg.toLocaleString()} kg • ${escapeHtml(route.vehicleNumber)}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 8px;">
          <div><div style="color:#9CA3AF;">Distance</div><div style="font-weight:700;color:#14532D;">${route.distanceKm} km</div></div>
          <div><div style="color:#9CA3AF;">Transit</div><div style="font-weight:700;color:#14532D;">${route.transitHours}h</div></div>
          <div><div style="color:#9CA3AF;">Net Margin</div><div style="font-weight:700;color:#15803D;">₹${route.netMargin.toLocaleString()}</div></div>
          <div><div style="color:#9CA3AF;">Shelf-Life Margin</div><div style="font-weight:700;color:${riskColor};">${route.shelfLifeMarginHours}h</div></div>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: ${riskColor}; margin-bottom: 4px;">
          Spoilage Risk: ${route.riskLevel} (${route.spoilageRiskScore}/100)
        </div>
        ${route.accelerationFactor !== undefined ? `<div style="font-size: 10px; color: #6B7280; margin-bottom: 4px;">Arrhenius acceleration: ${route.accelerationFactor}x</div>` : ""}
        ${route.updatedRemainingShelfLifeHours !== undefined ? `<div style="font-size: 10px; color: #6B7280;">Remaining life: ${route.updatedRemainingShelfLifeHours}h</div>` : ""}
        <div style="font-size: 10px; color: #9CA3AF; margin-top: 6px;">${escapeHtml(route.explanation)}</div>
      </div>
    `;
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  /* -------- Render Fallback Map (no API key) -------- */
  if (!mapsLoaded && !loadError && !apiKey) {
    return (
      <div className={`rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] ${className}`}>
        <div className="p-4 text-xs text-[#6B7280] font-mono text-center mb-2">
          Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env
        </div>
        <div className="h-[500px] relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] flex items-center justify-center">
          <div className="text-[#9CA3AF] text-sm">Demo Map Canvas — Nashik–Mumbai Corridor</div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#BBF7D0" stroke-width="1" />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    );
  }

  /* -------- Render Load Error -------- */
  if (loadError) {
    return (
      <div className={`rounded-2xl p-6 border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] text-xs font-mono ${className}`}>
        {loadError}
      </div>
    );
  }

  /* -------- Render Google Map -------- */
  return (
    <div className={`relative rounded-2xl overflow-hidden border border-[#BBF7D0] shadow-sm ${className}`}>
      <div ref={mapRef} className="w-full h-[600px]" />
      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs font-mono text-[#14532D] border border-[#BBF7D0]">
          <span className="w-2 h-2 rounded-full bg-[#15803D]" /> Safe Route
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs font-mono text-[#92400E] border border-[#FDE68A]">
          <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Warning Route
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs font-mono text-[#991B1B] border border-[#FECACA]">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Critical Route
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm text-xs font-mono text-[#92400E] border border-[#A16207]">
          <span className="w-2 h-2 rounded-full bg-[#A16207]" /> Reroute Path
        </div>
      </div>
      {/* Spoilage status banner if workflow data exists */}
      {workflowData && (
        <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl bg-[#14532D] text-white shadow-lg text-xs font-mono">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-[#DC2626]" />
            <span className="font-bold">Thermal Event Active</span>
          </div>
          <div className="text-[10px] opacity-90">
            Spoilage risk recalculated via Arrhenius kinetics • Routes updated dynamically
          </div>
        </div>
      )}
    </div>
  );
}
