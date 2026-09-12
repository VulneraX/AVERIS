import { ArrowRight, Check, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <a
      href="/"
      className={`mk-logo ${small ? "mk-logo-small" : ""}`}
      aria-label="AVERIS home"
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
    </a>
  );
}
export function DemoButton({
  onClick,
  secondary = false,
  children = "Book a Demo",
}: {
  onClick: () => void;
  secondary?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      className={`mk-button ${secondary ? "mk-secondary" : ""}`}
      onClick={onClick}
    >
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mk-section-heading">
      <span className="mk-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  children,
  visual,
  reverse = false,
  muted = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  visual: ReactNode;
  reverse?: boolean;
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={`mk-section ${muted ? "mk-muted-section" : ""}`}
    >
      <div className={`mk-container mk-feature ${reverse ? "mk-reverse" : ""}`}>
        <div className="mk-feature-copy">
          <SectionHeading eyebrow={eyebrow} title={title}>
            {description}
          </SectionHeading>
          {children}
        </div>
        <div className="mk-feature-visual">{visual}</div>
      </div>
    </section>
  );
}
export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mk-checklist">
      {items.map((item) => (
        <li key={item}>
          <Check size={16} />
          {item}
        </li>
      ))}
    </ul>
  );
}
export function PreviewFrame({
  title,
  children,
  label = "Illustrative product preview",
  className = "",
}: {
  title: string;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={`mk-preview ${className}`}>
      <div className="mk-preview-bar">
        <span className="mk-mini-mark">A</span>
        <span>Workspace</span>
        <ChevronRight size={12} />
        <strong>{title}</strong>
        <span className="mk-preview-dot" />
      </div>
      {children}
      <figcaption>{label}</figcaption>
    </figure>
  );
}
export function Trend({
  children = "+7 this quarter",
}: {
  children?: ReactNode;
}) {
  return <span className="mk-trend">↗ {children}</span>;
}
