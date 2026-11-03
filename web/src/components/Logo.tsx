/**
 * Lisha Handmade wordmark: spaced serif "LISHA" over a script "handmade".
 * Colours come from the active theme (ink + accent-strong); `size` scales the whole mark.
 */
export default function Logo({ size = 1, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      dir="ltr"
      role="img"
      aria-label="Lisha Handmade"
      className={`inline-flex select-none flex-col items-center leading-none ${className}`}
      style={{ fontSize: `${size}rem` }}
    >
      <span
        aria-hidden="true"
        className="font-bold text-ink"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.45em',
          letterSpacing: '0.32em',
          marginRight: '-0.32em', // letter-spacing also follows the last letter; keep the word centred
        }}
      >
        LISHA
      </span>
      <span
        aria-hidden="true"
        className="text-accent-strong"
        style={{ fontFamily: "'Parisienne', cursive", fontSize: '1.15em', marginTop: '-0.28em' }}
      >
        handmade
      </span>
    </span>
  );
}
