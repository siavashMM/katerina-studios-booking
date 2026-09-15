import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const defaults = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}
export function CloseIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
export function MenuIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}
export function PinIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
export function PlusIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function CalendarIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="4" y="5" width="16" height="16" rx="1" />
      <path d="M8 3v4m8-4v4M4 10h16" />
    </svg>
  );
}
export function LeafIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 21 17 5M10 14C3 15 2 9 3 5c6 0 10 3 7 9ZM14 10c0-6 4-8 8-8 0 5-2 9-8 8ZM7 19c5 2 10-1 11-5-5-2-9 0-11 5Z" />
    </svg>
  );
}
export function SeaIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M2 15c2-3 4 3 7 0s5 3 8 0 4 0 5 0M2 20c2-3 4 3 7 0s5 3 8 0 4 0 5 0M5 9h14M12 3v2m-6-1 1 2m11-2-1 2" />
    </svg>
  );
}
export function StarIcon(props: IconProps) {
  return (
    <svg {...defaults} viewBox="0 0 20 20" {...props}>
      <path d="m10 2 2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2Z" />
    </svg>
  );
}
