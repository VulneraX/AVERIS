import { Link } from "react-router-dom";
import { Brand, PageTitle } from "../ui";
export function RiskMethodology() {
  return (
    <div className="public-wrap intel-page">
      <Brand />
      <PageTitle
        eyebrow="AVERIS · MODEL POLICY V2.0.0"
        title="Human Risk Index methodology"
        description="An explainable way to prioritize security support. Separate from Awareness Score."
      />
      <section className="sheet">
        <h2>Three measured factors</h2>
        <p className="section">
          <strong>
            Human Risk Index = round(threat × vulnerability × impact ÷ 10,000).
          </strong>{" "}
          Each factor is bounded to 0–100. Lower means less observed risk.
          Missing factors remain unmeasured; they are never filled with zero.
        </p>
        <p className="section">
          This is a deterministic prioritization model. It is not a calibrated
          probability of an incident or an employee-performance measure. Its
          coefficients are explicit product policies that organizations should
          review.
        </p>
        <div className="table-scroll section">
          <table>
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Reviewed business context",
                  "Impact: 25, 50, 75, or 100, with administrator rationale.",
                ],
                [
                  "Verified exposure",
                  "Threat: source measurement, or +20 per targeting event (starting from zero).",
                ],
                [
                  "Graded knowledge",
                  "Vulnerability: 100 − latest assessment score.",
                ],
                [
                  "Risky decisions",
                  "Vulnerability: +12 for a simulation interaction; +10 for unsafe sharing; +8 for identity risk.",
                ],
                [
                  "Safer decisions",
                  "Vulnerability: −8 for a reported simulation; −6 for a security-confirmed report; −5 for verified requests or identity protection.",
                ],
                [
                  "Learning or coaching completion",
                  "Participation evidence. No direct reduction in risk.",
                ],
              ].map(([event, effect]) => (
                <tr key={event}>
                  <td>
                    <strong>{event}</strong>
                  </td>
                  <td>{effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="section">
          When behavior is observed before an assessment, vulnerability changes
          start from a neutral policy baseline of 50. A later graded assessment
          resets that anchor. Subsequent observed decisions adjust it. The
          ledger records the source, order, and before-and-after contribution.
        </p>
      </section>
      <section className="sheet section">
        <h2>Time, coverage, and confidence</h2>
        <p className="section">
          Verified, non-invalidated events are replayed in time order over a
          90-day window. The latest effective business-impact context is
          retained. Historical comparisons replay evidence at the relevant point
          in time. Expired events can change the current index.
        </p>
        <p className="section">
          Coverage is the proportion of three factors with evidence. Confidence
          is Low when factors are missing, Medium with all factors measured, and
          High with at least five factor-contributing observations. Confidence
          is qualitative, not a probability.
        </p>
        <p className="section">
          Risk bands are Minimal (0–24), Moderate (25–49), Elevated (50–74), and
          Critical (75–100). These are support-prioritization labels. Employee
          views show personal skills and positive progress instead.
        </p>
      </section>
      <section className="sheet section">
        <h2>Interpret changes carefully</h2>
        <p className="section">
          Organization and group risk are means of measured active profiles,
          subject to a minimum sample (five by default). Before/after
          intervention reports compare the same audience and topic across 14-day
          windows. Small samples and incomplete windows do not receive an
          improvement label. Observed changes do not establish causation.
        </p>
        <p className="section">
          Awareness Score uses knowledge, behavior, reporting, and improvement.
          A higher Awareness Score means stronger measured awareness; a lower
          Human Risk Index means less observed risk. The two scores answer
          different questions.
        </p>
        <Link className="intel-link section" to="/methodology">
          Read the Awareness Score methodology →
        </Link>
      </section>
      <Link className="intel-link section" to="/">
        ← Back to AVERIS
      </Link>
    </div>
  );
}
