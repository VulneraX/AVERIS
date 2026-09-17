import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useAuth } from "../auth";
import {
  ActionLink,
  Button,
  Dialog,
  Empty,
  ErrorNotice,
  Loading,
  PageTitle,
  useData,
  useLocale,
} from "../ui";
import { act, display, useIntelligence } from "./shared";

export function EmployeeHome2() {
  const native = useData("/me");
  const r = useIntelligence("/me");
  const { user } = useAuth();
  const { t } = useLocale();
  const [coach, setCoach] = useState<any>(null);
  const d = native.data;
  const security = r.data;
  const coaching = security?.coaching.find((c: any) => !c.completed_at);
  const practice = security?.practice.find(
    (p: any) => p.status !== "Completed" && new Date(p.expires_at) > new Date(),
  );
  const assessment = d?.assessments.find(
    (a: any) => !a.completed_at && !a.locked,
  );
  const learning = d?.assignments.find(
    (a: any) => a.status !== "Completed" && a.program_status === "Active",
  );
  const completed =
    d?.assignments.filter((a: any) => a.status === "Completed").length || 0;
  return (
    <div className="intel-page intel-employee">
      <PageTitle
        eyebrow="YOUR SECURITY SKILLS"
        title={`${t("Hello", "Halo")}, ${user?.name.split(" ")[0]}.`}
        description={t(
          "Here’s your next security action.",
          "Berikut tindakan keamanan Anda selanjutnya.",
        )}
      />
      <Loading resource={native}>
        {d && (
          <>
            <div className="intel-employee-layout">
              <section className="intel-employee-next">
                <span className="intel-eyebrow">YOUR NEXT ACTION</span>
                {coaching ? (
                  <>
                    <span className="intel-next-icon">
                      <ShieldCheck size={24} />
                    </span>
                    <h2>{coaching.topic} · a quick coaching moment</h2>
                    <p>{coaching.reason}</p>
                    <div className="intel-next-meta">
                      <span>
                        <Clock3 size={14} />
                        45 seconds
                      </span>
                      <span>Practical guidance</span>
                    </div>
                    <Button onClick={() => setCoach(coaching)}>
                      Start coaching
                      <ArrowRight size={15} />
                    </Button>
                  </>
                ) : practice ? (
                  <>
                    <span className="intel-next-icon">
                      <Target size={24} />
                    </span>
                    <h2>{practice.topic} Challenge</h2>
                    <p>
                      Practice a realistic workplace decision. Learn what to
                      notice and what to do next.
                    </p>
                    <div className="intel-next-meta">
                      <span>
                        <Clock3 size={14} />2 minutes
                      </span>
                      <span>
                        Due {new Date(practice.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <ActionLink to={`/employee/challenges/${practice.id}`}>
                      Start challenge
                    </ActionLink>
                  </>
                ) : assessment || learning ? (
                  <>
                    <span className="intel-next-icon">
                      <BookOpen size={24} />
                    </span>
                    <h2>
                      {assessment
                        ? assessment.kind === "Baseline"
                          ? "Initial security assessment"
                          : "Follow-up security assessment"
                        : learning.title}
                    </h2>
                    <p>
                      {assessment
                        ? "A short measurement of your security knowledge."
                        : `Build a practical skill, one short lesson at a time.`}
                    </p>
                    <div className="intel-next-meta">
                      <span>
                        <Clock3 size={14} />
                        {assessment
                          ? "A few minutes"
                          : `${learning.duration} minutes`}
                      </span>
                      {learning?.due_at && (
                        <span>
                          Due {new Date(learning.due_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <ActionLink
                      to={
                        assessment
                          ? `/employee/assessment/${assessment.id}`
                          : `/employee/learning/${learning.id}`
                      }
                    >
                      {assessment
                        ? t("Start assessment", "Mulai asesmen")
                        : learning.lesson_index
                          ? t("Continue learning", "Lanjutkan pembelajaran")
                          : t("Start learning", "Mulai pembelajaran")}
                    </ActionLink>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={36} />
                    <h2>You’re up to date.</h2>
                    <p>
                      Your next relevant activity will appear here when
                      assigned. Keep verifying requests and reporting concerns.
                    </p>
                    <Link className="intel-link" to="/employee/report-phishing">
                      Report something suspicious
                      <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </section>
              <section className="sheet intel-personal-summary">
                <span className="intel-eyebrow">MY SECURITY PROFILE</span>
                <div className="intel-personal-score">
                  <strong>{display(d.score)}</strong>
                  <span>
                    Awareness
                    <br />
                    out of 100
                  </span>
                </div>
                <div className="intel-personal-row">
                  <span>Current skill level</span>
                  <strong>{security?.level || "Foundation"}</strong>
                </div>
                <div className="intel-personal-row">
                  <span>Verified reporting signals</span>
                  <strong>{security?.reports ?? 0}</strong>
                </div>
                <div className="intel-personal-row">
                  <span>Learning streak</span>
                  <strong>{security?.streak ?? 0} weeks</strong>
                </div>
                <Link className="intel-link" to="/employee/awareness">
                  My Security Skills
                  <ArrowRight size={14} />
                </Link>
              </section>
            </div>
            <section className="sheet section">
              <div className="section-head">
                <h2>My progress</h2>
                <span>
                  {completed} of {d.assignments.length} learning activities
                  complete
                </span>
              </div>
              <div className="intel-progress-track">
                <i
                  style={{
                    width: `${d.assignments.length ? (completed / d.assignments.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="intel-employee-shortcuts">
                {[
                  ["My Learning", "/employee/learning", BookOpen],
                  ["My Security Skills", "/employee/awareness", ShieldCheck],
                  ["Reported Threats", "/employee/report-phishing", Flag],
                  ["Certificates", "/employee/certificates", Award],
                ].map(([title, to, Icon]) => {
                  const Symbol = Icon as typeof Award;
                  return (
                    <Link key={String(title)} to={String(to)}>
                      <Symbol size={19} />
                      {String(title)}
                      <ArrowRight size={14} />
                    </Link>
                  );
                })}
              </div>
            </section>
            <section className="sheet section">
              <div className="section-head">
                <h2>Learning assigned to you</h2>
                <Link className="intel-link" to="/employee/learning">
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>
              {d.assignments.slice(0, 4).map((a: any) => (
                <div className="intel-activity-row" key={a.id}>
                  <BookOpen size={17} />
                  <span>
                    <strong>{a.title}</strong>
                    <small>
                      {a.duration} minutes · {a.status}
                    </small>
                  </span>
                  {a.status !== "Completed" && (
                    <Link
                      className="intel-link"
                      to={`/employee/learning/${a.id}`}
                    >
                      Continue
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ))}
              {!d.assignments.length && (
                <p>
                  Your organization’s learning assignments will appear here.
                </p>
              )}
            </section>
          </>
        )}
      </Loading>
      {coach && (
        <CoachingMoment
          coaching={coach}
          onClose={() => setCoach(null)}
          onSaved={r.reload}
        />
      )}
    </div>
  );
}
export function CoachingMoment({
  coaching: c,
  onClose,
  onSaved,
}: {
  coaching: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="AVERIS Coach" onClose={onClose}>
      <div className="intel-form intel-coach">
        <span className="intel-coach-mark">
          <ShieldCheck size={27} />
        </span>
        <span className="intel-eyebrow">
          A SHORT LEARNING MOMENT · 45 SECONDS
        </span>
        <h2>{c.content.title}</h2>
        <p>{c.content.message}</p>
        <h3>Signals worth noticing</h3>
        <ul>
          {c.content.signals.map((signal: string) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
        <div className="intel-next-time">
          <strong>Next time</strong>
          <p>{c.content.nextTime}</p>
        </div>
        <ErrorNotice error={error} />
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await act(`/coaching/${c.id}/complete`, { acknowledged: true });
              onSaved();
              onClose();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Got it"}
          <Check size={15} />
        </Button>
      </div>
    </Dialog>
  );
}
export function SecurityProfile() {
  const r = useIntelligence("/me");
  const d = r.data;
  return (
    <div className="intel-page intel-employee">
      <PageTitle
        eyebrow="MY SECURITY SKILLS"
        title="Your Security Profile"
        description="A view of your skills, positive habits, and progress. This is not a performance rating."
      />
      <Loading resource={r}>
        {d && (
          <>
            <div className="intel-personal-profile">
              <div>
                <span className="intel-eyebrow">AWARENESS</span>
                <strong>
                  {display(d.awareness.score)}
                  <small> / 100</small>
                </strong>
                <p>{d.awareness.coverage}% evidence coverage</p>
              </div>
              <div>
                <span className="intel-eyebrow">CURRENT LEVEL</span>
                <h2>{d.level}</h2>
                <p>
                  Based on demonstrated decisions, not course completion alone.
                </p>
              </div>
              <div>
                <span className="intel-eyebrow">YOUR MOMENTUM</span>
                <h2>{d.xp} XP</h2>
                <p>
                  {d.streak}-week activity streak · {d.reports} reporting
                  signals
                </p>
              </div>
            </div>
            <div className="intel-employee-layout section">
              <section className="sheet">
                <h2>Your next skill</h2>
                <h3 className="section">{d.plan.topic}</h3>
                <p>{d.plan.reason}</p>
                <div className="intel-next-time">
                  <strong>The habit to build</strong>
                  <p>{d.plan.outcome}</p>
                </div>
                <Link className="intel-link" to="/employee">
                  See my next action
                  <ArrowRight size={14} />
                </Link>
              </section>
              <section className="sheet">
                <h2>Achievements</h2>
                {d.badges.length ? (
                  d.badges.map((b: any) => (
                    <div className="intel-achievement" key={b.name}>
                      <Award size={23} />
                      <span>
                        <strong>{b.name}</strong>
                        <small>{b.description}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="Your progress will show here"
                    description="Build skills through learning, practice, and verified reports. There are no public rankings."
                  />
                )}
              </section>
            </div>
            <section className="sheet section">
              <h2>Skills with measured evidence</h2>
              {d.skills.length ? (
                <div className="intel-skill-list">
                  {d.skills.map((s: any) => (
                    <div key={s.topic}>
                      <BookOpen size={17} />
                      <span>{s.topic}</span>
                      <strong>{s.level}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="section">
                  Your first assessment or practice activity will establish your
                  starting point.
                </p>
              )}
            </section>
            <details className="sheet section">
              <summary>How your profile uses data</summary>
              <p className="section">{d.privacy}</p>
              <ul>
                {d.sources.map((source: string) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
              <p>
                Only your assigned activity and verified security behavior
                contribute. Your organization controls access and retention.
              </p>
            </details>
          </>
        )}
      </Loading>
    </div>
  );
}
export function PracticeChallenge() {
  const { id } = useParams();
  const r = useIntelligence(`/practice/${id}`);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const d = r.data;
  useEffect(() => {
    if (d?.practice.status === "Assigned")
      void act(`/practice/${id}/event`, { event: "opened" }).catch(setError);
    if (d?.coaching) setResult(d.coaching);
  }, [id, d?.practice.id]);
  const respond = async (event: string) => {
    setBusy(true);
    try {
      const response = await act(`/practice/${id}/event`, { event });
      setResult(response.coaching);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="intel-page intel-challenge-page">
      <Link className="intel-link" to="/employee">
        ← My next action
      </Link>
      <Loading resource={r}>
        {d && (
          <section className="intel-challenge sheet">
            <span className="intel-eyebrow">
              CONTROLLED PRACTICE · {d.practice.channel.toUpperCase()} SCENARIO
            </span>
            <h1>
              {result
                ? "This was a simulated attack."
                : `${d.practice.topic} Challenge`}
            </h1>
            {result ? (
              <>
                <div className="intel-coach-mark">
                  <ShieldCheck size={31} />
                </div>
                <h2>{result.title}</h2>
                <p>{result.message}</p>
                <h3>Signals worth noticing</h3>
                <ul>
                  {result.signals.map((s: string) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="intel-next-time">
                  <strong>Next time</strong>
                  <p>{result.nextTime}</p>
                </div>
                <ActionLink to="/employee">Got it</ActionLink>
              </>
            ) : (
              <>
                <p>
                  Practice what you would do. No password, authentication code,
                  or real authorization is requested.
                </p>
                <div className="intel-challenge-message">
                  <span>{d.practice.context}</span>
                  <h2>{d.practice.subject}</h2>
                  <p>{d.practice.message}</p>
                </div>
                <h3>What would you do next?</h3>
                <div className="intel-challenge-choices">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => respond("clicked")}
                  >
                    Follow the unexpected request
                  </Button>
                  <Button disabled={busy} onClick={() => respond("reported")}>
                    <Flag size={15} />
                    Report & verify independently
                  </Button>
                </div>
              </>
            )}
            <ErrorNotice error={error} />
          </section>
        )}
      </Loading>
    </div>
  );
}
