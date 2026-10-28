/** Hand-drawn scene: two people watching sunset over the hills and a crater lake of Western Uganda. */
export default function HeroArt() {
  return (
    <svg viewBox="0 0 560 460" className="h-auto w-full" role="img"
      aria-label="Illustration of a couple holding hands at sunset above the green hills and crater lakes of Western Uganda">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b0764" />
          <stop offset="0.55" stopColor="#9d3c8a" />
          <stop offset="1" stopColor="#f5b45a" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.6" stopColor="#f5c84c" />
          <stop offset="1" stopColor="#f5c84c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7d77a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7e22ce" stopOpacity="0.8" />
        </linearGradient>
        <clipPath id="frame"><rect width="560" height="460" rx="36" /></clipPath>
      </defs>
      <g clipPath="url(#frame)">
        <rect width="560" height="460" fill="url(#sky)" />
        {/* stars */}
        {[[60, 50], [130, 90], [420, 40], [500, 110], [300, 30], [220, 60], [470, 70]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.2} fill="#fef3c7" opacity="0.8" />
        ))}
        <circle cx="300" cy="250" r="120" fill="url(#sun)" />
        <circle cx="300" cy="250" r="54" fill="#fde68a" />
        {/* far hills */}
        <path d="M0 270 C70 220 140 230 200 260 C260 225 330 215 400 255 C450 230 510 225 560 250 V460 H0Z" fill="#6b21a8" opacity="0.75" />
        {/* crater lake */}
        <ellipse cx="190" cy="318" rx="120" ry="20" fill="url(#lake)" />
        {/* mid hills with terraces */}
        <path d="M0 315 C80 280 160 300 230 330 C300 290 400 280 560 320 V460 H0Z" fill="#3f7d3a" />
        <path d="M20 340 C90 318 160 330 220 350 M300 330 C370 312 450 312 540 336" stroke="#5c9e4f" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M0 360 C120 330 220 345 300 370 C380 350 470 345 560 365 V460 H0Z" fill="#2c5e2e" />
        {/* banana plants */}
        {[[60, 360], [500, 362], [470, 372]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect x="-2" y="-34" width="4" height="34" fill="#1f3f20" />
            <path d="M0 -34 C-18 -46 -30 -40 -36 -30 C-20 -34 -10 -32 0 -30Z M0 -34 C18 -48 32 -42 38 -30 C22 -34 10 -32 0 -30Z M0 -34 C-4 -54 6 -60 12 -58 C8 -50 4 -42 0 -32Z" fill="#245a26" />
          </g>
        ))}
        {/* foreground ridge */}
        <path d="M0 400 C140 376 260 380 330 392 C420 380 500 384 560 396 V460 H0Z" fill="#1c3d1e" />
        {/* couple */}
        <g transform="translate(330 392)" fill="#24043f">
          <circle cx="-22" cy="-98" r="11" />
          <path d="M-36 -84 C-36 -88 -8 -88 -8 -84 L-4 -40 L-12 0 H-18 L-22 -36 L-26 0 H-32 L-40 -40Z" />
          <path d="M-8 -78 L8 -60" stroke="#24043f" strokeWidth="6" strokeLinecap="round" />
          <circle cx="22" cy="-94" r="10" />
          <path d="M14 -100 C10 -108 20 -116 30 -110 C36 -104 34 -96 30 -92" />
          <path d="M8 -82 C8 -86 34 -86 34 -82 L44 -26 H2Z" />
          <path d="M12 -26 L14 0 H20 L22 -26 M26 -26 L30 0 H36 L34 -26" />
        </g>
        {/* heart */}
        <path d="M330 268 C322 258 306 258 306 272 C306 284 330 296 330 296 C330 296 354 284 354 272 C354 258 338 258 330 268Z" fill="#f43f75" opacity="0.9" />
      </g>
    </svg>
  );
}
