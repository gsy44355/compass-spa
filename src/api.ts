// Reverse geocoding via OpenStreetMap Nominatim
export async function fetchRegion(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=zh&zoom=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  // Try city/town/village, fallback to display_name
  const addr = data.address;
  return addr?.city || addr?.town || addr?.village || addr?.county || data.display_name || '—';
}

// Atmospheric pressure + elevation via Open-Meteo
export async function fetchWeather(lat: number, lng: number): Promise<{
  pressure: number | null;
  elevation: number | null;
}> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=pressure_msl&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API failed');
  const data = await res.json();
  return {
    pressure: data.current?.pressure_msl ?? null,
    elevation: data.elevation ?? null,
  };
}
