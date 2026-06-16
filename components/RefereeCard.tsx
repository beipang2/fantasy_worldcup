interface RefereeCardProps {
  color: "yellow" | "red";
  width?: number;
  height?: number;
}

export default function RefereeCard({ color, width = 20, height = 28 }: RefereeCardProps) {
  const rx = Math.round(Math.min(width, height) * 0.12);
  const isYellow = color === "yellow";

  const baseColor   = isYellow ? "#F59E0B" : "#DC2626";
  const lightEdge   = isYellow ? "#FDE68A" : "#FCA5A5";
  const darkEdge    = isYellow ? "#B45309" : "#991B1B";

  // Unique-enough IDs — only 2 colours in this app, rendered at most a few times per page
  const gradId  = `rc-bg-${color}`;
  const clipId  = `rc-clip-${color}-${width}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Base gradient: lighter top-left → darker bottom-right, like a laminated card */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={lightEdge} />
          <stop offset="50%"  stopColor={baseColor}  />
          <stop offset="100%" stopColor={darkEdge}   />
        </linearGradient>

        {/* Clip to the card shape so the gloss doesn't bleed outside */}
        <clipPath id={clipId}>
          <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx={rx} />
        </clipPath>
      </defs>

      {/* Card body */}
      <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx={rx} fill={`url(#${gradId})`} />

      {/* Gloss: upper-left diagonal sheen, clipped to card shape */}
      <rect
        x="0.5" y="0.5"
        width={width - 1} height={height - 1}
        rx={rx}
        fill="none"
        clipPath={`url(#${clipId})`}
      />
      <polygon
        points={`0.5,0.5 ${width * 0.75},0.5 0.5,${height * 0.6}`}
        fill="rgba(255,255,255,0.22)"
        clipPath={`url(#${clipId})`}
      />
      {/* Lighter inner top-edge strip */}
      <rect
        x="0.5" y="0.5"
        width={width - 1} height={rx * 2}
        rx={rx}
        fill="rgba(255,255,255,0.18)"
        clipPath={`url(#${clipId})`}
      />

      {/* Outer border */}
      <rect
        x="0.5" y="0.5"
        width={width - 1} height={height - 1}
        rx={rx}
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="0.75"
      />

      {/* Inner highlight rim — gives the card a slight 3-D lift */}
      <rect
        x="1.5" y="1.5"
        width={width - 3} height={height - 3}
        rx={Math.max(rx - 1, 1)}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
