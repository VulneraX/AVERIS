import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button, ErrorNotice, useLocale } from "../ui";
import { act, Provenance, useIntelligence } from "./shared";
export function ReportTriage({ reportId }: { reportId: string }) {
  const { t } = useLocale();
  const r = useIntelligence(`/reports/${reportId}/triage`);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const d = r.data?.triage;
  return (
    <section className="intel-triage">
      <div className="section-head">
        <h3>
          <ShieldCheck size={16} />
          {t("Review assistance", "Bantuan tinjauan")}
        </h3>
        <Provenance>
          {d?.provenance ||
            t("Human review required", "Tinjauan manusia diperlukan")}
        </Provenance>
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
            <strong>
              {t("Suggested next step:", "Saran langkah berikutnya:")}
            </strong>{" "}
            {d.next_action}
          </p>
        </>
      ) : (
        <p>
          {t(
            "No review assistance yet. Check the sender, context, and independent evidence before classifying this report.",
            "Belum ada bantuan tinjauan. Periksa pengirim, konteks, dan bukti independen sebelum mengklasifikasikan laporan ini.",
          )}
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
        <ShieldCheck size={14} />
        {busy
          ? t("Analyzing…", "Menganalisis…")
          : t("Request review assistance", "Minta bantuan tinjauan")}
      </Button>
      <small>
        {r.data?.provider?.enabled
          ? t(
              "AI proposes a classification; your review determines the outcome.",
              "AI mengusulkan klasifikasi; tinjauan Anda menentukan hasil.",
            )
          : t(
              "Review assistance is not configured. Investigate and classify the message below.",
              "Bantuan tinjauan belum dikonfigurasi. Selidiki dan klasifikasikan pesan di bawah.",
            )}{" "}
        {t(
          "Reports never close automatically.",
          "Laporan tidak pernah ditutup otomatis.",
        )}
      </small>
      <ErrorNotice error={error} />
    </section>
  );
}
