const dial = document.getElementById('compass-dial') as SVGGElement | null;
const headingDeg = document.getElementById('heading-deg')!;
const headingDir = document.getElementById('heading-dir')!;

let currentHeading = 0;

function getDirection(deg: number): string {
  const dirs = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

function updateDisplay(heading: number) {
  currentHeading = heading;
  const rounded = Math.round(heading);
  headingDeg.textContent = `${rounded}\u00B0`;
  headingDir.textContent = getDirection(heading);

  if (dial) {
    dial.style.transform = `rotate(${-heading}deg)`;
  }
}

function onOrientation(e: DeviceOrientationEvent) {
  // iOS provides webkitCompassHeading (0-360, true north)
  const heading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
    .webkitCompassHeading;

  if (heading != null) {
    updateDisplay(heading);
  } else if (e.alpha != null) {
    // Non-iOS fallback: alpha is relative, 0 = initial direction
    updateDisplay(360 - e.alpha);
  }
}

export function startCompass(): boolean {
  if (!('DeviceOrientationEvent' in window)) {
    return false;
  }
  window.addEventListener('deviceorientation', onOrientation, true);
  return true;
}

export function getHeading(): number {
  return currentHeading;
}
