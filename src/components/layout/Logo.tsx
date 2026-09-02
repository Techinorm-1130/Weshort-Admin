import Image from "next/image";

/* Supplied artwork: the full lockup, plus the W mark alone for tight spots. */
const LOCKUP = { src: "/logo/weshort-logo.png", ratio: 2000 / 213 };
const MARK = { src: "/logo/weshort-mark.png", ratio: 827 / 213 };

/**
 * WeShort logo.
 * `wordmark` shows the full lockup; without it only the W mark is drawn, which
 * is what the collapsed sidebar rail needs.
 */
export default function Logo({
  height = 30, wordmark = true, showCms = true,
}: {
  height?: number;
  wordmark?: boolean;
  /** Small "CMS" tag beside the lockup. */
  showCms?: boolean;
}) {
  const art = wordmark ? LOCKUP : MARK;

  return (
    <span className="flex items-center gap-3">
      <Image
        src={art.src}
        alt="WeShort"
        width={Math.round(height * art.ratio)}
        height={height}
        priority
        style={{ height, width: "auto" }}
      />
      {wordmark && showCms ? (
        <>
          <span className="h-5 w-px bg-border" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">CMS</span>
        </>
      ) : null}
    </span>
  );
}

/**
 * Compact brand badge — white "WS" on the WeShort red tile. Used wherever the
 * lockup is too wide: the rail, the workspace chip and the mobile header.
 */
export function LogoBadge({
  size = 40, radius = 12, className = "",
}: {
  size?: number;
  /** Corner radius in px, so the badge can sit in tiles of different sizes. */
  radius?: number;
  className?: string;
}) {
  return (
    <span
      aria-label="WeShort"
      role="img"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.4 }}
      className={`inline-flex shrink-0 items-center justify-center bg-brand font-display font-bold leading-none tracking-tight text-white ${className}`}
    >
      WS
    </span>
  );
}
