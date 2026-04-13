export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
}

type LocationCallback = (data: LocationData) => void;

let watchId: number | null = null;

export function startLocation(onUpdate: LocationCallback, onError: (msg: string) => void) {
  if (!navigator.geolocation) {
    onError('Geolocation not supported');
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude,
      });
    },
    (err) => {
      onError(err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    }
  );
}

export function stopLocation() {
  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
