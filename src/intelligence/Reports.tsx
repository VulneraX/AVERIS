import { useAuth } from "../auth";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileCheck2, Info, ShieldCheck } from "lucide-react";
import {
  Button,
  Empty,
  ErrorNotice,
  Loading,
  Metric,
  PageTitle,
  Tabs,
} from "../ui";
import { downloadFromApi } from "../api";
import { Reports as ProgramReports } from "../WorkspacePages";
import { display, intelligencePath, useIntelligence } from "./shared";

export function OutcomeReports() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(
    params.has("campaignId") ? "program" : "outcomes",
  );
  const r = useIntelligence("/outcomes");
  const overview = useIntelligence("/overview");
  const [error, setError] = useState<unknown>(null);
  const d = r.data;
  const download = async (format: string) => {
    try {
      await downloadFromApi(intelligencePath(`/exports/${format}`));
    } catch (e) {
      setError(e);
    }
  };
  return (
    <div className="intel-page">
      {tab === "outcomes" && (
        <PageTitle
          eyebrow="MEASURE WHAT CHANGED"
          title="Reports"
          description="Risk, reporting, and intervention effectiveness. Participation remains a separate measure."
          actions={
            user?.role !== "manager" && (
              <>
                <Button variant="secondary" onClick={() => download("csv")}>
                  <Download size={14} />
                  Employee CSV
                </Button>
                <Button onClick={() => download("pdf")}>
                  <FileCheck2 size={15} />
                  Executive PDF
                </Button>
              </>
            )
          }
        />
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["outcomes", "Behavior outcomes"],
          ["program", "Program & compliance evidence"],
        ]}
      />
      {tab === "program" ? (
        <ProgramReports />
      ) : (
        <>
          <ErrorNotice error={error} />
          <Loading resource={r}>
            {d && (
              <>
                <div className="intel-overview-metrics">
                  <Metric
                    label="Human Risk Index"
                    value={display(overview.data?.score)}
                    note="Lower means less observed risk"
                  />
                  <Metric
                    label="Detection rate"
                    value={display(d.metrics.detectionRate, "%")}
                    note="Reported without clicking / practice opportunities"
                  />
                  <Metric
                    label="Reporting rate"
                    value={display(d.metrics.reportingRate, "%")}
                    note="Reports / practice opportunities"
                  />
                  <Metric
                    label="Median time to report"
                    value={display(d.metrics.medianReportMinutes, " min")}
                    note="First report after delivery or scenario opening"
                  />
                </div>
                <div className="intel-privacy-note">
                  <Info size={17} />
                  <span>
                    {d.metrics.practiceOpportunities} measured practice
                    opportunities in 30 days. Rates require at least{" "}
                    {d.minimumSample} distinct employees. In-app opportunities
                    count when opened; email opportunities count when sent.
                  </span>
                </div>
                <section className="sheet">
                  <div className="section-head">
                    <div>
                      <h2>Intervention effectiveness</h2>
                      <p>
                        Compare the same people and competency before and after
                        an intervention.
                      </p>
                    </div>
                    <span className="intel-status">
                      14-day comparison windows
                    </span>
                  </div>
                  {d.outcomes.length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Intervention</th>
                            <th>People</th>
                            <th>Before click rate</th>
                            <th>After click rate</th>
                            <th>Change</th>
                            <th>Interpretation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.outcomes.map((o: any) => (
                            <tr key={o.id}>
                              <td>
                                <strong>{o.topic}</strong>
                                <small>
                                  {o.kind} ·{" "}
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </small>
                              </td>
                              <td>{o.users}</td>
                              <td>
                                {display(o.before.clickRate, "%")}
                                <small>{o.before.count} opportunities</small>
                              </td>
                              <td>
                                {display(o.after.clickRate, "%")}
                                <small>{o.after.count} opportunities</small>
                              </td>
                              <td>
                                <span
                                  className={
                                    o.delta !== null && o.delta < 0
                                      ? "intel-good"
                                      : ""
                                  }
                                >
                                  {o.delta === null
                                    ? "—"
                                    : `${o.delta > 0 ? "+" : ""}${o.delta} pp`}
                                </span>
                              </td>
                              <td>
                                <span className="intel-status">{o.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="Measure an intervention from start to finish"
                      description="Approved interventions appear here with before-and-after evidence. Missing measurements stay unmeasured."
                    />
                  )}
                  <p className="intel-help">
                    Observational comparisons do not establish causation. An
                    effectiveness label requires completed windows and adequate
                    samples; small or incomplete samples remain “Collecting
                    evidence.”
                  </p>
                </section>
                <section className="sheet section">
                  <h2>Keep each metric clear</h2>
                  <div className="intel-report-definitions">
                    {Object.entries(d.definitions).map(([key, value]) => (
                      <div key={key}>
                        <h3>{key.replace(/([A-Z])/g, " $1")}</h3>
                        <p>{String(value)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="intel-help">
                    <ShieldCheck size={14} />
                    Awareness, Human Risk Index, assignment completion, and quiz
                    pass rate are separate measures.
                  </p>
                </section>
              </>
            )}
          </Loading>
        </>
      )}
    </div>
  );
}
