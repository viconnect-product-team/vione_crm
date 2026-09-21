// In-memory hand-off for photos captured on the "connected" success screen.
// The composer consumes them once on mount; nothing is persisted anywhere.

let staged: File[] = [];

export function stageMomentPhotos(files: File[]): void {
  staged = files.slice(0, 4);
}

export function takeStagedMomentPhotos(): File[] {
  const out = staged;
  staged = [];
  return out;
}
