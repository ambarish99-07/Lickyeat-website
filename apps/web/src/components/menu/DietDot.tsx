/**
 * The FSSAI-style diet mark — a green square + dot for veg, a red square + triangle
 * for non-veg. Fixed colours in both themes, exactly like the printed symbol.
 * Used per menu item and as a whole-menu badge (green when everything's veg, red
 * the moment anything isn't).
 */
export function DietDot({
  nonVeg,
  size = 14,
  className,
  title,
}: {
  nonVeg: boolean;
  size?: number;
  className?: string;
  title?: string;
}) {
  const color = nonVeg ? "#B3261E" : "#2E7D32";
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? (nonVeg ? "Non-vegetarian" : "Vegetarian")}
    >
      <rect x="1" y="1" width="18" height="18" rx="3" fill="none" stroke={color} strokeWidth="2" />
      {nonVeg ? (
        <path d="M10 5.5 L14.5 14 L5.5 14 Z" fill={color} />
      ) : (
        <circle cx="10" cy="10" r="4.2" fill={color} />
      )}
    </svg>
  );
}
