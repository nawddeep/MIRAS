/**
 * The address of the hosted MIRAS app (PWA), from the build setting VITE_PWA_URL.
 * Only an https address is accepted: phones will not install a web app from plain http.
 * @param {unknown} raw
 * @returns {string | null}
 */
export function appLink(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
