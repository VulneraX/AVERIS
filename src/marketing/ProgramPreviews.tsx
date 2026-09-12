import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileCheck2,
  Flag,
  Mail,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import { PreviewFrame, Trend } from "./shared";
import { DepartmentRows, TrendChart } from "./ProductPreview";

const stages = [
  "Audience",
  "Learning",
  "Assessment",
  "Simulation",
  "Schedule",
  "Launch",
];
export function CampaignPreview() {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState("Finance");
  const [simulation, setSimulation] = useState(true);
  const [launched, setLaunched] = useState(false);
  return (
    <PreviewFrame
      title="Campaign builder"
      label="Interactive preview · Nothing is sent to employees"
    >
      <div className="mk-ui-body">
        <div className="mk-panel-title">
          Phishing awareness refresher
          <span className="mk-risk-tag">
            {launched ? "Preview complete" : "Draft"}
          </span>
        </div>
        <div className="mk-campaign-steps" aria-label="Campaign steps">
          {stages.map((s, i) => (
            <button
              key={s}
              aria-current={i === step ? "step" : undefined}
              onClick={() => {
                setStep(i);
                setLaunched(false);
              }}
              className={
                i === step ? "is-active" : i < step ? "is-complete" : ""
              }
            >
              <span>{i < step ? <Check size={12} /> : i + 1}</span> {s}
            </button>
          ))}
        </div>
        <div className="mk-campaign-content" aria-live="polite">
          {launched ? (
            <div className="mk-launch-success">
              <CheckCircle2 size={32} />
              <h3>Your campaign is ready.</h3>
              <p>
                This is a preview. In your workspace, launch assigns activities
                to your selected audience.
              </p>
            </div>
          ) : (
            <>
              <span className="mk-ui-eyebrow">STEP {step + 1} OF 6</span>
              <h3>
                {
                  [
                    "Who needs this learning?",
                    "Give learning a clear purpose.",
                    "Measure before and after.",
                    "Add a safe behavior check.",
                    "Keep the program on track.",
                    "Review your campaign.",
                  ][step]
                }
              </h3>
              {step === 0 && (
                <>
                  <p>Choose a department for your targeted program.</p>
                  <div className="mk-audience-options">
                    {["Finance", "Operations", "Everyone"].map((d) => (
                      <button
                        aria-pressed={audience === d}
                        className={audience === d ? "is-active" : ""}
                        onClick={() => setAudience(d)}
                        key={d}
                      >
                        <UsersIcon />
                        {d}
                        <span>
                          {d === "Finance"
                            ? "28"
                            : d === "Operations"
                              ? "54"
                              : "189"}{" "}
                          employees
                        </span>
                        {audience === d && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 1 && (
                <div className="mk-assignment">
                  <BookOpen size={24} />
                  <div>
                    <strong>Phishing Awareness</strong>
                    <small>
                      8 minutes · Recognize and report suspicious messages
                    </small>
                  </div>
                  <CheckCircle2 size={18} />
                </div>
              )}
              {step === 2 && (
                <div className="mk-config-lines">
                  <div>
                    <CheckCircle2 size={17} />
                    <span>
                      Baseline assessment
                      <small>Understand knowledge before learning</small>
                    </span>
                  </div>
                  <div>
                    <CheckCircle2 size={17} />
                    <span>
                      Follow-up assessment
                      <small>Measure knowledge after learning</small>
                    </span>
                  </div>
                </div>
              )}
              {step === 3 && (
                <label className="mk-checkbox">
                  <input
                    type="checkbox"
                    checked={simulation}
                    onChange={(e) => setSimulation(e.target.checked)}
                  />
                  <span>
                    Include a phishing simulation
                    <small>
                      Controlled tracking. No real credentials collected.
                    </small>
                  </span>
                </label>
              )}
              {step === 4 && (
                <div className="mk-config-lines">
                  <div>
                    <Clock3 size={17} />
                    <span>
                      Program duration<small>Two weeks from launch</small>
                    </span>
                  </div>
                  <div>
                    <Mail size={17} />
                    <span>
                      Gentle reminders
                      <small>Three days before the learning deadline</small>
                    </span>
                  </div>
                </div>
              )}
              {step === 5 && (
                <dl className="mk-review">
                  <div>
                    <dt>Audience</dt>
                    <dd>{audience}</dd>
                  </div>
                  <div>
                    <dt>Learning</dt>
                    <dd>Phishing Awareness</dd>
                  </div>
                  <div>
                    <dt>Assessments</dt>
                    <dd>Baseline + follow-up</dd>
                  </div>
                  <div>
                    <dt>Simulation</dt>
                    <dd>{simulation ? "Included" : "Not included"}</dd>
                  </div>
                </dl>
              )}
            </>
          )}
        </div>
        <div className="mk-campaign-actions">
          <span>Try the campaign builder</span>
          <div>
            {step > 0 && (
              <button
                className="mk-ui-button"
                onClick={() => {
                  setStep(step - 1);
                  setLaunched(false);
                }}
                aria-label="Previous campaign step"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <button
              className="mk-ui-button mk-ui-primary"
              onClick={() => {
                if (launched) {
                  setStep(0);
                  setLaunched(false);
                } else if (step < 5) setStep(step + 1);
                else setLaunched(true);
              }}
            >
              {launched
                ? "Start again"
                : step === 5
                  ? "Preview launch"
                  : "Continue"}
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
function UsersIcon() {
  return (
    <span className="mk-department-icon" aria-hidden="true">
      ▦
    </span>
  );
}
const lessons = [
  "Notice the warning signs",
  "Check before you click",
  "Report suspicious messages",
];
export function LearningPreview() {
  const [lesson, setLesson] = useState(0);
  const [started, setStarted] = useState(false);
  return (
    <PreviewFrame title="Learning player" label="Interactive lesson preview">
      <div className="mk-learning-player">
        <div className="mk-lesson-side">
          <BookOpen size={20} />
          <strong>Phishing Awareness</strong>
          <small>3 short lessons · 8 minutes</small>
          {lessons.map((name, i) => (
            <button
              className={lesson === i ? "is-active" : ""}
              onClick={() => {
                setLesson(i);
                setStarted(true);
              }}
              key={name}
            >
              <span>{i + 1}</span>
              {name}
            </button>
          ))}
        </div>
        <div className="mk-lesson-main">
          <span className="mk-ui-eyebrow">LESSON {lesson + 1} OF 3</span>
          <h3>{lessons[lesson]}</h3>
          <div className="mk-example-email">
            <div>
              <span className="mk-mail-icon">
                <Mail size={18} />
              </span>
              <div>
                <strong>
                  {lesson === 0
                    ? "Your account needs attention"
                    : lesson === 1
                      ? "Check the sender first"
                      : "Something feels suspicious?"}
                </strong>
                <small>
                  {lesson === 0
                    ? "IT Support · External sender"
                    : lesson === 1
                      ? "support@company-example.test"
                      : "You can help keep your team safe."}
                </small>
              </div>
            </div>
            <p>
              {lesson === 0
                ? "An unexpected request. A sense of urgency. A link you weren’t expecting."
                : lesson === 1
                  ? "A familiar display name does not verify an email address. Check the full address and link destination."
                  : "Use your organization’s reporting process. Avoid opening attachments or forwarding the message to coworkers."}
            </p>
            <span className="mk-email-flag">
              <Flag size={12} />
              {lesson === 0
                ? "Pause before taking action"
                : lesson === 1
                  ? "Inspect links without opening them"
                  : "Report it. Let security review it."}
            </span>
          </div>
          {!started ? (
            <button
              className="mk-ui-button mk-ui-primary"
              onClick={() => setStarted(true)}
            >
              <Play size={13} />
              Explore this lesson
            </button>
          ) : (
            <div className="mk-lesson-explanation" aria-live="polite">
              <p>
                {
                  [
                    "Urgency is a common warning sign. Verify an unexpected request through a trusted channel before you act.",
                    "If a link or sender looks wrong, stop. Open the service through a trusted bookmark instead.",
                    "Reporting is a positive security habit. A quick report can help security teams act earlier.",
                  ][lesson]
                }
              </p>
              <button
                className="mk-ui-button"
                onClick={() => setLesson((lesson + 1) % 3)}
              >
                {lesson === 2 ? "Review first lesson" : "Next lesson"}
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </PreviewFrame>
  );
}
export function SimulationPreview() {
  return (
    <PreviewFrame title="Simulation results">
      <div className="mk-ui-body">
        <div className="mk-panel-title">
          Phishing recognition check<span>Completed</span>
        </div>
        <div className="mk-simulation-metrics">
          {[
            ["Delivered", "189", "100%"],
            ["Opened", "142", "75%"],
            ["Clicked", "17", "9%"],
            ["Reported", "68", "36%"],
          ].map(([label, value, rate]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{rate} of delivered</small>
            </div>
          ))}
        </div>
        <div className="mk-panel-title">
          Click rate by department<span>Lower is better</span>
        </div>
        <div className="mk-click-bars">
          {[
            ["Finance", 18],
            ["Operations", 11],
            ["People & HR", 6],
            ["Engineering", 6],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <i>
                <b style={{ width: `${Number(value) * 4}%` }} />
              </i>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
        <div className="mk-safe-note">
          <ShieldCheck size={14} />
          No real credentials collected. Ever.
        </div>
      </div>
    </PreviewFrame>
  );
}
export function ReportingBehaviorPreview() {
  const [reported, setReported] = useState(false);
  return (
    <PreviewFrame
      title="Report phishing"
      label="Interactive reporting preview · No message is submitted"
    >
      <div className="mk-ui-body">
        <div className="mk-message-header">
          <span className="mk-mail-icon">
            <Mail size={20} />
          </span>
          <div>
            <strong>Unusual account activity</strong>
            <small>From an unfamiliar sender · Just now</small>
          </div>
        </div>
        <div className="mk-message-body">
          <p>
            “Please confirm your account details immediately to avoid losing
            access.”
          </p>
          <span>Unexpected urgency? A request for sensitive information?</span>
        </div>
        <div className="mk-report-action">
          {reported ? (
            <div className="mk-report-success" role="status">
              <CheckCircle2 size={20} />
              <div>
                <strong>Thanks for speaking up.</strong>
                <small>
                  Preview: your report would go to the security team for review.
                </small>
              </div>
            </div>
          ) : (
            <button
              className="mk-ui-button mk-ui-primary"
              onClick={() => setReported(true)}
            >
              <Flag size={14} />
              Report suspicious message
            </button>
          )}
        </div>
        <div className="mk-report-flow">
          <span>
            <Mail size={15} />
            Suspicious message
          </span>
          <ArrowRight size={12} />
          <span>
            <Flag size={15} />
            Employee reports
          </span>
          <ArrowRight size={12} />
          <span>
            <ShieldCheck size={15} />
            Security reviews
          </span>
        </div>
      </div>
    </PreviewFrame>
  );
}
export function EmployeePreview() {
  return (
    <PreviewFrame title="Employee home">
      <div className="mk-ui-body mk-employee-home">
        <div className="mk-employee-greeting">
          <div>
            <span className="mk-ui-eyebrow">YOUR AWARENESS JOURNEY</span>
            <h3>Good morning, Maya.</h3>
            <p>A little learning. A safer workday.</p>
          </div>
          <span className="mk-avatar">MK</span>
        </div>
        <div className="mk-next-action">
          <span className="mk-ui-eyebrow">YOUR NEXT ACTION</span>
          <h3>Phishing Awareness</h3>
          <p>Build the habit of spotting suspicious messages.</p>
          <div>
            <span>
              <Clock3 size={13} />8 minutes remaining
            </span>
            <span>Due Friday</span>
          </div>
          <a className="mk-ui-button mk-ui-primary" href="#learning">
            Continue Learning
            <ArrowRight size={13} />
          </a>
        </div>
        <div className="mk-employee-bottom">
          <div>
            <span>My Awareness</span>
            <strong>
              78 <Trend>+6 this month</Trend>
            </strong>
          </div>
          <div>
            <span>Your progress</span>
            <strong>
              3 <small>of 4 activities complete</small>
            </strong>
            <div className="mk-simple-progress">
              <i />
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
export function ReportPreview({ onExport }: { onExport: () => void }) {
  return (
    <PreviewFrame title="Executive report">
      <div className="mk-ui-body mk-executive">
        <div className="mk-report-title">
          <div>
            <span className="mk-ui-eyebrow">Q3 2026 · AWARENESS PROGRAM</span>
            <h3>Improvement you can show.</h3>
          </div>
          <FileCheck2 size={26} />
        </div>
        <div className="mk-report-summary">
          <div>
            <span>Awareness Score</span>
            <strong>
              71 <ArrowRight size={20} />
              78
            </strong>
            <Trend>+7 points from baseline</Trend>
          </div>
          <TrendChart />
        </div>
        <div className="mk-report-stats">
          {[
            ["Participation", "96%"],
            ["Completion", "92%"],
            ["Pass rate", "88%"],
            ["Reporting rate", "36%"],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <DepartmentRows />
        <div className="mk-report-foot">
          <span>
            Phishing click rate <strong>16% → 9%</strong>
          </span>
          <button className="mk-ui-button" onClick={onExport}>
            <FileCheck2 size={13} />
            Report details
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </PreviewFrame>
  );
}
export function EvidencePreview() {
  return (
    <div className="mk-evidence-list">
      {[
        {
          name: "Campaign history",
          detail: "Audience, timeline, and interventions",
          icon: Clock3,
        },
        {
          name: "Learning & assessment records",
          detail: "Completion, results, and certificates",
          icon: FileCheck2,
        },
        {
          name: "Activity & audit log",
          detail: "Traceable actions with timestamps",
          icon: ShieldCheck,
        },
        {
          name: "Program reports",
          detail: "Executive PDF and employee CSV",
          icon: Send,
        },
      ].map(({ name, detail, icon: Icon }) => (
        <div key={name}>
          <Icon size={19} />
          <span>
            <strong>{name}</strong>
            <small>{detail}</small>
          </span>
          <Check size={15} />
        </div>
      ))}
    </div>
  );
}
