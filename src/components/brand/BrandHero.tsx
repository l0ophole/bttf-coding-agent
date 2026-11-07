import { useId } from 'react';

import { cn } from '@/lib/cn';

/** Decorative synthwave landscape with the "Pi — Think. Plan. Build." lockup. */
export function BrandHero({ className }: { className?: string }) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  const def = (name: string) => `${id}-${name}`;

  const windows = [
    [161, 102],
    [161, 108],
    [171, 94],
    [171, 100],
    [171, 112],
    [180, 86],
    [180, 94],
    [184, 100],
    [180, 108],
    [198, 90],
    [202, 98],
    [198, 106],
    [210, 98],
    [218, 82],
    [222, 90],
    [218, 100],
    [222, 108],
    [229, 96],
    [233, 104],
  ];

  return (
    <div aria-hidden className={cn('relative overflow-hidden', className)}>
      <svg
        viewBox="0 0 240 150"
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id={def('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0526" />
            <stop offset="0.45" stopColor="#25094a" />
            <stop offset="0.75" stopColor="#3d0c62" />
            <stop offset="1" stopColor="#0b0a26" />
          </linearGradient>
          <radialGradient id={def('glow')} cx="0.68" cy="0.62" r="0.5">
            <stop offset="0" stopColor="#ff4fd8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff4fd8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={def('mtnBack')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#1e1352" />
          </linearGradient>
          <linearGradient id={def('mtnFront')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1766" />
            <stop offset="1" stopColor="#0c0a2c" />
          </linearGradient>
          <linearGradient id={def('water')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120e3a" />
            <stop offset="1" stopColor="#04050f" />
          </linearGradient>
          <linearGradient id={def('line')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={def('logo')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e879f9" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id={def('pi')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f0abfc" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <rect width="240" height="150" fill={ref('sky')} />
        <rect width="240" height="150" fill={ref('glow')} />
        {[
          [24, 14],
          [62, 8],
          [118, 18],
          [150, 6],
          [204, 12],
          [226, 30],
          [90, 30],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.7" fill="#f5d0fe" opacity="0.7" />
        ))}
        <ellipse cx="150" cy="34" rx="46" ry="9" fill="#a21caf" opacity="0.35" />
        <ellipse cx="200" cy="26" rx="38" ry="7" fill="#7e22ce" opacity="0.4" />
        <ellipse cx="96" cy="44" rx="30" ry="5" fill="#86198f" opacity="0.3" />

        <polygon
          points="0,112 28,92 52,99 84,64 108,86 128,72 152,94 176,56 202,88 240,74 240,124 0,124"
          fill={ref('mtnBack')}
        />
        <polyline
          points="152,94 176,56 202,88"
          fill="none"
          stroke="#e9d5ff"
          strokeOpacity="0.45"
          strokeWidth="0.8"
        />
        <polygon
          points="0,124 26,106 50,113 80,92 106,109 126,99 150,113 172,101 196,115 240,105 240,130 0,130"
          fill={ref('mtnFront')}
        />
        <polyline
          points="0,124 26,106 50,113 80,92 106,109 126,99 150,113"
          fill="none"
          stroke="#a855f7"
          strokeOpacity="0.5"
          strokeWidth="0.7"
        />

        <g fill="#0a1238">
          <rect x="158" y="98" width="8" height="26" />
          <rect x="168" y="90" width="7" height="34" />
          <rect x="177" y="82" width="10" height="42" />
          <rect x="189" y="72" width="5" height="52" />
          <rect x="196" y="86" width="10" height="38" />
          <rect x="208" y="94" width="7" height="30" />
          <rect x="216" y="78" width="9" height="46" />
          <rect x="227" y="92" width="10" height="32" />
        </g>
        <line x1="191.5" y1="72" x2="191.5" y2="58" stroke="#67e8f9" strokeWidth="0.8" />
        <g fill="#22d3ee">
          {windows.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="1.6" height="1.6" opacity="0.85" />
          ))}
        </g>

        <rect y="124" width="240" height="26" fill={ref('water')} />
        {[
          [126, 0.9, 20, 220],
          [130, 0.6, 40, 200],
          [135, 0.45, 10, 180],
          [141, 0.3, 60, 230],
        ].map(([y, opacity, x1, x2]) => (
          <line
            key={y}
            x1={x1}
            x2={x2}
            y1={y}
            y2={y}
            stroke={ref('line')}
            strokeOpacity={opacity}
            strokeWidth="0.8"
          />
        ))}

        <path
          d="M37 44 58 92 37 81.5 16 92Zm0 15-9.6 21 9.6-4.8 9.6 4.8Z"
          fill={ref('logo')}
          fillRule="evenodd"
          style={{ filter: 'drop-shadow(0 0 6px rgb(217 70 239 / 0.6))' }}
        />
        <text
          x="70"
          y="82"
          fill={ref('pi')}
          fontSize="26"
          fontWeight="700"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Pi
        </text>
        <text
          x="70"
          y="99"
          fill="#ede9fe"
          fontSize="10.5"
          letterSpacing="0.2"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Think. Plan. Build.
        </text>
      </svg>
    </div>
  );
}
