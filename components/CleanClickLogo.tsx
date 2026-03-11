import Image from "next/image";
import Link from "next/link";

interface CleanClickLogoProps {
  /** Height of the logo image in px */
  height?: number;
  /** If provided, wraps the logo in a Link to this href */
  href?: string;
  className?: string;
}

export function CleanClickLogo({ height = 48, href, className = "" }: CleanClickLogoProps) {
  const inner = (
    <Image
      src="/logo.png"
      alt="CleanClick"
      height={height}
      width={height * 4}
      className={`object-contain object-left ${className}`}
      priority
    />
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
