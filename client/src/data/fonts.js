export const fontOptions = [
  { label: "Gotham Regular", value: "Gotham Regular", type: "local", stack: '"Gotham Regular", "Gotham", "Montserrat", Arial, sans-serif' },
  { label: "Inter", value: "Inter", google: "Inter", stack: '"Inter", Arial, sans-serif' },
  { label: "Montserrat", value: "Montserrat", google: "Montserrat", stack: '"Montserrat", Arial, sans-serif' },
  { label: "Poppins", value: "Poppins", google: "Poppins", stack: '"Poppins", Arial, sans-serif' },
  { label: "Roboto", value: "Roboto", google: "Roboto", stack: '"Roboto", Arial, sans-serif' },
  { label: "Lato", value: "Lato", google: "Lato", stack: '"Lato", Arial, sans-serif' },
  { label: "Raleway", value: "Raleway", google: "Raleway", stack: '"Raleway", Arial, sans-serif' },
  { label: "Oswald", value: "Oswald", google: "Oswald", stack: '"Oswald", Arial, sans-serif' },
  { label: "Bebas Neue", value: "Bebas Neue", google: "Bebas Neue", stack: '"Bebas Neue", Arial, sans-serif' },
  { label: "Orbitron", value: "Orbitron", google: "Orbitron", stack: '"Orbitron", Arial, sans-serif' },
  { label: "Cinzel", value: "Cinzel", google: "Cinzel", stack: '"Cinzel", Georgia, serif' },
  { label: "Playfair Display", value: "Playfair Display", google: "Playfair Display", stack: '"Playfair Display", Georgia, serif' },
  { label: "Merriweather", value: "Merriweather", google: "Merriweather", stack: '"Merriweather", Georgia, serif' },
  { label: "Rubik", value: "Rubik", google: "Rubik", stack: '"Rubik", Arial, sans-serif' },
  { label: "Teko", value: "Teko", google: "Teko", stack: '"Teko", Arial, sans-serif' },
  { label: "Rajdhani", value: "Rajdhani", google: "Rajdhani", stack: '"Rajdhani", Arial, sans-serif' },
  { label: "Exo 2", value: "Exo 2", google: "Exo 2", stack: '"Exo 2", Arial, sans-serif' },
  { label: "Barlow Condensed", value: "Barlow Condensed", google: "Barlow Condensed", stack: '"Barlow Condensed", Arial, sans-serif' },
  { label: "Cairo Arabic", value: "Cairo", google: "Cairo", stack: '"Cairo", Arial, sans-serif' },
  { label: "Tajawal Arabic", value: "Tajawal", google: "Tajawal", stack: '"Tajawal", Arial, sans-serif' },
  { label: "Noto Sans Arabic", value: "Noto Sans Arabic", google: "Noto Sans Arabic", stack: '"Noto Sans Arabic", Arial, sans-serif' },
  { label: "Noto Kufi Arabic", value: "Noto Kufi Arabic", google: "Noto Kufi Arabic", stack: '"Noto Kufi Arabic", Arial, sans-serif' },
  { label: "Almarai Arabic", value: "Almarai", google: "Almarai", stack: '"Almarai", Arial, sans-serif' },
  { label: "Changa Arabic", value: "Changa", google: "Changa", stack: '"Changa", Arial, sans-serif' },
  { label: "IBM Plex Sans Arabic", value: "IBM Plex Sans Arabic", google: "IBM Plex Sans Arabic", stack: '"IBM Plex Sans Arabic", Arial, sans-serif' },
  { label: "Readex Pro Arabic", value: "Readex Pro", google: "Readex Pro", stack: '"Readex Pro", Arial, sans-serif' },
  { label: "System UI", value: "System UI", stack: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }
];

export const animationOptions = [
  { label: "3D Gotham City", value: "3d-city" },
  { label: "None", value: "none" },
  { label: "Smooth Fade", value: "smooth-fade" },
  { label: "Gotham Pulse", value: "gotham-pulse" },
  { label: "Neon Sweep", value: "neon-sweep" },
  { label: "Cinematic Rise", value: "cinematic-rise" },
  { label: "Shadow Glitch", value: "shadow-glitch" }
];

const defaultStack = '"Inter", Arial, sans-serif';

export function fontStack(value) {
  const match = fontOptions.find((font) => font.value === value || font.label === value);
  if (match) return match.stack;
  if (!value) return defaultStack;
  return `"${String(value).replaceAll('"', '')}", ${defaultStack}`;
}

export function googleFontFamilies(values = []) {
  return [...new Set(values.map((value) => fontOptions.find((font) => font.value === value || font.label === value)?.google).filter(Boolean))];
}

export function googleFontsUrl(values = []) {
  const families = googleFontFamilies(values);
  if (!families.length) return "";
  const query = families
    .map((family) => `family=${encodeURIComponent(family).replaceAll("%20", "+")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
