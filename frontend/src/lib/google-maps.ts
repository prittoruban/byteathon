"use client";

/**
 * HARVEST ZERO — Google Maps Loader
 *
 * Dynamically loads the Google Maps JavaScript API when an API key is configured.
 * Provides a graceful fallback when no key is available (demo mode).
 */

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsScriptLoaded = false;
let googleMapsScriptLoading = false;
let googleMapsScriptPromise: Promise<void> | null = null;

/**
 * Loads the Google Maps JavaScript API script dynamically.
 * Resolves when the `google.maps` namespace is available.
 * Rejects if no API key is configured or the script fails to load.
 */
export function loadGoogleMapsScript(apiKey?: string): Promise<void> {
  if (!apiKey) {
    return Promise.reject(new Error("GOOGLE_MAPS_API_KEY not configured"));
  }

  if (googleMapsScriptLoaded) {
    return Promise.resolve();
  }

  if (googleMapsScriptLoading) {
    return googleMapsScriptPromise!;
  }

  googleMapsScriptLoading = true;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const scriptId = "google-maps-script";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsScriptLoaded = true;
      googleMapsScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      googleMapsScriptLoading = false;
      googleMapsScriptPromise = null;
      reject(new Error("Failed to load Google Maps JavaScript API"));
    };

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

/**
 * Checks if Google Maps is already loaded globally.
 */
export function isGoogleMapsAvailable(): boolean {
  return typeof window !== "undefined" && !!window.google && !!window.google.maps;
}

/**
 * Returns the google.maps namespace if available.
 */
export function getGoogleMaps(): any {
  if (isGoogleMapsAvailable()) {
    return window.google.maps;
  }
  return null;
}

/**
 * Default map center for the HARVEST ZERO demo region (Nashik–Mumbai corridor, Maharashtra, India).
 */
export const DEFAULT_MAP_CENTER = { lat: 19.5, lng: 73.3 };

export const DEFAULT_MAP_ZOOM = 8;

/**
 * Known demo coordinates for the Nashik–Mumbai logistics corridor.
 * Used as defaults when entity coordinates are not present in the database.
 */
export const DEMO_COORDINATES: Record<string, { lat: number; lng: number }> = {
  nashik: { lat: 19.9975, lng: 73.7898 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  thane: { lat: 19.2183, lng: 72.9781 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nashik_road: { lat: 20.0, lng: 73.8 },
  mumbai_central: { lat: 19.0544, lng: 72.8555 },
};
