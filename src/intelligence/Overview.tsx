import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  CircleHelp,
  Radio,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  ActionLink,
  Empty,
  Loading,
  Metric,
  PageTitle,
  useLocale,
} from "../ui";
import { useAuth } from "../auth";
import {
  display,
  Provenance,
  RecommendationRows,
  ReviewAction,
  RiskNumber,
  RiskStatus,
  useIntelligence,
} from "./shared";

export function IntelligenceOverview() {
  const r = useIntelligence("/overview");
  const [review, setReview] = useState<any>(null);
  const { t } = useLocale();
  const { user } = useAuth();
  const d = r.data;
  const admin = user?.role !== "manager";
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="HUMAN RISK INTELLIGENCE"
        title={t("Overview", "Ringkasan")}
        description={t(
          "Understand what changed. Focus on the next useful action.",
          "Pahami perubahan. Fokus pada tindakan berikutnya.",
        )}
        actions={
          <ActionLink to="/admin/campaigns/new">
            {t("Create campaign", "Buat kampanye")}
          </ActionLink>
        }
      />
      <Loading resource={r}>
        {d && (
          <>
            <div className="intel-mode-strip">
              <span>
                <span className="intel-live-dot" />
                {d.mode} mode
              </span>
              <span>
                Human-controlled ·{" "}
                {d.ai?.enabled ? "Provider configured" : "AI unconfigured"}
              </span>
              {admin && (
                <Link to="/admin/human-risk/autopilot">
                  Review governance
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
            <div className="intel-overview-metrics">
              <div className="intel-primary-metric">
                <RiskNumber score={d.score} trend={d.trend} />
                <div className="intel-primary-foot">
                  <RiskStatus score={d.score} />
                  <Link to="/admin/human-risk">
                    Why this score?
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
              <Metric
                label="Awareness Score"
                value={display(d.awareness)}
                note="Knowledge, behavior, reporting, improvement"
              />
              <Metric
                label="Measured profiles"
                value={`${d.measured} / ${d.total}`}
                note={`${d.coverage}% employee coverage`}
              />
              <Metric
                label="Positive reporting signals"
                value={d.positiveCount}
                note="Verified activity in the last 30 days"
              />
            </div>
            <div className="intel-attention-grid">
              <section className="sheet intel-attention">
                <div className="section-head">
                  <div>
                    <span className="intel-eyebrow">YOUR NEXT DECISION</span>
                    <h2>
                      {t(
                        "What needs attention today?",
                        "Apa yang perlu diperhatikan hari ini?",
                      )}
                    </h2>
                  </div>
                  <Target size={20} />
                </div>
                {d.recommendations.length ? (
                  <RecommendationRows
                    recommendations={d.recommendations.slice(0, 4)}
                    onReview={setReview}
                  />
                ) : (
                  <Empty
                    title={t("Start with evidence", "Mulai dengan bukti")}
                    description={t(
                      "No supported intervention is waiting for review. Establish a baseline, record business context, and connect verified signals.",
                      "Belum ada intervensi berbasis bukti. Ukur kondisi awal, catat konteks bisnis, dan hubungkan sinyal terverifikasi.",
                    )}
                    action={
                      <ActionLink to="/admin/campaigns/new">
                        {t("Create campaign", "Buat kampanye")}
                      </ActionLink>
                    }
                  />
                )}
              </section>
              <section className="intel-brief">
                <header>
                  <span className="intel-brief-icon">
                    <ChartNoAxesCombined size={18} />
                  </span>
                  <div>
                    <h2>Human Risk Brief</h2>
                    <small>Last 30 days · recorded evidence</small>
                  </div>
                </header>
                <Provenance>Evidence summary · rules-based</Provenance>
                {d.brief.length ? (
                  <ol>
                    {d.brief.map((item: any) => (
                      <li key={item.title}>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="intel-brief-empty">
                    <Radio size={27} />
                    <h3>No meaningful changes yet.</h3>
                    <p>
                      Your brief appears when real events support a useful
                      observation.
                    </p>
                  </div>
                )}
                <footer>
                  <ShieldCheck size={13} />
                  No fabricated insights or unexplained scores.
                </footer>
              </section>
            </div>
            <section className="sheet intel-department-map">
              <div className="section-head">
                <div>
                  <h2>Where support is needed</h2>
                  <p>Department risk, with the evidence behind it.</p>
                </div>
                <Link className="intel-link" to="/admin/human-risk">
                  Explore human risk
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="intel-map-columns">
                {d.departments.map((department: any) => (
                  <div key={department.name}>
                    <div>
                      <strong>{department.name}</strong>
                      <span>{department.count} people</span>
                    </div>
                    <div className="intel-map-value">
                      <strong>{display(department.score)}</strong>
                      <span>/ 100</span>
                    </div>
                    <div className="intel-factor-track">
                      <i style={{ width: `${department.score || 0}%` }} />
                    </div>
                    <p>
                      {department.suppressed
                        ? `Needs ${d.minimumSample} measured profiles`
                        : department.driver
                          ? `Primary driver: ${department.driver}`
                          : "No risk driver observed"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="intel-help">
                <CircleHelp size={13} />
                {d.explanation}
              </p>
            </section>
            <div className="intel-loop-strip">
              {[
                "Sense",
                "Understand",
                "Train",
                "Simulate",
                "Coach",
                "Act",
                "Measure",
                "Improve",
              ].map((step, i) => (
                <span key={step}>
                  {i === 0 ? (
                    <Radio size={14} />
                  ) : i === 7 ? (
                    <Check size={14} />
                  ) : null}
                  {step}
                  {i < 7 && <ArrowRight size={12} />}
                </span>
              ))}
            </div>
          </>
        )}
      </Loading>
      {review && (
        <ReviewAction
          recommendation={review}
          onClose={() => setReview(null)}
          onSaved={r.reload}
        />
      )}
    </div>
  );
}
