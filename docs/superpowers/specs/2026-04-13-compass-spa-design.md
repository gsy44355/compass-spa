# Compass SPA Design Spec

## Overview

A pure frontend single-page compass web app optimized for iOS Safari. Users open the page on their iPhone, grant sensor/location permissions once, and see a real-time compass with location and atmospheric data. Built with Vite + TypeScript, deployed to a self-hosted HTTPS server.

## Features

| Feature | Data Source | API |
|---------|------------|-----|
| Compass heading | Device magnetometer | `DeviceOrientationEvent.webkitCompassHeading` / `alpha` |
| Latitude / Longitude | Device GPS | `navigator.geolocation.watchPosition()` |
| Region name | Network API | OpenStreetMap Nominatim reverse geocoding (free, no key) |
| Altitude | Device GPS + network | `GeolocationCoordinates.altitude`, fallback to Open-Meteo elevation API |
| Atmospheric pressure | Network API | Open-Meteo current weather API (free, no key) |

## Tech Stack

- **Vite + TypeScript** — build toolchain
- **Pure CSS** — no UI framework, glassmorphism style
- **SVG** — compass rendering
- **Zero runtime dependencies** — all vanilla

## Visual Design

### Layout (portrait fullscreen, top to bottom)

1. **Compass area (~55%)** — centered circular compass in a glassmorphism ring
2. **Heading display** — large degree number + direction text (e.g., "325° Northwest")
3. **Data grid (~35%)** — 2x2 glassmorphism card grid:
   - Top-left: Lat / Lng
   - Top-right: Region (Chinese place name)
   - Bottom-left: Altitude (meters)
   - Bottom-right: Pressure (hPa)

### Style

- **Background**: deep gradient (dark blue → dark purple), subtle noise texture overlay
- **Glass cards**: `backdrop-filter: blur(20px)`, semi-transparent white border, 16px border-radius
- **Compass**: SVG with white tick marks, red north needle, N/E/S/W labels
- **Typography**: system font stack (`-apple-system`), tabular nums for data, thin weight for heading number
- **Colors**: white primary text, muted secondary text, red only for north needle
- **Language**: mixed — labels in English (Lat/Lng, Altitude, Pressure, Region), region name in Chinese

### Reference mockup

See `.superpowers/brainstorm/67776-1776068376/content/compass-mockup.html`

## Permission Flow

1. First visit: show a centered glassmorphism welcome card with a "Start" button
2. On button tap (user gesture required):
   - Request `DeviceOrientationEvent.requestPermission()` → compass access
   - Request `navigator.geolocation.getCurrentPosition()` → triggers location permission
3. On success: save permission state to `localStorage`, fade out welcome card, fade in compass UI
4. Subsequent visits: check `localStorage`, skip welcome card, go directly to compass UI
5. On permission denied: show friendly message explaining which permissions are needed and why

## Data Flow

### Compass Heading
- Listen to `deviceorientation` event
- Use `event.webkitCompassHeading` (iOS-specific, 0-360, 0=north) as primary source
- Fallback to `360 - event.alpha` for non-iOS browsers
- Apply CSS transform rotation to the compass SVG element
- Update heading degree display

### Geolocation
- Use `watchPosition()` for continuous updates
- Extract `latitude`, `longitude`, `altitude` from position coords
- `altitude` may be `null` — handle gracefully (show "—" or fetch from API)

### Reverse Geocoding (Region)
- On position update (throttled, max once per 30 seconds):
  - Call Nominatim API: `https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json&accept-language=zh`
  - Extract city/district name from response
  - Cache result; only re-fetch if position changes significantly (>500m)

### Altitude (enhanced)
- Primary: GPS `altitude` from GeolocationCoordinates
- Fallback: Open-Meteo elevation API `https://api.open-meteo.com/v1/elevation?latitude=X&longitude=Y`
- Only call fallback if GPS altitude is `null`

### Atmospheric Pressure
- On position acquired, call Open-Meteo:
  `https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current=pressure_msl`
- Refresh every 10 minutes or on significant position change
- Display in hPa

## Error Handling

- **Compass permission denied**: show message, data cards still work with location
- **Location permission denied**: show message, all data shows "—"
- **API calls fail** (network error): show last cached value or "—", retry silently
- **Altitude unavailable**: show "—"
- **No compass on device** (desktop): show static compass, note device incompatibility

## Project Structure

```
compass_spa/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts          # Entry point, permission flow, app init
│   ├── compass.ts       # DeviceOrientation handling, heading calculation
│   ├── location.ts      # Geolocation watchPosition, coordinate tracking
│   ├── api.ts           # Nominatim + Open-Meteo API calls
│   ├── ui.ts            # DOM updates, animations, card rendering
│   └── style.css        # All styles (glassmorphism, compass, layout)
└── public/
    └── (empty or favicon)
```

## Performance Considerations

- Compass rotation: use CSS `transform: rotate()` with `will-change: transform` for GPU acceleration
- Throttle DOM updates to ~30fps for heading display (requestAnimationFrame)
- Debounce/throttle API calls (geocoding: 30s, weather: 10min)
- Minimal DOM — single page, no virtual DOM overhead

## iOS-Specific Notes

- `DeviceOrientationEvent.requestPermission()` must be called from user gesture (tap handler)
- `webkitCompassHeading` is iOS-specific; provides true north heading (not magnetic)
- HTTPS required for both sensor APIs and geolocation
- `viewport-fit=cover` + safe area insets for notch/Dynamic Island devices
- Add `apple-mobile-web-app-capable` meta tag for fullscreen PWA experience
- Status bar style: `black-translucent` to blend with dark background
