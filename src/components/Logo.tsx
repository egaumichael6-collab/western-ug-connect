export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5c84c" />
          <stop offset="1" stopColor="#c8932a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#3b0764" />
      {/* two hills of the west meeting under a heart */}
      <path d="M6 46 C16 34 24 34 32 42 C40 34 48 34 58 46 Z" fill="#6b21a8" />
      <path d="M32 40 C24 32 14 26 20 18 C24 13 30 15 32 20 C34 15 40 13 44 18 C50 26 40 32 32 40 Z" fill="url(#lm-g)" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#lm-g)" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={38} />
      <span className="leading-none">
        <span className={`block font-display text-[1.05rem] font-bold tracking-wide ${light ? "text-white" : "text-plum-900"}`}>
          WESTERN UG
        </span>
        <span className="block text-[0.68rem] font-semibold tracking-[0.32em] text-gold-600">CONNECT</span>
      </span>
    </span>
  );
}
