import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button, ErrorNotice } from "../ui";
import { act, Provenance, useIntelligence } from "./shared";
export function ReportTriage({ reportId }: { reportId: string }) {
  const r = useIntelligence(`/reports/${reportId}/triage`);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const d = r.data?.triage;
  return (
    <section className="intel-triage">
      <div className="section-head">
        <h3>
          <ShieldCheck size={16} />
          AVERIS Respond
        </h3>
        <Provenance>{d?.provenance || "Human review required"}</Provenance>
      </div>
      {d ? (
        <>
          <p>
            <strong>{d.classification}</strong> · {d.confidence} confidence
          </p>
          <p>{d.summary}</p>
          {d.indicators?.length > 0 && (
            <ul>
              {d.indicators.map((i: string) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          <p>
            <strong>Suggested next step:</strong> {d.next_action}
          </p>
        </>
      ) : (
        <p>
          No triage analysis yet. Review the sender, context, and independent
          evidence before classifying this report.
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={busy || !r.data?.provider?.enabled}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await act(`/reports/${reportId}/triage`, { generate: true });
            r.reload();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Sparkles size={14} />
        {busy ? "Analyzing…" : "Request AI triage"}
      </Button>
      <small>
        {r.data?.provider?.enabled
          ? "AI proposes a classification; your review determines the outcome."
          : "AI is unconfigured. Manual investigation remains available below."}{" "}
        Reports never close automatically.
      </small>
      <ErrorNotice error={error} />
    </section>
  );
}
