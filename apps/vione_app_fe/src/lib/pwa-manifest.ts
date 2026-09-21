// Versioned PWA manifest references.
//
// Browsers (and any intermediate cache) can hold on to a previously fetched
// web app manifest for a long time. When start_url / icons / name change, a
// user scanning the QR again could otherwise install the stale definition.
// Bumping BC_MANIFEST_VERSION changes the manifest URL, forcing a fresh fetch.
//
// IMPORTANT: bump this whenever public/manifest-bc.webmanifest changes.
export const BC_MANIFEST_VERSION = "2026-08-16.1";

/** Versioned href for the Vione App (Connect-app) manifest. */
export const BC_MANIFEST_HREF = `/manifest-bc.webmanifest?v=${BC_MANIFEST_VERSION}`;

// Legacy member app (/m) manifest — same cache-busting contract.
export const MEMBER_MANIFEST_VERSION = "2026-08-15.1";
export const MEMBER_MANIFEST_HREF = `/manifest.webmanifest?v=${MEMBER_MANIFEST_VERSION}`;
