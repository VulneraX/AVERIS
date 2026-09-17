import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  Info,
  Layers3,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { apiRequest } from "../api";
import { useAuth } from "../auth";
import { Button, ErrorNotice, Field, useData, useLocale } from "../ui";

export const intelligencePath = (path: string) =>
  `/api/workspace/intelligence${path}`;
export const useIntelligence = (path: string) =>
  useData(intelligencePath(path));
export const act = <T = any,>(
  path: string,
  body: unknown = {},
  method = "POST",
) =>
  apiRequest<T>(intelligencePath(path), { method, body: JSON.stringify(body) });
export const display = (value: number | null | undefined, suffix = "") =>
  value === null || value === undefined ? "—" : `${value}${suffix}`;
export function Provenance({
  children = "Evidence rules",
}: {
  children?: ReactNode;
}) {
  return (
    <span className="intel-provenance">
      <Layers3 size={12} />
      {children}
    </span>
  );
}
export function RiskNumber({
  score,
  trend,
  label = "Human Risk Index",
  coverage,
}: {
  score: number | null;
  trend?: number | null;
  label?: string;
  coverage?: number;
}) {
  return (
    <div className="intel-risk-number">
      <span>
        {label}
        <Info size={13} />
      </span>
      <div>
        <strong>{display(score)}</strong>
        <span>/ 100</span>
        {trend !== undefined && trend !== null && (
          <span className={trend <= 0 ? "intel-good" : "intel-warning"}>
            {trend <= 0 ? (
              <ArrowDownRight size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}{" "}
            {Math.abs(trend)} pts
          </span>
        )}
      </div>
      <small>
        {coverage !== undefined
          ? `${coverage}% factor coverage`
          : "Lower means less observed risk."}
      </small>
    </div>
  );
}
export function RiskStatus({ score }: { score: number | null }) {
  return (
    <span
      className={`intel-status ${score === null ? "" : score < 25 ? "positive" : score < 50 ? "neutral" : score < 75 ? "warning" : "critical"}`}
    >
      {score === null
        ? "Unmeasured"
        : score < 25
          ? "Minimal"
          : score < 50
            ? "Moderate"
            : score < 75
              ? "Elevated"
              : "Critical"}
    </span>
  );
}
export function IntelNav({ active }: { active: string }) {
  const { user } = useAuth();
  const canManageSecurity = ["super_admin", "admin"].includes(user?.role || "");
  const views = [
    ["Map", "/admin/human-risk"],
    ...(canManageSecurity
      ? [
          ["Cohorts", "/admin/human-risk/cohorts"],
          ["Threat feed", "/admin/human-risk/threats"],
          ["Autopilot", "/admin/human-risk/autopilot"],
          ["Evidence & audit", "/admin/human-risk/audit"],
        ]
      : []),
  ];
  return (
    <nav className="intel-subnav" aria-label="Human risk views">
      {views.map(([label, url]) => (
        <Link
          key={label}
          to={url}
          aria-current={active === label ? "page" : undefined}
          className={active === label ? "active" : ""}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const active = document.activeElement as HTMLElement;
    const d = ref.current;
    d?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = overflow;
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="intel-panel"
      onCancel={onClose}
      aria-labelledby={id}
    >
      <header>
        <span>
          <Sparkles size={17} />
          AVERIS Intelligence
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close intelligence panel"
        >
          <X size={20} />
        </button>
      </header>
      <div className="intel-panel-body">
        <h2 id={id}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
export function ReviewAction({
  recommendation: r,
  onClose,
  onSaved,
}: {
  recommendation: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState(r.kind || "Coaching");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState<any>(null);
  return (
    <Panel title="Review the next action" onClose={onClose}>
      {done ? (
        <div className="intel-success" role="status">
          <ShieldCheck size={32} />
          <h3>
            {done.status === "Dismissed"
              ? "Recommendation dismissed"
              : done.status === "Monitoring"
                ? "Monitoring recorded"
                : "Action approved"}
          </h3>
          <p>
            {done.programId
              ? "The learning campaign is active. Baseline and follow-up assessments are included."
              : "The decision and its supporting evidence have been recorded."}
          </p>
          {done.programId && (
            <Link
              className="btn primary"
              to={`/admin/campaigns/${done.programId}`}
            >
              Open campaign
              <ArrowRight size={15} />
            </Link>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              onSaved();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <>
          <Provenance>
            {r.provenance || "Recommended · deterministic rules"}
          </Provenance>
          <h3 className="intel-panel-topic">
            {r.topic} · {r.userIds?.length || 0} people
          </h3>
          <dl className="intel-explanation">
            <div>
              <dt>Observation</dt>
              <dd>{r.observation}</dd>
            </div>
            <div>
              <dt>Business context</dt>
              <dd>
                {r.impact ||
                  "Review the audience and source evidence before assigning an intervention."}
              </dd>
            </div>
            <div>
              <dt>Expected outcome</dt>
              <dd>{r.expectedOutcome}</dd>
            </div>
          </dl>
          <div className="intel-panel-evidence">
            <div className="section-head">
              <h3>Supporting evidence</h3>
              <span className="intel-status">
                {r.confidence || "Review required"} confidence
              </span>
            </div>
            {r.evidence?.length ? (
              r.evidence.map((e: any) => (
                <div key={e.id}>
                  <FileText size={15} />
                  <span>
                    <strong>{e.description || e.kind || e.id}</strong>
                    <small>
                      {e.source || "Recorded evidence"}
                      {e.occurredAt
                        ? ` · ${new Date(e.occurredAt).toLocaleDateString()}`
                        : ""}
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <p>
                No automated evidence attached. Review this manually requested
                action.
              </p>
            )}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const result = await act("/decisions", {
                  key: r.key,
                  userIds: r.userIds,
                  kind,
                  topic: r.topic,
                  evidence: (r.evidence || []).map((e: any) => ({
                    id: e.id,
                    kind: e.kind,
                  })),
                  observation: r.observation,
                  expectedOutcome: r.expectedOutcome,
                  acknowledged: true,
                });
                setDone(result);
                onSaved();
              } catch (err) {
                setError(err);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Intervention">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {[
                  "Learning",
                  "Coaching",
                  "Simulation",
                  "Monitor",
                  "Dismiss",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <p className="intel-help">
              {kind === "Learning"
                ? "Assign published learning with a baseline and follow-up."
                : kind === "Simulation"
                  ? "Assign a controlled in-app practice scenario. No external message will be sent."
                  : kind === "Coaching"
                    ? "Assign a short, supportive coaching moment in the employee workspace."
                    : "Record this decision without assigning employee activity."}
            </p>
            <label className="intel-consent">
              <input type="checkbox" required />
              <span>
                I reviewed the evidence, audience, and intended action.
              </span>
            </label>
            <ErrorNotice error={error} />
            <Button disabled={busy || !r.userIds?.length}>
              {busy ? "Saving…" : "Approve action"}
              <Check size={15} />
            </Button>
          </form>
        </>
      )}
    </Panel>
  );
}
export function GlobalCreate() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div
      className="intel-create"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        className="btn primary"
        aria-expanded={open}
        aria-controls="intel-create-menu"
        onClick={() => setOpen(!open)}
      >
        <Plus size={15} />
        {t("Create", "Buat")}
      </button>
      {open && (
        <div
          id="intel-create-menu"
          className="intel-create-menu"
          aria-label="Create a new item"
        >
          {[
            ["Campaign", "/admin/campaigns/new", Target],
            ["Learning", "/admin/studio?kind=content", FileText],
            ["Simulation", "/admin/studio?kind=simulation", ShieldCheck],
            ["Assessment", "/admin/campaigns/new?assessment=1", Check],
            ["Cohort", "/admin/human-risk/cohorts?create=1", Layers3],
            ["Report", "/admin/reports", FileText],
          ].map(([label, to, Icon]) => {
            const Symbol = Icon as typeof Plus;
            return (
              <Link
                key={String(label)}
                to={String(to)}
                onClick={() => setOpen(false)}
              >
                <Symbol size={15} />
                {String(label)}
                <ChevronRight size={13} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
export function RecommendationRows({
  recommendations,
  onReview,
}: {
  recommendations: any[];
  onReview: (r: any) => void;
}) {
  return (
    <div className="intel-recommendations">
      {recommendations.map((r) => (
        <div key={r.key}>
          <span className="intel-recommendation-icon">
            <Target size={17} />
          </span>
          <div>
            <strong>
              {r.topic} · {r.name || r.department}
            </strong>
            <p>{r.observation}</p>
            <small>
              {r.evidence.length} signals · {r.confidence} confidence
            </small>
          </div>
          <button className="intel-link" onClick={() => onReview(r)}>
            Review action
            <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
