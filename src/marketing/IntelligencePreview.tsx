import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Flag,
  Layers3,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import { Logo, FeatureSection, SectionHeading } from "./shared";
const departments = [
  { name: "Finance", people: 10, score: 36, driver: "Payment verification" },
  { name: "Operations", people: 10, score: 30, driver: "Unexpected requests" },
  { name: "IT", people: 10, score: 15, driver: "Access verification" },
];
export function IntelligencePreview() {
  const [view, setView] = useState("Overview");
  const [review, setReview] = useState(false);
  return (
    <div
      className="mi-dashboard"
      aria-label="Interactive Human Risk Intelligence product example"
    >
      <aside>
        <Logo small />
        <div className="mi-workspace">
          <span>W</span>
          <div>
            Example workspace<small>Security team</small>
          </div>
        </div>
        <nav aria-label="Example product navigation">
          {[
            ["Overview", LayoutDashboard],
            ["Human Risk", Users],
            ["Recommendations", Target],
          ].map(([name, Icon]) => {
            const Symbol = Icon as typeof Users;
            return (
              <button
                key={String(name)}
                aria-pressed={view === name}
                onClick={() => {
                  setView(String(name));
                  setReview(false);
                }}
                className={view === name ? "active" : ""}
              >
                <Symbol size={15} />
                {String(name)}
              </button>
            );
          })}
        </nav>
        <div className="mi-sidebar-bottom">
          <ShieldCheck size={15} />
          Human-controlled<span>Observe mode</span>
        </div>
      </aside>
      <div className="mi-dash-body">
        <header>
          <span>
            Workspace <ChevronRight size={12} /> {view}
          </span>
          <span className="mi-example">Illustrative data</span>
        </header>
        <div className="mi-dash-content">
          <div className="mi-dash-title">
            <div>
              <span>HUMAN RISK INTELLIGENCE</span>
              <h2>
                {view === "Overview"
                  ? "What needs attention today?"
                  : view === "Human Risk"
                    ? "Understand the risk. See the evidence."
                    : "A useful next action. Backed by evidence."}
              </h2>
            </div>
            <span className="mi-period">Last 30 days</span>
          </div>
          {view === "Overview" ? (
            <>
              <div className="mi-metrics">
                <div className="mi-main-metric">
                  <span>Human Risk Index</span>
                  <div>
                    <strong>27</strong>
                    <small>/ 100</small>
                    <b>
                      <ArrowDownRight size={13} />9 pts
                    </b>
                  </div>
                  <footer>
                    Lower means less observed risk
                    <button onClick={() => setView("Human Risk")}>
                      Why?
                      <ArrowRight size={11} />
                    </button>
                  </footer>
                </div>
                <div>
                  <span>Awareness Score</span>
                  <strong>
                    78<small>/ 100</small>
                  </strong>
                  <p>Knowledge & behavior</p>
                </div>
                <div>
                  <span>Measured profiles</span>
                  <strong>
                    30<small>/ 30</small>
                  </strong>
                  <p>All three factors recorded</p>
                </div>
              </div>
              <div className="mi-insight-layout">
                <section className="mi-attention">
                  <div className="mi-section-label">
                    <Target size={15} />
                    Needs attention<span>Evidence rules</span>
                  </div>
                  <h3>Finance needs payment-verification practice.</h3>
                  <p>
                    Two recent simulation interactions support focused
                    reinforcement for one employee.
                  </p>
                  <button
                    onClick={() => {
                      setReview(true);
                      setView("Recommendations");
                    }}
                  >
                    Review recommended action
                    <ArrowRight size={13} />
                  </button>
                  <div className="mi-evidence-line">
                    <span />
                    <span>Observed</span>
                    <ArrowRight size={12} />
                    <span>Recommended</span>
                    <ArrowRight size={12} />
                    <span>Human approved</span>
                  </div>
                </section>
                <section className="mi-brief">
                  <div className="mi-section-label">
                    <FileText size={15} />
                    Human Risk Brief
                  </div>
                  <p>
                    <strong>Risk is down 9 points</strong>
                    <br />
                    From 36 to 27 across the same 30 measured profiles.
                  </p>
                  <div className="mi-brief-foot">
                    <ShieldCheck size={14} />
                    Rules-based summary
                    <br />
                    Every change has a source.
                  </div>
                </section>
              </div>
              <div className="mi-department-head">
                <h3>Department view</h3>
                <button onClick={() => setView("Human Risk")}>
                  Explore human risk
                  <ArrowRight size={12} />
                </button>
              </div>
              <div className="mi-departments">
                {departments.map((d) => (
                  <div key={d.name}>
                    <span>
                      {d.name}
                      <small>{d.people} people</small>
                    </span>
                    <strong>
                      {d.score}
                      <small> / 100</small>
                    </strong>
                    <div>
                      <i style={{ width: `${d.score}%` }} />
                    </div>
                    <small>{d.driver}</small>
                  </div>
                ))}
              </div>
            </>
          ) : view === "Human Risk" ? (
            <>
              <div className="mi-risk-equation">
                <div>
                  <span>Threat</span>
                  <strong>80</strong>
                  <small>Verified exposure</small>
                </div>
                <i>×</i>
                <div>
                  <span>Vulnerability</span>
                  <strong>45</strong>
                  <small>Observed decisions</small>
                </div>
                <i>×</i>
                <div>
                  <span>Impact</span>
                  <strong>75</strong>
                  <small>Business context</small>
                </div>
                <i>÷ 10,000 =</i>
                <div>
                  <span>Example profile</span>
                  <strong>27</strong>
                  <small>Human Risk Index</small>
                </div>
              </div>
              <div className="mi-section-label">
                <Layers3 size={15} />
                An explainable contribution
              </div>
              <div className="mi-ledger-row">
                <span className="mi-positive-dot" />
                <div>
                  <strong>Reported a controlled phishing scenario</strong>
                  <small>Verified practice event · Phishing</small>
                </div>
                <b>−5 pts</b>
              </div>
              <p className="mi-ledger-note">
                Vulnerability: 53 → 45. With threat 80 and impact 75, risk moves
                from 32 → 27.
              </p>
              <div className="mi-method-note">
                <ShieldCheck size={18} />
                <p>
                  Missing factors stay unmeasured. Completing learning alone
                  does not reduce risk.
                </p>
              </div>
              <button
                className="mi-inline"
                onClick={() => setView("Recommendations")}
              >
                Turn evidence into action
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <div className="mi-review">
              <div className="mi-section-label">
                <Target size={16} />
                Recommended · deterministic evidence rules
              </div>
              <h3>Support payment verification in Finance.</h3>
              <dl>
                <div>
                  <dt>Observation</dt>
                  <dd>
                    One employee interacted with two controlled payment-request
                    simulations within 60 days.
                  </dd>
                </div>
                <div>
                  <dt>Business impact</dt>
                  <dd>
                    The role includes payment approval. Independent verification
                    is relevant to the next decision.
                  </dd>
                </div>
                <div>
                  <dt>Expected outcome</dt>
                  <dd>
                    Verify changed payment details using a known contact before
                    approving a transfer.
                  </dd>
                </div>
              </dl>
              <div className="mi-review-action">
                <span>
                  <BookOpen size={17} />
                  45-second coaching moment
                </span>
                <button onClick={() => setReview(!review)}>
                  {review ? "Hide workflow" : "Preview workflow"}
                  <ArrowRight size={13} />
                </button>
              </div>
              {review && (
                <div className="mi-approved-flow" role="status">
                  <span>
                    <Check size={13} />
                    Review audience & evidence
                  </span>
                  <ChevronRight size={13} />
                  <span>Approve coaching</span>
                  <ChevronRight size={13} />
                  <span>Measure follow-up</span>
                  <small>
                    Interactive example only. No employee activity is assigned.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export function IntelligenceLoop() {
  const [active, setActive] = useState(0);
  const systems = [
    [
      "Sense",
      "Collect relevant signals.",
      "Learning, practice, verified reports, and signed security events. Unconnected sources remain visible gaps.",
    ],
    [
      "Intelligence",
      "Understand the evidence.",
      "Explainable risk factors, dynamic cohorts, and a ledger that shows how each observed event contributes.",
    ],
    [
      "Learn",
      "Build the relevant skill.",
      "Short competency-based lessons, baseline assessments, and reviewable content from your own guidance.",
    ],
    [
      "Simulate",
      "Practice the next decision.",
      "Controlled scenarios with difficulty informed by demonstrated performance. No real credentials collected.",
    ],
    [
      "Coach",
      "Help in the moment.",
      "Short, supportive guidance after a risky decision. Employees learn what to notice and how to respond.",
    ],
    [
      "Respond",
      "Make reporting count.",
      "Give employees a clear way to report. Security teams review, classify, and connect verified reports to awareness.",
    ],
  ];
  return (
    <section className="mk-section mi-loop-section" id="how-it-works">
      <div className="mk-container">
        <div className="mk-loop-heading">
          <SectionHeading
            eyebrow="ONE CONTINUOUS LOOP"
            title="From a security signal to a safer decision."
          />
          <p>
            Each intervention has a reason. Each follow-up asks whether it
            helped.
          </p>
        </div>
        <div className="mi-loop-track">
          {[
            "Sense",
            "Understand",
            "Train",
            "Simulate",
            "Coach",
            "Act",
            "Measure",
            "Improve",
          ].map((s, i) => (
            <span key={s}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              {s}
              {i < 7 && <ArrowRight size={14} />}
            </span>
          ))}
        </div>
        <div className="mi-systems">
          <div aria-label="Explore AVERIS systems">
            {systems.map(([name], i) => (
              <button
                key={name}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
                className={i === active ? "active" : ""}
              >
                <span>0{i + 1}</span>AVERIS {name}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <section className="mi-system-detail" aria-live="polite">
            <span className="mk-eyebrow">
              AVERIS {systems[active][0].toUpperCase()}
            </span>
            <h3>{systems[active][1]}</h3>
            <p>{systems[active][2]}</p>
            <div>
              <Radio size={18} />
              <span>
                Evidence in.
                <ArrowRight size={14} />A useful next action out.
              </span>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
export function RiskMethodPreview() {
  return (
    <div className="mi-method-preview">
      <div className="mi-section-label">
        <Layers3 size={16} />
        Human Risk Profile<span>Example</span>
      </div>
      <div className="mi-method-score">
        <strong>
          27<small>/ 100</small>
        </strong>
        <div>
          Human Risk Index<span>100% factor coverage</span>
        </div>
      </div>
      <div className="mi-method-factors">
        {[
          ["Threat", "80", "Verified exposure"],
          ["Vulnerability", "45", "Observed decisions"],
          ["Impact", "75", "Reviewed role context"],
        ].map(([label, value, source]) => (
          <div key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <div>
              <i style={{ width: `${value}%` }} />
            </div>
            <small>{source}</small>
          </div>
        ))}
      </div>
      <p>
        80 × 45 × 75 ÷ 10,000 = <strong>27</strong>
      </p>
      <div className="mi-method-note">
        <ShieldCheck size={16} />
        <span>
          Every factor is traceable. Unknown is never treated as low risk.
        </span>
      </div>
    </div>
  );
}
export function StudioStory() {
  return (
    <FeatureSection
      id="content-studio"
      eyebrow="AVERIS CONTENT STUDIO"
      title="Your guidance. Ready for the next real decision."
      description="Start with a policy, PDF, text, URL, existing lesson, or threat bulletin. Shape it into short learning, useful questions, and a safe practice scenario."
      reverse
      muted
      visual={
        <div className="mi-studio">
          <header>
            <span>
              <FileText size={17} />
              Payment verification policy
            </span>
            <small>Source document · example</small>
          </header>
          <div className="mi-studio-main">
            <span className="mk-eyebrow">LEARNING DRAFT</span>
            <h3>Verify before the transfer.</h3>
            <p>
              Recognize a changed payment request. Confirm it through a trusted
              channel.
            </p>
            <ol>
              <li>
                <span>01</span>Notice the changed account details
                <small>Short scenario</small>
              </li>
              <li>
                <span>02</span>Choose an independent verification step
                <small>Knowledge check</small>
              </li>
              <li>
                <span>03</span>Explain why your choice is safer
                <small>Practical feedback</small>
              </li>
            </ol>
            <div className="mi-editor-note">
              <Check size={15} />
              Questions, answers, and explanations stay editable.
            </div>
          </div>
          <footer>
            Draft
            <ChevronRight size={12} />
            Review
            <ChevronRight size={12} />
            Approve
            <ChevronRight size={12} />
            Publish
          </footer>
        </div>
      }
    >
      <div className="mi-copy-points">
        <p>
          <strong>Human review is part of the workflow.</strong> Editing resets
          approval. Published versions preserve what employees received.
        </p>
        <p>
          <strong>AI is optional.</strong> Manual drafting works now. AI
          generation requires a configured provider and explicit enablement.
        </p>
      </div>
    </FeatureSection>
  );
}
export function AdaptiveStory() {
  return (
    <section className="mk-section mi-adaptive" id="adaptive-learning">
      <div className="mk-container">
        <div className="mk-loop-heading">
          <SectionHeading
            eyebrow="RELEVANCE OVER REPETITION"
            title="The right practice. At the right pace."
          />
          <p>
            Topic, difficulty, and cadence follow evidence. More practice when
            support is needed; a lighter cadence when safer habits hold.
          </p>
        </div>
        <div className="mi-adaptive-example">
          <div>
            <span className="mk-eyebrow">OBSERVE</span>
            <h3>Two risky decisions.</h3>
            <p>Repeated simulation interactions in a payment-approval role.</p>
            <small>Verified behavior + business context</small>
          </div>
          <ArrowRight size={22} />
          <div>
            <span className="mk-eyebrow">SUPPORT</span>
            <h3>One focused intervention.</h3>
            <p>BEC coaching and a foundation-level verification scenario.</p>
            <small>Illustrative 15-day cadence</small>
          </div>
          <ArrowRight size={22} />
          <div>
            <span className="mk-eyebrow">REASSESS</span>
            <h3>Look for a safer decision.</h3>
            <p>Measure the follow-up response before claiming improvement.</p>
            <small>Behavior, not a completion checkbox</small>
          </div>
        </div>
        <div className="mi-competencies">
          <span>24 security competencies</span>
          <p>
            Phishing · BEC · MFA · Passkeys · OAuth Consent · AI Security ·
            Shadow AI · Data Protection · Secure Collaboration · Executive
            Security
          </p>
        </div>
      </div>
    </section>
  );
}
export function CoachStory() {
  const [ack, setAck] = useState(false);
  return (
    <FeatureSection
      id="coaching"
      eyebrow="AVERIS COACH"
      title="Make the next decision a better one."
      description="A risky click should lead to useful support. Give employees a short coaching moment while the scenario is still fresh."
      visual={
        <div className="mi-coach">
          <div className="mi-coach-icon">
            <ShieldCheck size={24} />
          </div>
          <span className="mk-eyebrow">A QUICK COACHING MOMENT · EXAMPLE</span>
          <h3>
            {ack
              ? "A useful habit to take with you."
              : "This was a simulated request."}
          </h3>
          <p>
            {ack
              ? "Next time a payment request changes, pause and verify using a contact you already trust."
              : "The request used urgency and changed payment details. Those are reasons to pause and verify."}
          </p>
          <div>
            <Flag size={16} />
            <span>
              Report the message.
              <br />
              Confirm independently before acting.
            </span>
          </div>
          <button className="mk-button" onClick={() => setAck(!ack)}>
            {ack ? "Review the guidance" : "Got it"}
            <Check size={15} />
          </button>
          <small>
            {ack
              ? "Preview complete. No employee record was changed."
              : "45 seconds · Supportive guidance, no public risk label."}
          </small>
        </div>
      }
    >
      <p className="mk-quiet-callout">
        Help people see what to notice.
        <br />
        <strong>Then give them a chance to practice.</strong>
      </p>
    </FeatureSection>
  );
}
export function AutopilotStory() {
  const [mode, setMode] = useState(0);
  const modes = [
    [
      "Observe",
      "Collect evidence and review changes. No background intervention runs.",
    ],
    ["Recommend", "Review suggested actions and choose what to assign."],
    [
      "Assist",
      "Approved policies prepare interventions for a person to review.",
    ],
    [
      "Automate",
      "Explicitly approved policies execute within audience, cadence, and follow-up limits.",
    ],
  ];
  return (
    <section className="mk-section mi-autopilot" id="autopilot">
      <div className="mk-container mk-feature">
        <div>
          <SectionHeading
            eyebrow="CONTROLLED AUTOMATION"
            title="A continuous program. With clear boundaries."
          >
            Choose the audience, goal, cadence, intervention, and follow-up.
            Observe is the default. You decide how much the system can do.
          </SectionHeading>
          <p className="mk-copy-note">
            Decisions retain their evidence, policy version, and approver. Pause
            a policy whenever your priorities change.
          </p>
        </div>
        <div className="mi-autopilot-preview">
          <div className="mi-section-label">
            <ShieldCheck size={17} />
            Autopilot governance<span>Interactive example</span>
          </div>
          <div className="mi-mode-options">
            {modes.map(([name], i) => (
              <button
                aria-pressed={i === mode}
                className={i === mode ? "active" : ""}
                key={name}
                onClick={() => setMode(i)}
              >
                {name}
              </button>
            ))}
          </div>
          <h3>{modes[mode][0]} mode</h3>
          <p aria-live="polite">{modes[mode][1]}</p>
          <div className="mi-policy-example">
            <span>Verified cohort match</span>
            <ChevronRight size={14} />
            <span>Coaching</span>
            <ChevronRight size={14} />
            <span>Wait</span>
            <ChevronRight size={14} />
            <span>Follow-up practice</span>
          </div>
          <small>
            Preview only. Changing this example does not enable automation.
          </small>
        </div>
      </div>
    </section>
  );
}
