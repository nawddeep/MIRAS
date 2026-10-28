import { useId, type ReactNode } from "react";

// The project's own illustrations: Lake Pichhola with a palace silhouette. No photos, no people.
export type Scene = "dawn" | "golden" | "night";

const v = (scene: Scene, part: string) => `var(--${scene}-${part})`;

/** Palace silhouette on a 400-wide stage, waterline at y=0 (drawn upward). */
function Palace({ fill, shade, glow }: { fill: string; shade: string; glow?: string }) {
  return (
    <g>
      <path
        d="M120 0V-38h12v-10h10v-14l8-10 8 10v14h10v10h30v-22h8v-12a10 10 0 0 1 20 0v12h8v22h28v-10h10v-14l8-10 8 10v14h10v10h12V0Z"
        style={{ fill }}
      />
      <path d="M150 0V-30h120V0Z" style={{ fill: shade }} opacity="0.55" />
      {[160, 180, 200, 220, 240, 260].map((x) => (
        <rect key={x} x={x - 3} y={-24} width="6" height="9" rx="3" style={{ fill: glow ?? shade }} opacity={glow ? 0.9 : 0.6} />
      ))}
    </g>
  );
}

/** Inline-SVG hero scene, used when no real poster exists. Always shown with an Illustrative label by the caller. */
export function HeroScene({ scene, className = "" }: { scene: Scene; className?: string }) {
  const id = useId().replace(/:/g, "");
  const night = scene === "night";
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: v(scene, "sky-1") }} />
          <stop offset="0.55" style={{ stopColor: v(scene, "sky-2") }} />
          <stop offset="1" style={{ stopColor: v(scene, "sky-3") }} />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: v(scene, "sky-3") }} />
          <stop offset="0.35" style={{ stopColor: v(scene, "water") }} />
          <stop offset="1" style={{ stopColor: v(scene, "water") }} />
        </linearGradient>
      </defs>
      <rect width="400" height="170" fill={`url(#${id}-sky)`} />
      {night ? (
        <g style={{ fill: "var(--moon)" }}>
          <circle cx="320" cy="48" r="16" />
          {[
            [40, 30],
            [90, 60],
            [150, 22],
            [230, 40],
            [370, 90],
            [270, 70],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" opacity="0.8" />
          ))}
        </g>
      ) : (
        <circle cx={scene === "golden" ? 300 : 90} cy={scene === "golden" ? 120 : 70} r="22" style={{ fill: "var(--paper-2)" }} opacity="0.55" />
      )}
      <path d="M0 150 C60 120 110 132 170 126 S300 112 400 138 V170 H0Z" style={{ fill: v(scene, "hill") }} opacity="0.75" />
      <g transform="translate(0 170)">
        <Palace fill={v(scene, "palace")} shade={v(scene, "shade")} glow={night ? "var(--night-glow)" : undefined} />
      </g>
      <rect y="170" width="400" height="90" fill={`url(#${id}-water)`} />
      {/* Reflection */}
      <g transform="translate(0 170) scale(1 -0.6)" opacity="0.35">
        <Palace fill={v(scene, "palace")} shade={v(scene, "shade")} glow={night ? "var(--night-glow)" : undefined} />
      </g>
      {[192, 206, 222].map((y, i) => (
        <path key={y} d={`M${30 + i * 40} ${y} q20 -4 40 0 t40 0`} style={{ stroke: "var(--paper-2)" }} strokeWidth="1" fill="none" opacity="0.35" />
      ))}
      {/* Boat */}
      <path d="M60 214h46l-6 7H66Z" style={{ fill: night ? "var(--night-hill)" : "var(--ink)" }} opacity="0.8" />
      <path d="M82 214v-14l8 14" style={{ stroke: night ? "var(--night-hill)" : "var(--ink)" }} strokeWidth="1.5" fill="none" opacity="0.8" />
    </svg>
  );
}

/** Jharokha (cusped arch) mask. Used only for the splash scene and the camera viewfinder. */
export function ArchFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`relative ${className}`}>
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <clipPath id={`${id}-arch`} clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.42 Q0,0.33 0.06,0.3 Q0.06,0.22 0.14,0.2 Q0.16,0.12 0.25,0.11 Q0.3,0.04 0.4,0.05 Q0.45,0 0.5,0 Q0.55,0 0.6,0.05 Q0.7,0.04 0.75,0.11 Q0.84,0.12 0.86,0.2 Q0.94,0.22 0.94,0.3 Q1,0.33 1,0.42 L1,1 Z" />
        </clipPath>
      </svg>
      <div className="h-full w-full" style={{ clipPath: `url(#${id}-arch)` }}>
        {children}
      </div>
    </div>
  );
}

/** Thin wavy line: section divider and loading accent. */
export function RippleDivider({ className = "", loading = false }: { className?: string; loading?: boolean }) {
  return (
    <svg viewBox="0 0 200 8" preserveAspectRatio="none" className={`h-2 w-full ${loading ? "anim-pulse" : ""} ${className}`} aria-hidden="true" focusable="false">
      <path d="M0 4 Q12.5 0 25 4 T50 4 T75 4 T100 4 T125 4 T150 4 T175 4 T200 4" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
