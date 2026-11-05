interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHTS: Record<'sm' | 'md' | 'lg', number> = {
  sm: 34,
  md: 42,
  lg: 48,
};

/**
 * Inline CanaleTV Live logo — 72-unit viewBox.
 * TV mark: rounded rect (#0f1520 → #07090e gradient) + play triangle +
 * stand. Wordmark: CANALE + TV (emerald) + LIVE pill (gold dot),
 * CANALETVLIVE.ONLINE below.
 */
export default function Logo({ size = 'md' }: LogoProps) {
  const h = HEIGHTS[size];
  const w = Math.round((h * 360) / 72);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 360 72"
      role="img"
      aria-label="CanaleTV Live"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ctvMarkBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1520" />
          <stop offset="100%" stopColor="#07090e" />
        </linearGradient>
        <linearGradient id="ctvPlay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* TV mark */}
      <rect x="2" y="4" width="60" height="40" rx="9" fill="url(#ctvMarkBg)" stroke="#10b981" strokeWidth="2.5" />
      <path d="M24 14 L44 24 L24 34 Z" fill="url(#ctvPlay)" />
      <line x1="16" y1="52" x2="48" y2="52" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="44" x2="32" y2="52" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

      {/* Wordmark */}
      <text x="74" y="30" fontFamily="'Bebas Neue', sans-serif" fontSize="26" letterSpacing="0.04em">
        <tspan fill="#e8ecf1">CANALE</tspan>
        <tspan fill="#34d399">TV</tspan>
      </text>
      {/* LIVE pill */}
      <rect x="228" y="8" width="66" height="22" rx="11" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="242" cy="19" r="4" fill="#f59e0b" />
      <text x="252" y="25" fontFamily="'Space Grotesk', sans-serif" fontWeight={700} fontSize="13" letterSpacing="0.08em" fill="#fde68a">
        LIVE
      </text>
      <text x="74" y="56" fontFamily="'Outfit', sans-serif" fontSize="12" letterSpacing="0.28em" fill="#9aa5b1">
        CANALETVLIVE.ONLINE
      </text>
    </svg>
  );
}
