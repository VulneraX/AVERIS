import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  FileText,
  Info,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "../auth";
import {
  Button,
  Dialog,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
  Tabs,
} from "../ui";
import {
  act,
  display,
  IntelNav,
  Provenance,
  RecommendationRows,
  ReviewAction,
  RiskNumber,
  RiskStatus,
  useIntelligence,
} from "./shared";

export function HumanRisk() {
  const { user } = useAuth();
  const allowed = user?.role !== "manager";
  const r = useIntelligence(allowed ? "/profiles" : "/overview");
  const settings = useIntelligence(allowed ? "/settings" : "/overview");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("department");
  const [signal, setSignal] = useState(false);
  const profiles = r.data?.profiles || [];
  const filtered = profiles.filter((p: any) =>
    `${p.name} ${p.department} ${p.plan.topic}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const minimum = settings.data?.settings?.minimum_sample || 5;
  const groups = [
    ...new Set(
      profiles.map((p: any) =>
        group === "role"
          ? p.context?.business_role || "Role not recorded"
          : group === "location"
            ? p.context?.location || "Location not recorded"
            : group === "topic"
              ? p.drivers[0]?.topic || "No observed driver"
              : p.department || "Unassigned",
      ),
    ),
  ] as string[];
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="AVERIS INTELLIGENCE"
        title="Human Risk"
        description="Know who needs support, what changed, and why."
        actions={
          allowed ? (
            <Button onClick={() => setSignal(true)}>
              <Plus size={15} />
              Record a signal
            </Button>
          ) : undefined
        }
      />
      <IntelNav active="Map" />
      <Loading resource={r}>
        {!allowed ? (
          <Empty
            title="Individual risk profiles are restricted"
            description="Managers can review privacy-protected organization trends in Overview and Reports."
          />
        ) : (
          <>
            <div className="intel-privacy-note">
              <ShieldCheck size={17} />
              <span>
                Risk is a guide to security support. Individual risk labels are
                visible only to authorized security administrators.
              </span>
            </div>
            <div className="section-head">
              <h2>Organization risk map</h2>
              <label className="intel-inline-select">
                Group by
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  <option value="department">Department</option>
                  <option value="role">Business role</option>
                  <option value="location">Location</option>
                  <option value="topic">Attack vector</option>
                </select>
              </label>
            </div>
            <div className="intel-risk-map">
              {groups.map((name) => {
                const members = profiles.filter(
                  (p: any) =>
                    (group === "role"
                      ? p.context?.business_role || "Role not recorded"
                      : group === "location"
                        ? p.context?.location || "Location not recorded"
                        : group === "topic"
                          ? p.drivers[0]?.topic || "No observed driver"
                          : p.department || "Unassigned") === name,
                );
                const measured = members.filter((p: any) => p.score !== null);
                const score =
                  measured.length >= minimum
                    ? Math.round(
                        measured.reduce((n: number, p: any) => n + p.score, 0) /
                          measured.length,
                      )
                    : null;
                return (
                  <article key={name}>
                    <div>
                      <Users size={17} />
                      <span>{members.length} people</span>
                    </div>
                    <h3>{name}</h3>
                    <strong>
                      {display(score)}
                      <small> / 100</small>
                    </strong>
                    <div className="intel-factor-track">
                      <i style={{ width: `${score || 0}%` }} />
                    </div>
                    <p>
                      {measured.length < minimum
                        ? `Not enough measured profiles (minimum ${minimum}).`
                        : "Mean risk among measured active profiles."}
                    </p>
                  </article>
                );
              })}
            </div>
            <section className="sheet">
              <div className="section-head">
                <h2>People & evidence</h2>
                <label className="intel-search">
                  <Search size={15} />
                  <input
                    aria-label="Search risk profiles"
                    placeholder="Search people, teams, topics"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-scroll">
                <table className="intel-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Human risk</th>
                      <th>Awareness</th>
                      <th>Factor coverage</th>
                      <th>Primary driver</th>
                      <th>
                        <span className="intel-sr-only">View profile</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/admin/human-risk/people/${p.id}`}>
                            <strong>{p.name}</strong>
                            <small>{p.department || "Unassigned"}</small>
                          </Link>
                        </td>
                        <td>
                          <div className="intel-cell-score">
                            <strong>{display(p.score)}</strong>
                            <RiskStatus score={p.score} />
                          </div>
                        </td>
                        <td>{display(p.awareness.score)}</td>
                        <td>
                          {p.coverage}%<small>{p.confidence} confidence</small>
                        </td>
                        <td>{p.drivers[0]?.topic || "No observed driver"}</td>
                        <td>
                          <Link
                            className="intel-link"
                            to={`/admin/human-risk/people/${p.id}`}
                          >
                            Investigate
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtered.length && (
                <Empty
                  title="No matching profiles"
                  description="Try a different search or add employees in People."
                />
              )}
            </section>
          </>
        )}
      </Loading>
      {signal && (
        <SignalForm
          profiles={profiles}
          topics={r.data?.topics || []}
          onClose={() => setSignal(false)}
          onSaved={r.reload}
        />
      )}
    </div>
  );
}
function SignalForm({
  profiles,
  topics,
  onClose,
  onSaved,
}: {
  profiles: any[];
  topics: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("threat_targeted");
  return (
    <Dialog title="Record a verified security signal" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError(null);
          try {
            await act("/signals", {
              userId: f.get("user"),
              kind,
              topic: f.get("topic"),
              value:
                kind === "exposure_observed" ? Number(f.get("value")) : null,
              sourceId: f.get("source"),
              description: f.get("description"),
              occurredAt: new Date(String(f.get("date"))).toISOString(),
            });
            onSaved();
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p>
          Record a verified event with its source reference. A general threat
          bulletin does not prove that an employee was targeted.
        </p>
        <Field label="Employee">
          <select name="user" required>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="intel-form-grid">
          <Field label="Signal type">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {[
                ["threat_targeted", "Verified threat targeting"],
                ["exposure_observed", "Measured threat exposure"],
                ["identity_risk", "Identity risk observed"],
                ["identity_verified", "Identity verification"],
                ["unsafe_sharing", "Unsafe sharing observed"],
                ["verified_request", "Request independently verified"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Competency">
            <select name="topic">
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        {kind === "exposure_observed" && (
          <Field label="Measured exposure (0–100)">
            <input name="value" type="number" min={0} max={100} required />
          </Field>
        )}
        <Field label="Source reference">
          <input
            name="source"
            required
            maxLength={200}
            placeholder="Incident or source event ID"
          />
        </Field>
        <Field label="Observed at">
          <input
            name="date"
            type="datetime-local"
            required
            max={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
          />
        </Field>
        <Field label="Evidence and relevance">
          <textarea
            name="description"
            required
            minLength={5}
            maxLength={1000}
          />
        </Field>
        <ErrorNotice error={error} />
        <footer>
          <Button disabled={busy}>
            {busy ? "Recording…" : "Record verified signal"}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
export function HumanRiskProfile() {
  const { id } = useParams();
  const r = useIntelligence(`/profiles/${id}`);
  const [context, setContext] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [tab, setTab] = useState("profile");
  const p = r.data?.profile;
  return (
    <div className="intel-page">
      <Link className="intel-link" to="/admin/human-risk">
        ← Human Risk
      </Link>
      <Loading resource={r}>
        {p && (
          <>
            <PageTitle
              eyebrow="HUMAN RISK PROFILE"
              title={p.name}
              description={`${p.department || "Department not recorded"} · ${p.context?.business_role || "Business role not recorded"}`}
              actions={
                <Button variant="secondary" onClick={() => setContext(true)}>
                  Edit impact context
                </Button>
              }
            />
            <div className="intel-profile-hero">
              <RiskNumber
                score={p.score}
                trend={p.trend}
                coverage={p.coverage}
              />
              <div>
                <RiskStatus score={p.score} />
                <p>
                  {p.missing.length
                    ? `Missing evidence: ${p.missing.join(", ")}.`
                    : "All three factors have recorded evidence."}
                </p>
                <small>
                  {p.confidence} confidence · {p.windowDays}-day signal window
                </small>
              </div>
              <div>
                <span className="intel-eyebrow">NEXT BEST LEARNING ACTION</span>
                <strong>{p.plan.topic}</strong>
                <p>{p.plan.reason}</p>
                <span className="intel-status">
                  {p.plan.level} · {p.plan.cadenceDays}-day cadence
                </span>
              </div>
            </div>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                ["profile", "Profile"],
                ["ledger", "Why this score?"],
                ["action", "Recommended action"],
              ]}
            />
            {tab === "profile" && (
              <>
                <div className="intel-dimension-grid">
                  {Object.entries(p.dimensions).map(([name, value]) => (
                    <div key={name}>
                      <span>{name}</span>
                      <strong>
                        {typeof value === "number"
                          ? `${value} / 100`
                          : String(value ?? "Unmeasured")}
                      </strong>
                      <small>
                        {name === "Exposure"
                          ? "Verified threat exposure"
                          : name === "Impact"
                            ? "Administrator-reviewed business context"
                            : name === "Identity"
                              ? "Authentication signals"
                              : "Observed learning and behavior evidence"}
                      </small>
                    </div>
                  ))}
                </div>
                <section className="sheet section">
                  <div className="section-head">
                    <h2>How Human Risk Index is calculated</h2>
                    <Provenance>{p.version}</Provenance>
                  </div>
                  <div className="intel-factor-equation">
                    {Object.entries(p.factors).map(([name, value], i) => (
                      <div key={name}>
                        <span>{name}</span>
                        <strong>{display(value as number | null)}</strong>
                        {i < 2 && <i>×</i>}
                      </div>
                    ))}
                    <span>÷ 10,000</span>
                    <span>=</span>
                    <strong>{display(p.score)}</strong>
                  </div>
                  <p className="intel-help">{p.explanation}</p>
                  <Link className="intel-link" to="/risk-methodology">Read factor rules and measurement limits <ArrowRight size={13}/></Link>
                  <p className="intel-help">
                    Learning completion adds evidence of participation. It does
                    not reduce risk without an observed safer decision.
                  </p>
                </section>
              </>
            )}
            {tab === "ledger" && <RiskLedger events={p.ledger} />}
            {tab === "action" && (
              <section className="sheet">
                <h2>A targeted next step</h2>
                <p>{p.plan.outcome}</p>
                {r.data.recommendations.length ? (
                  <RecommendationRows
                    recommendations={r.data.recommendations}
                    onReview={setReview}
                  />
                ) : (
                  <Empty
                    title="No evidence-backed intervention pending"
                    description="Continue monitoring, or use a manually reviewed learning assignment."
                  />
                )}
                <Link
                  className="intel-link"
                  to={`/admin/campaigns/new?employee=${id}`}
                >
                  Create a manual campaign
                  <ArrowRight size={14} />
                </Link>
              </section>
            )}
            <div className="intel-privacy-note section">
              <ShieldCheck size={16} />
              Employees see skills and progress. They do not see Human Risk
              Index or risk labels.
            </div>
          </>
        )}
      </Loading>
      {context && (
        <ContextForm
          profile={p}
          onClose={() => setContext(false)}
          onSaved={r.reload}
        />
      )}
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
export function RiskLedger({ events }: { events: any[] }) {
  return (
    <section className="sheet">
      <div className="section-head">
        <div>
          <h2>Risk event ledger</h2>
          <p>Every change comes with its source and factor contribution.</p>
        </div>
        <Clock3 size={20} />
      </div>
      {events.length ? (
        <div className="intel-ledger">
          {events.map((e) => (
            <details key={e.id}>
              <summary>
                <span
                  className={`intel-ledger-dot ${e.delta !== null && e.delta < 0 ? "positive" : ""}`}
                />
                <span>
                  <strong>{e.description}</strong>
                  <small>
                    {new Date(e.occurred_at).toLocaleString()} · {e.source} ·{" "}
                    {e.topic}
                  </small>
                </span>
                <span
                  className={`intel-ledger-impact ${e.delta !== null && e.delta < 0 ? "intel-good" : ""}`}
                >
                  {e.delta === null
                    ? "New evidence"
                    : `${e.delta > 0 ? "+" : ""}${e.delta} pts`}
                </span>
              </summary>
              <div>
                <p>
                  Index: {display(e.before)} → {display(e.after)}
                </p>
                {e.factorChanges.length ? (
                  e.factorChanges.map((f: any) => (
                    <p key={f.factor}>
                      {f.factor}: {display(f.previous)} → {display(f.value)}
                    </p>
                  ))
                ) : (
                  <p>
                    No direct factor change. Follow-up decisions establish
                    behavior change.
                  </p>
                )}
                <small>Source reference: {e.source_id}</small>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <Empty
          title="No risk evidence yet"
          description="Assessments, verified reports, practice responses, and recorded context build this ledger."
        />
      )}
    </section>
  );
}
function ContextForm({
  profile: p,
  onClose,
  onSaved,
}: {
  profile: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Business role & impact" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await act(
              `/profiles/${p.id}/context`,
              {
                businessRole: f.get("role"),
                location: f.get("location"),
                impact: Number(f.get("impact")),
                privileged: f.get("privileged") === "on",
                rationale: f.get("rationale"),
              },
              "PUT",
            );
            onSaved();
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p>
          Impact describes the consequence of a compromised role. It is not an
          assessment of the person’s value or performance.
        </p>
        <Field label="Business role">
          <input
            name="role"
            defaultValue={p.context?.business_role || ""}
            minLength={2}
            maxLength={120}
            required
            placeholder="e.g. Payment approval manager"
          />
        </Field>
        <Field label="Work location">
          <input
            name="location"
            defaultValue={p.context?.location || ""}
            maxLength={100}
          />
        </Field>
        <Field label="Business impact">
          <select name="impact" defaultValue={p.context?.impact || 50}>
            <option value={25}>25 · Limited access</option>
            <option value={50}>50 · Standard business access</option>
            <option value={75}>75 · Sensitive decisions or access</option>
            <option value={100}>
              100 · Critical authority or privileged access
            </option>
          </select>
        </Field>
        <label className="intel-consent">
          <input
            name="privileged"
            type="checkbox"
            defaultChecked={Boolean(p.context?.privileged)}
          />
          Privileged account or sensitive approval authority
        </label>
        <Field label="Why this impact level?">
          <textarea
            name="rationale"
            defaultValue={p.context?.rationale || ""}
            minLength={10}
            maxLength={1000}
            required
          />
        </Field>
        <ErrorNotice error={error} />
        <Button disabled={busy}>
          {busy ? "Saving…" : "Record impact context"}
          <Check size={14} />
        </Button>
      </form>
    </Dialog>
  );
}
