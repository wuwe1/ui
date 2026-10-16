// Opened from the home screen (iOS Add to Home Screen, an installed PWA): no address bar, and the screen edges belong to the OS – drawer swipes yield (lib/drawer.ts)
export const standalone =
	typeof window !== "undefined" && (matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
