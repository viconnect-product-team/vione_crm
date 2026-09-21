// Responsive WebP image for the landing page.
// Uses pre-generated width variants in /public/landing so mobile devices only
// download the size they actually need, with intrinsic ratio to avoid layout shift.

export type LandingImageName =
  | "vione-overview"
  | "app-home"
  | "app-network"
  | "app-card"
  | "app-identity";

const VARIANTS: Record<LandingImageName, { widths: number[]; w: number; h: number }> = {
  "vione-overview": { widths: [320, 480, 640, 960, 1280], w: 1280, h: 1600 },
  "app-home": { widths: [320, 480, 640, 780], w: 780, h: 1688 },
  "app-network": { widths: [320, 480, 640, 780], w: 780, h: 1688 },
  "app-card": { widths: [320, 480, 640, 780], w: 780, h: 1688 },
  "app-identity": { widths: [320, 480, 640, 780], w: 780, h: 1688 },
};

export function ResponsiveImage({
  name,
  alt,
  sizes,
  className = "",
  priority = false,
  fallbackSrc,
}: {
  name: LandingImageName;
  alt: string;
  /** CSS `sizes` describing the rendered width at each breakpoint. */
  sizes: string;
  className?: string;
  /** Eager-load above-the-fold images (LCP candidate). */
  priority?: boolean;
  /** Original asset URL used when WebP is unsupported. */
  fallbackSrc?: string;
}) {
  const v = VARIANTS[name];
  const srcSet = v.widths.map((w) => `/landing/${name}-${w}.webp ${w}w`).join(", ");
  const largest = `/landing/${name}-${v.widths[v.widths.length - 1]}.webp`;

  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img
        src={fallbackSrc ?? largest}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={v.w}
        height={v.h}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
      />
    </picture>
  );
}
