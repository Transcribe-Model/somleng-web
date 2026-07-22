import Image from "next/image";
import Link from "next/link";

const SIZES = {
  sm: { height: 36, className: "h-9 w-auto" },
  md: { height: 120, className: "h-28 w-auto sm:h-32" },
  lg: { height: 280, className: "h-56 w-auto sm:h-64 md:h-72" },
} as const;

interface BrandLogoProps {
  size?: keyof typeof SIZES;
  href?: string | null;
  className?: string;
  onDark?: boolean;
}

export function BrandLogo({
  size = "md",
  href = "/",
  className = "",
  onDark = false,
}: BrandLogoProps) {
  const { height, className: sizeClass } = SIZES[size];

  const wrapperClass = [
    "inline-flex shrink-0 rounded-xl bg-white p-4 shadow-lg",
    onDark ? "shadow-black/25" : "shadow-navy/10 ring-1 ring-border",
  ].join(" ");

  const image = (
    <Image
      src="/logo.png"
      alt="សម្លេងខ្មែរ"
      width={Math.round(height * 1.6)}
      height={height}
      priority={size === "lg"}
      className={[sizeClass, className].filter(Boolean).join(" ")}
    />
  );

  if (href === null) {
    return <div className={wrapperClass}>{image}</div>;
  }

  return (
    <Link
      href={href}
      className={[wrapperClass, "transition opacity-90 hover:opacity-100"].join(" ")}
    >
      {image}
    </Link>
  );
}
