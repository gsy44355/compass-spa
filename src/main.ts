import './style.css';
import { startCompass } from './compass';
import { startLocation, type LocationData } from './location';
import { fetchRegion, fetchWeather } from './api';

const PERMISSION_KEY = 'compass_permission_granted';

const $welcome = document.getElementById('welcome')!;
const $app = document.getElementById('app')!;
const $startBtn = document.getElementById('start-btn')!;

const $latlng = document.getElementById('data-latlng')!;
const $region = document.getElementById('data-region')!;
const $altitude = document.getElementById('data-altitude')!;
const $pressure = document.getElementById('data-pressure')!;

// --- Throttle helpers ---
let lastGeocodeFetch = 0;
let lastWeatherFetch = 0;
let lastLat = 0;
let lastLng = 0;

const GEOCODE_INTERVAL = 30_000; // 30s
const WEATHER_INTERVAL = 600_000; // 10min

function hasMoved(lat: number, lng: number, threshold = 0.005): boolean {
  return Math.abs(lat - lastLat) > threshold || Math.abs(lng - lastLng) > threshold;
}

// --- UI updates ---
function updateLocationUI(data: LocationData) {
  $latlng.innerHTML = `${data.latitude.toFixed(4)}&deg;<br>${data.longitude.toFixed(4)}&deg;`;

  if (data.altitude != null) {
    $altitude.innerHTML = `${data.altitude.toFixed(1)}<span class="unit">m</span>`;
  }

  const now = Date.now();
  const moved = hasMoved(data.latitude, data.longitude);

  // Fetch region (throttled)
  if (now - lastGeocodeFetch > GEOCODE_INTERVAL || moved) {
    lastGeocodeFetch = now;
    fetchRegion(data.latitude, data.longitude)
      .then((name) => { $region.textContent = name; })
      .catch(() => { /* keep last value */ });
  }

  // Fetch weather/pressure (throttled)
  if (now - lastWeatherFetch > WEATHER_INTERVAL || moved) {
    lastWeatherFetch = now;
    fetchWeather(data.latitude, data.longitude)
      .then(({ pressure, elevation }) => {
        if (pressure != null) {
          $pressure.innerHTML = `${pressure.toFixed(1)}<span class="unit">hPa</span>`;
        }
        // Use API elevation as fallback if GPS altitude is unavailable
        if (data.altitude == null && elevation != null) {
          $altitude.innerHTML = `${elevation.toFixed(1)}<span class="unit">m</span>`;
        }
      })
      .catch(() => { /* keep last value */ });
  }

  if (moved) {
    lastLat = data.latitude;
    lastLng = data.longitude;
  }
}

// --- Permission & init ---
async function requestPermissions(): Promise<boolean> {
  // Request DeviceOrientation permission (iOS 13+)
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };

  if (typeof DOE.requestPermission === 'function') {
    const result = await DOE.requestPermission();
    if (result !== 'granted') {
      alert('Compass requires motion sensor permission.');
      return false;
    }
  }

  return true;
}

function showApp() {
  $welcome.classList.add('hidden');
  $app.classList.remove('hidden');

  startCompass();
  startLocation(updateLocationUI, (msg) => {
    console.warn('Location error:', msg);
  });
}

function init() {
  // Already granted — go straight to app
  if (localStorage.getItem(PERMISSION_KEY) === 'true') {
    $welcome.classList.add('hidden');
    showApp();
    return;
  }

  // Show welcome screen
  $welcome.classList.remove('hidden');
  $app.classList.add('hidden');

  $startBtn.addEventListener('click', async () => {
    const granted = await requestPermissions();
    if (granted) {
      localStorage.setItem(PERMISSION_KEY, 'true');
      showApp();
    }
  });
}

init();
