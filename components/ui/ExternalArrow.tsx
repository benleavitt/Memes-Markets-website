/**
 * Up and to the right: this link leaves the site. The same glyph the press
 * entries in the info panel draw inline, pulled out once the HQ links needed it
 * in three places. Decorative — target="_blank" is announced by the UA.
 */
export function ExternalArrow({ className = "size-3" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`${className} shrink-0`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}
