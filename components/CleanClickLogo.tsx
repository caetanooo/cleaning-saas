import Image from "next/image";
import Link from "next/link";

interface CleanClickLogoProps {
  /** Height of the logo image in px (width scales proportionally) */
  size?: number;
  /** If provided, wraps the logo in a Link to this href */
  href?: string;
  className?: string;
}

export function CleanClickLogo({ size = 36, href, className = "" }: CleanClickLogoProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="CleanClick"
        height={size}
        width={size}
        className="object-contain"
        priority
      />
      <span
        className="font-extrabold text-[#1B6EE8]"
        style={{ fontSize: size * 0.6 }}
      >
        CleanClick
      </span>
    </span>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
