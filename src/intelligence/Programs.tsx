import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  FileText,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import {
  Button,
  Dialog,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
  useData,
} from "../ui";
import {
  act,
  display,
  IntelNav,
  Provenance,
  ReviewAction,
  useIntelligence,
} from "./shared";

export function Cohorts() {
  const r = useIntelligence("/cohorts");
  const [search] = useSearchParams();
  const [create, setCreate] = useState(search.has("create"));
  const [selected, setSelected] = useState<any>(null);
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="DYNAMIC AUDIENCES"
        title="Cohorts"
        description="Group people by relevant evidence. Membership updates as behavior changes."
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={15} />
            Create cohort
          </Button>
        }
      />
      <IntelNav active="Cohorts" />
      <Loading resource={r}>
        {r.data?.cohorts.length ? (
          <div className="intel-cohorts">
            {r.data.cohorts.map((c: any) => (
              <article className="sheet" key={c.id}>
                <div className="section-head">
                  <Users size={21} />
                  <span className="intel-status">Dynamic</span>
                </div>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
                <div className="intel-cohort-count">
                  <strong>{c.count}</strong>
                  <span>matching people</span>
                </div>
                <div className="intel-conditions">
                  {Object.entries(c.conditions).map(([k, v]) => (
                    <span key={k}>
                      {k.replace(/([A-Z])/g, " $1")}: {String(v)}
                    </span>
                  ))}
                </div>
                <Button variant="secondary" onClick={() => setSelected(c)}>
                  View membership
                  <ArrowRight size={14} />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Define an audience that stays relevant"
            description="For example: two QR simulation interactions in 60 days, a privileged role, or new employees."
            action={
              <Button onClick={() => setCreate(true)}>
                Create your first cohort
              </Button>
            }
          />
        )}
      </Loading>
      {create && (
        <CohortForm
          topics={r.data?.topics || []}
          onClose={() => setCreate(false)}
          onSaved={r.reload}
        />
      )}
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)}>
          <div className="intel-form">
            <p>Current membership is recalculated from the saved conditions.</p>
            {selected.members.map((p: any) => (
              <Link
                className="intel-member"
                key={p.id}
                to={`/admin/human-risk/people/${p.id}`}
              >
                <span>
                  {p.name}
                  <small>{p.department}</small>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
            {!selected.members.length && (
              <p>No one currently matches this cohort.</p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
function CohortForm({
  topics,
  onClose,
  onSaved,
}: {
  topics: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Create a dynamic cohort" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const conditions: any = {};
          for (const key of [
            "department",
            "businessRole",
            "topic",
            "signalKind",
          ])
            if (f.get(key)) conditions[key] = f.get(key);
          for (const key of [
            "minimumRisk",
            "minimumCount",
            "windowDays",
            "newWithinDays",
          ])
            if (f.get(key)) conditions[key] = Number(f.get(key));
          if (f.get("privileged")) conditions.privileged = true;
          setBusy(true);
          try {
            await act("/cohorts", {
              name: f.get("name"),
              description: f.get("description"),
              conditions,
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
        <Field label="Cohort name">
          <input
            name="name"
            required
            minLength={3}
            maxLength={120}
            placeholder="Finance · BEC reinforcement"
          />
        </Field>
        <Field label="Purpose">
          <input name="description" maxLength={1000} />
        </Field>
        <div className="intel-form-grid">
          <Field label="Department (optional)">
            <input name="department" maxLength={100} />
          </Field>
          <Field label="Business role contains">
            <input name="businessRole" maxLength={120} />
          </Field>
        </div>
        <div className="intel-form-grid">
          <Field label="Competency">
            <select name="topic">
              <option value="">Any competency</option>
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Observed signal">
            <select name="signalKind">
              <option value="">Any signal</option>
              <option value="simulation_clicked">Simulation interaction</option>
              <option value="simulation_reported">Simulation reported</option>
              <option value="threat_targeted">Verified threat targeting</option>
              <option value="unsafe_sharing">Unsafe sharing</option>
              <option value="knowledge_assessed">Knowledge assessment</option>
            </select>
          </Field>
        </div>
        <div className="intel-form-grid">
          <Field label="Minimum matching signals">
            <input
              name="minimumCount"
              type="number"
              min={1}
              max={100}
              defaultValue={2}
            />
          </Field>
          <Field label="Within days">
            <input
              name="windowDays"
              type="number"
              min={1}
              max={90}
              defaultValue={60}
            />
          </Field>
        </div>
        <div className="intel-form-grid">
          <Field label="Minimum Human Risk Index (optional)">
            <input name="minimumRisk" type="number" min={0} max={100} />
          </Field>
          <Field label="Joined within days (optional)">
            <input name="newWithinDays" type="number" min={1} max={365} />
          </Field>
        </div>
        <label className="intel-consent">
          <input name="privileged" type="checkbox" />
          Only privileged roles
        </label>
        <ErrorNotice error={error} />
        <Button disabled={busy}>{busy ? "Saving…" : "Create cohort"}</Button>
      </form>
    </Dialog>
  );
}
export function ThreatFeed() {
  const r = useIntelligence("/threats");
  const [create, setCreate] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="THREAT-TO-TRAINING"
        title="Threat feed"
        description="Translate relevant threats into safer employee decisions. Source and freshness stay visible."
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={15} />
            Add threat bulletin
          </Button>
        }
      />
      <IntelNav active="Threat feed" />
      <div className="intel-privacy-note">
        <ShieldCheck size={17} />
        Curated sources and organization reports. No live external feed is
        connected.
      </div>
      <ErrorNotice error={error} />
      <Loading resource={r}>
        {r.data?.threats.length ? (
          <div className="intel-threat-list">
            {r.data.threats.map((t: any) => (
              <article className="sheet" key={t.id}>
                <div className="section-head">
                  <span className="intel-status">{t.topic}</span>
                  <span className={t.stale ? "intel-warning" : "intel-muted"}>
                    {t.stale ? "Older than 30 days" : "Recently observed"}
                  </span>
                </div>
                <h2>{t.title}</h2>
                <p>{t.description}</p>
                <dl className="intel-threat-meta">
                  <div>
                    <dt>Source</dt>
                    <dd>
                      {t.source_url ? (
                        <a
                          href={t.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t.source} ↗
                        </a>
                      ) : (
                        t.source
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Observed</dt>
                    <dd>{new Date(t.observed_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{new Date(t.updated_at).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt>Context</dt>
                    <dd>
                      {t.region || "All regions"} · {t.industry || "General"}
                    </dd>
                  </div>
                </dl>
                <div className="intel-threat-action">
                  <span>{t.departments.join(", ") || "All departments"}</span>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/workspace/intelligence/threats/${t.id}/recommendation`,
                        );
                        if (!response.ok)
                          throw new Error(
                            "Recommendation could not be loaded.",
                          );
                        setReview(await response.json());
                      } catch (e) {
                        setError(e);
                      }
                    }}
                  >
                    Review training action
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No curated threats yet"
            description="Add a security advisory or internal bulletin with its original source and observed date. No sample threat is presented as live."
          />
        )}
      </Loading>
      {create && (
        <ThreatForm
          topics={r.data?.topics || []}
          onClose={() => setCreate(false)}
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
function ThreatForm({
  topics,
  onClose,
  onSaved,
}: {
  topics: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Add a curated threat bulletin" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await act("/threats", {
              title: f.get("title"),
              topic: f.get("topic"),
              description: f.get("description"),
              source: f.get("source"),
              sourceUrl: f.get("url"),
              observedAt: new Date(String(f.get("observed"))).toISOString(),
              region: f.get("region"),
              industry: f.get("industry"),
              departments: String(f.get("departments"))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
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
        <Field label="Bulletin title">
          <input name="title" required minLength={5} maxLength={150} />
        </Field>
        <Field label="Relevant competency">
          <select name="topic">
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="What behavior should employees understand?">
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={4000}
          />
        </Field>
        <div className="intel-form-grid">
          <Field label="Source">
            <input name="source" required minLength={3} maxLength={200} />
          </Field>
          <Field label="Source URL (optional)">
            <input name="url" type="url" placeholder="https://" />
          </Field>
        </div>
        <div className="intel-form-grid">
          <Field label="Observed date">
            <input
              name="observed"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Region">
            <input name="region" maxLength={100} />
          </Field>
        </div>
        <Field label="Industry relevance">
          <input name="industry" maxLength={100} />
        </Field>
        <Field label="Relevant departments (comma separated)">
          <input name="departments" placeholder="Finance, Operations" />
        </Field>
        <ErrorNotice error={error} />
        <Button disabled={busy}>{busy ? "Saving…" : "Save bulletin"}</Button>
      </form>
    </Dialog>
  );
}
export function Autopilot() {
  const r = useIntelligence("/policies");
  const settings = useIntelligence("/settings");
  const [create, setCreate] = useState(false);
  const [governance, setGovernance] = useState(false);
  const [approval, setApproval] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="APPROVED INTERVENTIONS"
        title="AVERIS Autopilot"
        description="Observe first. Automate only the policies your organization has reviewed."
        actions={
          <>
            <Button variant="secondary" onClick={() => setGovernance(true)}>
              Governance
            </Button>
            <Button onClick={() => setCreate(true)}>
              <Plus size={15} />
              Create program
            </Button>
          </>
        }
      />
      <IntelNav active="Autopilot" />
      <Loading resource={r}>
        {r.data && (
          <>
            <div className="intel-automation-modes">
              {[
                ["Observe", "Insights only"],
                ["Recommend", "Suggest an action"],
                ["Assist", "Prepare for review"],
                ["Automate", "Run approved policies"],
              ].map(([mode, description], i) => (
                <div
                  className={r.data.mode === mode ? "active" : ""}
                  key={mode}
                >
                  <span>{i + 1}</span>
                  <h3>{mode}</h3>
                  <p>{description}</p>
                  {r.data.mode === mode && <small>Current mode</small>}
                </div>
              ))}
            </div>
            <div className="intel-privacy-note">
              <ShieldCheck size={17} />
              <span>
                Automation requires an approved policy and at least two verified
                signals. Cadence limits prevent repeated assignments. A
                simulation response determines the follow-up.
              </span>
            </div>
            <ErrorNotice error={error} />
            {r.data.policies.length ? (
              <div className="intel-policy-list">
                {r.data.policies.map((p: any) => (
                  <article className="sheet" key={p.id}>
                    <div className="section-head">
                      <div>
                        <span className="intel-eyebrow">
                          {p.continuous
                            ? "CONTINUOUS PROGRAM"
                            : "INTERVENTION WORKFLOW"}
                        </span>
                        <h2>{p.name}</h2>
                      </div>
                      <span
                        className={`intel-status ${p.enabled ? "positive" : ""}`}
                      >
                        {p.enabled ? "Human Approved" : "Paused / unapproved"}
                      </span>
                    </div>
                    <p>{p.goal}</p>
                    <div className="intel-policy-flow">
                      <span>
                        <Users size={15} />
                        {r.data.cohorts.find((c: any) => c.id === p.cohort_id)
                          ?.name || "Cohort"}
                      </span>
                      <ArrowRight size={13} />
                      <span>{p.action}</span>
                      <ArrowRight size={13} />
                      <span>
                        <Clock3 size={14} />
                        {p.wait_days} days
                      </span>
                      <ArrowRight size={13} />
                      <span>Adaptive practice</span>
                      <ArrowRight size={13} />
                      <span>Reinforce or monitor</span>
                    </div>
                    <div className="intel-threat-action">
                      <small>
                        At most once per {p.cadence_days} days · {p.topic}
                      </small>
                      <Button
                        variant="secondary"
                        onClick={() => setApproval(p)}
                      >
                        {p.enabled ? <Pause size={14} /> : <Play size={14} />}
                        {p.enabled ? "Pause policy" : "Review & enable"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Your team sets the boundaries"
                description="Create a cohort, choose a focused intervention, and review the complete workflow before enabling it."
                action={
                  <Link className="intel-link" to="/admin/human-risk/cohorts">
                    Create a cohort first
                    <ArrowRight size={14} />
                  </Link>
                }
              />
            )}
            <section className="sheet section">
              <div className="section-head">
                <h2>Activity trail</h2>
                <Provenance>Policy and outcome history</Provenance>
              </div>
              {r.data.steps.length ? (
                r.data.steps.map((step: any) => (
                  <div className="intel-activity-row" key={step.id}>
                    <Target size={17} />
                    <div>
                      <strong>
                        {
                          r.data.policies.find(
                            (p: any) => p.id === step.policy_id,
                          )?.name
                        }
                      </strong>
                      <small>
                        Updated {new Date(step.updated_at).toLocaleString()}
                      </small>
                    </div>
                    <span className="intel-status">{step.status}</span>
                    {step.status === "Prepared" && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await act(`/prepared/${step.id}/approve`, {
                              acknowledged: true,
                            });
                            r.reload();
                          } catch (e) {
                            setError(e);
                          }
                        }}
                      >
                        Approve prepared action
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p>
                  No automated or prepared activity. Your organization is in{" "}
                  {r.data.mode} mode.
                </p>
              )}
            </section>
          </>
        )}
      </Loading>
      {create && (
        <PolicyForm
          cohorts={r.data?.cohorts || []}
          onClose={() => setCreate(false)}
          onSaved={r.reload}
        />
      )}
      {governance && settings.data && (
        <Governance
          settings={settings.data.settings}
          provider={settings.data.provider}
          onClose={() => setGovernance(false)}
          onSaved={() => {
            r.reload();
            settings.reload();
          }}
        />
      )}
      {approval && (
        <PolicyApproval
          policy={approval}
          onClose={() => setApproval(null)}
          onSaved={r.reload}
        />
      )}
    </div>
  );
}
function PolicyForm({
  cohorts,
  onClose,
  onSaved,
}: {
  cohorts: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const topics = useIntelligence("/threats");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Create a continuous program" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await act("/policies", {
              name: f.get("name"),
              goal: f.get("goal"),
              cohortId: f.get("cohort"),
              topic: f.get("topic"),
              action: f.get("action"),
              waitDays: Number(f.get("wait")),
              cadenceDays: Number(f.get("cadence")),
              continuous: f.get("continuous") === "on",
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
        <Field label="Program name">
          <input
            name="name"
            minLength={3}
            maxLength={120}
            required
            placeholder="Finance Fraud Defense"
          />
        </Field>
        <Field label="Behavior goal">
          <input
            name="goal"
            minLength={5}
            maxLength={1000}
            required
            placeholder="Verify payment changes through a trusted channel"
          />
        </Field>
        <Field label="Dynamic audience">
          <select name="cohort" required>
            <option value="">Select a cohort</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.count} people
              </option>
            ))}
          </select>
        </Field>
        <div className="intel-form-grid">
          <Field label="Competency">
            <select name="topic">
              {topics.data?.topics.map((t: string) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="First intervention">
            <select name="action">
              <option>Coaching</option>
              <option>Learning</option>
            </select>
          </Field>
        </div>
        <div className="intel-form-grid">
          <Field label="Wait before follow-up (days)">
            <input
              name="wait"
              type="number"
              min={1}
              max={30}
              defaultValue={7}
            />
          </Field>
          <Field label="Minimum cadence (days)">
            <input
              name="cadence"
              type="number"
              min={7}
              max={90}
              defaultValue={30}
            />
          </Field>
        </div>
        <label className="intel-consent">
          <input name="continuous" type="checkbox" defaultChecked />
          Keep monitoring the cohort as a continuous program
        </label>
        <p className="intel-help">
          A follow-up practice scenario is assigned after the wait. A safe
          report reinforces progress; another interaction triggers coaching. No
          response is monitored without a punitive label.
        </p>
        <ErrorNotice error={error} />
        <Button disabled={busy}>
          {busy ? "Saving…" : "Save program for review"}
        </Button>
      </form>
    </Dialog>
  );
}
function PolicyApproval({
  policy: p,
  onClose,
  onSaved,
}: {
  policy: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  return (
    <Dialog
      title={
        p.enabled ? "Pause this policy?" : "Approve this intervention policy"
      }
      onClose={onClose}
    >
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await act(`/policies/${p.id}/approval`, {
              enabled: !p.enabled,
              acknowledged: true,
              version: p.version,
            });
            onSaved();
            onClose();
          } catch (e) {
            setError(e);
          }
        }}
      >
        <h3>{p.name}</h3>
        <p>{p.goal}</p>
        <p>
          {p.enabled
            ? "Pending automated steps stop while this policy is paused. Existing employee assignments remain available."
            : `This policy can assign ${p.action.toLowerCase()}, wait ${p.wait_days} days, then assign practice and follow-up coaching. It runs only in the organization’s chosen Assist or Automate mode.`}
        </p>
        <label className="intel-consent">
          <input type="checkbox" required />I reviewed the audience,
          intervention, cadence, and follow-up behavior.
        </label>
        <ErrorNotice error={error} />
        <Button>{p.enabled ? "Pause policy" : "Approve policy"}</Button>
      </form>
    </Dialog>
  );
}
function Governance({
  settings: s,
  provider,
  onClose,
  onSaved,
}: {
  settings: any;
  provider: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  return (
    <Dialog title="Intelligence governance" onClose={onClose}>
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await act(
              "/settings",
              {
                mode: f.get("mode"),
                minimumSample: Number(f.get("sample")),
                retentionDays: Number(f.get("retention")),
                cadenceDays: Number(f.get("cadence")),
                aiEnabled: f.get("ai") === "on",
                version: s.version,
                acknowledged: true,
              },
              "PUT",
            );
            onSaved();
            onClose();
          } catch (e) {
            setError(e);
          }
        }}
      >
        <Field label="Operating mode">
          <select name="mode" defaultValue={s.mode}>
            {["Observe", "Recommend", "Assist", "Automate"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <div className="intel-form-grid">
          <Field label="Minimum aggregate sample">
            <input
              name="sample"
              type="number"
              min={3}
              max={50}
              defaultValue={s.minimum_sample}
            />
          </Field>
          <Field label="Baseline cadence (days)">
            <input
              name="cadence"
              type="number"
              min={7}
              max={90}
              defaultValue={s.cadence_days}
            />
          </Field>
        </div>
        <Field label="Signal retention (days)">
          <input
            name="retention"
            type="number"
            min={90}
            max={730}
            defaultValue={s.retention_days}
          />
        </Field>
        <label className="intel-consent">
          <input
            name="ai"
            type="checkbox"
            disabled={!provider.configured}
            defaultChecked={Boolean(s.ai_enabled)}
          />
          Enable the configured AI provider
        </label>
        <p className="intel-help">
          {provider.status}. Provider credentials remain on the server. Enabling
          AI permits explicitly requested source material to be sent to that
          provider.
        </p>
        <label className="intel-consent">
          <input type="checkbox" required />I approve these organization-wide
          operating boundaries.
        </label>
        <ErrorNotice error={error} />
        <Button>Save governance settings</Button>
      </form>
    </Dialog>
  );
}
export function IntelligenceAudit() {
  const r = useIntelligence("/audit");
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="EXPLAINABLE BY DESIGN"
        title="Evidence & audit"
        description="Recommendations, source evidence, approvals, model versions, and outcomes stay connected."
      />
      <IntelNav active="Evidence & audit" />
      <Loading resource={r}>
        <section className="sheet">
          {r.data?.events.length ? (
            r.data.events.map((e: any) => (
              <details className="intel-audit-event" key={e.id}>
                <summary>
                  <FileText size={17} />
                  <span>
                    <strong>{e.action}</strong>
                    <small>
                      {new Date(e.created_at).toLocaleString()} ·{" "}
                      {e.system_version}
                    </small>
                  </span>
                  <span className="intel-status">
                    {e.actor_id ? "Human action" : "Approved system action"}
                  </span>
                </summary>
                <div>
                  <h3>Inputs</h3>
                  <dl>
                    {Object.entries(e.input).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <h3>Result</h3>
                  <dl>
                    {Object.entries(e.output).map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ))
          ) : (
            <Empty
              title="No intelligence activity recorded"
              description="New signals, reviewed drafts, recommendations, and automation decisions appear here."
            />
          )}
        </section>
      </Loading>
    </div>
  );
}
