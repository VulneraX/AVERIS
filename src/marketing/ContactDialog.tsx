import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { Logo } from "./shared";

export type DialogKind =
  | "demo"
  | "contact"
  | "pricing"
  | "privacy"
  | "terms"
  | "documentation"
  | "report";
export function ContactDialog({
  kind,
  onClose,
}: {
  kind: DialogKind;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const isForm = ["demo", "contact", "pricing"].includes(kind);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const title = {
    demo: "See AVERIS in action.",
    contact: "Let’s talk about your program.",
    pricing: "A plan for your organization.",
    privacy: "Website privacy",
    terms: "Website terms",
    documentation: "Understand the platform.",
    report: "Read the results clearly.",
  }[kind];
  return (
    <dialog
      ref={ref}
      className="mk-dialog"
      aria-labelledby="mk-dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mk-dialog-content">
        <button
          className="mk-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        <Logo small />
        <h2 id="mk-dialog-title">{title}</h2>
        {isForm ? (
          reference ? (
            <div className="mk-form-success" role="status">
              <CheckCircle2 size={34} />
              <h3>Your request has been saved.</h3>
              <p>
                Thank you for sharing your details. Your reference is{" "}
                <strong>{reference}</strong>.
              </p>
              <p>
                This confirms receipt of your request; a meeting has not yet
                been scheduled.
              </p>
              <button className="mk-button" onClick={onClose}>
                Back to AVERIS
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <p>
                {kind === "pricing"
                  ? "Share your team size and program needs to request pricing. No published pricing tiers are currently available."
                  : kind === "contact"
                    ? "Tell us what you’re looking to measure or improve."
                    : "Explore Awareness Score, targeted campaigns, and reporting around your team’s needs."}
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  const data = new FormData(e.currentTarget);
                  try {
                    const response = await fetch("/api/public/inquiries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        kind,
                        name: data.get("name"),
                        email: data.get("email"),
                        company: data.get("company"),
                        size: data.get("size"),
                        message: data.get("message"),
                        consent: data.get("consent") === "on",
                        website: data.get("website"),
                      }),
                    });
                    const result = await response.json().catch(() => null);
                    if (!response.ok || typeof result?.reference !== "string")
                      throw new Error(
                        result?.error?.message ||
                          "Your request could not be saved. Please try again.",
                      );
                    setReference(result.reference);
                  } catch (err) {
                    setError(
                      err instanceof Error && !(err instanceof TypeError)
                        ? err.message
                        : "Connection failed. Please try again.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="mk-form-grid">
                  <label>
                    Your name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Work email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>
                </div>
                <div className="mk-form-grid">
                  <label>
                    Organization
                    <input
                      name="company"
                      autoComplete="organization"
                      required
                      minLength={2}
                      maxLength={160}
                    />
                  </label>
                  <label>
                    Team size
                    <select name="size" required defaultValue="">
                      <option value="" disabled>
                        Select team size
                      </option>
                      {[
                        "1–50",
                        "51–200",
                        "201–1,000",
                        "1,001–5,000",
                        "5,001+",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  What would you like to improve? <span>(optional)</span>
                  <textarea
                    name="message"
                    rows={3}
                    maxLength={2000}
                    placeholder="Tell us a little about your awareness program."
                  />
                </label>
                <label className="mk-honeypot" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                <label className="mk-consent">
                  <input name="consent" type="checkbox" required />
                  <span>
                    I agree to share these details so AVERIS can respond to this
                    request. Requests are stored for up to 90 days.
                  </span>
                </label>
                {error && (
                  <p className="mk-form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="mk-button" type="submit" disabled={busy}>
                  {busy
                    ? "Saving request…"
                    : kind === "pricing"
                      ? "Request pricing"
                      : kind === "contact"
                        ? "Send inquiry"
                        : "Request Demo"}
                  <ArrowRight size={16} />
                </button>
                <small>
                  No credit card required. Please don’t include passwords or
                  sensitive employee information.
                </small>
              </form>
            </>
          )
        ) : (
          <div className="mk-document-copy">
            {kind === "privacy" && (
              <>
                <p>
                  This notice covers the AVERIS marketing page and its inquiry
                  form.
                </p>
                <h3>Information you choose to share</h3>
                <p>
                  The form collects your name, work email, organization, team
                  size, and optional message. These details are stored to
                  process your inquiry, together with your request type,
                  consent, and submission time.
                </p>
                <h3>Retention and browser data</h3>
                <p>
                  Inquiry records are retained for up to 90 days. This marketing
                  page does not use advertising trackers or analytics cookies.
                  The separate application uses session cookies for
                  authentication.
                </p>
                <h3>Questions and requests</h3>
                <p>
                  Use Contact Us and include your inquiry reference to request
                  access or deletion. Do not include sensitive employee
                  information. Platform data processing and retention must be
                  agreed separately with your organization.
                </p>
              </>
            )}
            {kind === "terms" && (
              <>
                <p>
                  This public website introduces AVERIS. Product previews use
                  illustrative data and do not represent customer results or a
                  guarantee of risk reduction.
                </p>
                <h3>Product access</h3>
                <p>
                  Submitting an inquiry does not create an account, schedule a
                  meeting, or enter you into a subscription. Platform access,
                  pricing, and service terms are agreed separately with your
                  organization.
                </p>
                <h3>Availability</h3>
                <p>
                  Integration status is shown explicitly. Planned integrations
                  are not available and have no committed delivery date.
                  Awareness Scores guide awareness programs; they are not
                  employee performance ratings.
                </p>
              </>
            )}
            {kind === "documentation" && (
              <>
                <p>
                  AVERIS connects assessments, learning, controlled phishing
                  simulations, and reviewed employee reports.
                </p>
                <h3>Start with evidence</h3>
                <p>
                  Run a baseline assessment. Assign focused learning. Compare
                  follow-up results and behavior to understand improvement.
                </p>
                <h3>Keep measurements distinct</h3>
                <p>
                  Missing evidence is shown as unmeasured. Completion, pass
                  rate, and Awareness Score describe different aspects of your
                  program.
                </p>
                <a className="mk-text-link" href="/methodology">
                  Read the Awareness Score methodology
                  <ArrowRight size={15} />
                </a>
                <h3>Using your workspace</h3>
                <p>
                  Your organization provides your account and assigns your role.
                  Sign in to access campaigns, learning, reporting, and
                  configuration appropriate to your role.
                </p>
                <a className="mk-text-link" href="/login">
                  Sign in to your workspace
                  <ArrowRight size={15} />
                </a>
              </>
            )}
            {kind === "report" && (
              <>
                <p>
                  The preview uses example data to show the structure of an
                  executive report.
                </p>
                <dl className="mk-report-definitions">
                  {[
                    [
                      "Participation",
                      "Employees who started an activity, out of assigned employees.",
                    ],
                    [
                      "Completion",
                      "Completed assignments, out of all assignments.",
                    ],
                    [
                      "Pass rate",
                      "Passed quiz attempts, out of graded quiz attempts.",
                    ],
                    [
                      "Reporting rate",
                      "Recipients who reported, out of delivered simulation messages.",
                    ],
                    [
                      "Phishing click rate",
                      "Recipients who clicked, out of delivered simulation messages.",
                    ],
                    [
                      "Awareness Score",
                      "Mean score of measured active employees. Coverage is shown separately.",
                    ],
                  ].map(([name, detail]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{detail}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  Executive PDF, employee CSV, and supporting evidence exports
                  are available inside the authenticated reporting workspace.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
