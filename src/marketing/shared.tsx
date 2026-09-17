import { Link } from "react-router-dom";

export function Logo({
  small = false,
  label = "AVERIS home",
}: {
  small?: boolean;
  label?: string;
}) {
  return (
    <Link
      to="/"
      className={`mk-logo ${small ? "mk-logo-small" : ""}`}
      aria-label={label}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M5 26 16 5l7 14M9 20h12M23 23h5M21 27h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
        />
      </svg>
      <span>AVERIS</span>
    </Link>
  );
}
