import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Logo, PreviewFrame, Trend } from "./shared";

export const departments = [
  { name: "Finance", score: 62, risk: "Medium", count: 28 },
  { name: "Operations", score: 74, risk: "Medium", count: 54 },
  { name: "People & HR", score: 84, risk: "Low", count: 35 },
  { name: "Engineering", score: 85, risk: "Low", count: 72 },
];
export function ScoreRing({ score = 78 }: { score?: number }) {
  return (
    <div
      className="mk-score-ring"
      role="img"
      aria-label={`Awareness Score ${score} out of 100`}
    >
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="58" className="mk-ring-track" />
        <circle
          cx="70"
          cy="70"
          r="58"
          className="mk-ring-value"
          pathLength="100"
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <div>
        <strong>{score}</strong>
        <span>out of 100</span>
      </div>
    </div>
  );
}
export function TrendChart() {
  return (
    <div
      className="mk-chart"
      role="img"
      aria-label="Example awareness trend: April 71, May 72, June 71, July 75, August 76, September 78"
    >
      <div className="mk-chart-scale">
        <span>80</span>
        <span>70</span>
        <span>60</span>
      </div>
      <svg viewBox="0 0 350 115" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 10H350M0 55H350M0 100H350"
          stroke="#e9e9e7"
          strokeDasharray="3 4"
          fill="none"
        />
        <path
          d="M0 50 70 46 140 50 210 32 280 28 350 19V110H0Z"
          fill="#b72b3008"
        />
        <path
          d="M0 50 70 46 140 50 210 32 280 28 350 19"
          stroke="#b72b30"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="348" cy="19" r="4" fill="#b72b30" />
      </svg>
      <div className="mk-chart-months">
        {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </div>
  );
}
export function DepartmentRows({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="mk-departments">
      <div className="mk-table-labels">
        <span>Department</span>
        <span>Awareness Score</span>
        {detailed && <span>Risk level</span>}
      </div>
      {departments.map((d) => (
        <div className="mk-dept-row" key={d.name}>
          <span>{d.name}</span>
          <div>
            <i>
              <b style={{ width: `${d.score}%` }} />
            </i>
            <strong>{d.score}</strong>
          </div>
          {detailed && (
            <span className={`mk-risk-tag ${d.risk === "Low" ? "mk-low" : ""}`}>
              {d.risk}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
export function ProductPreview({ onAction }: { onAction: () => void }) {
  const [tab, setTab] = useState("Overview");
  return (
    <figure className="mk-dashboard">
      <div className="mk-dashboard-window">
        <span />
        <span />
        <span />
        <div>
          <ShieldCheck size={11} /> AVERIS workspace
        </div>
      </div>
      <div className="mk-dashboard-layout">
        <aside className="mk-product-sidebar">
          <Logo small />
          <div className="mk-org">
            <span>W</span>
            <div>
              Your organization<small>Admin workspace</small>
            </div>
            <ChevronDown size={12} />
          </div>
          <span className="mk-nav-label">WORKSPACE</span>
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Awareness", icon: BarChart3 },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={tab === label ? "is-active" : ""}
              onClick={() => setTab(label)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
          {[
            { label: "People", icon: Users, id: "human-risk" },
            { label: "Campaigns", icon: Target, id: "campaigns" },
            { label: "Learning", icon: BookOpen, id: "learning" },
            { label: "Reports", icon: FileText, id: "reporting" },
          ].map(({ label, icon: Icon, id }) => (
            <a key={label} href={`#${id}`}>
              <Icon size={15} />
              {label}
            </a>
          ))}
          <div className="mk-sidebar-bottom">
            <a href="#security">
              <Settings size={15} />
              Security & settings
            </a>
            <div className="mk-profile">
              <span>JL</span>
              <div>
                Jamie Lee<small>Administrator</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="mk-dashboard-main">
          <div className="mk-dash-top">
            <span>
              Workspace <span>/</span> {tab}
            </span>
            <span className="mk-avatar">JL</span>
          </div>
          <div className="mk-dash-content">
            <div className="mk-dash-heading">
              <div>
                <h2>
                  {tab === "Overview"
                    ? "Your awareness, at a glance."
                    : "Understand your human risk."}
                </h2>
                <p>
                  {tab === "Overview"
                    ? "A clearer view of people, risk, and progress."
                    : "Find the teams that need your attention."}
                </p>
              </div>
              <span className="mk-date">
                This quarter <ChevronDown size={12} />
              </span>
            </div>
            <div className="mk-dash-metrics">
              <div className="mk-dash-score">
                <div className="mk-panel-title">
                  Awareness Score <CircleHelp size={13} />
                </div>
                <div className="mk-score-inline">
                  <ScoreRing />
                  <div>
                    <span className="mk-risk-tag">Medium risk</span>
                    <Trend />
                    <small>189 employees measured</small>
                  </div>
                </div>
              </div>
              <div className="mk-dash-trend">
                <div className="mk-panel-title">
                  Awareness over time<Trend>+7 pts</Trend>
                </div>
                <TrendChart />
              </div>
            </div>
            <div className="mk-dash-lower">
              <div>
                <div className="mk-panel-title">
                  {tab === "Overview"
                    ? "Human risk distribution"
                    : "Risk by employee"}
                  <span>189 people</span>
                </div>
                <div className="mk-risk-bar">
                  <i />
                  <i />
                  <i />
                </div>
                {[
                  { name: "High risk", value: 14, color: "red" },
                  { name: "Medium risk", value: 47, color: "amber" },
                  { name: "Low risk", value: 128, color: "green" },
                ].map((r) => (
                  <div className="mk-risk-row" key={r.name}>
                    <span>
                      <i className={r.color} />
                      {r.name}
                    </span>
                    <strong>
                      {r.value}
                      <small> employees</small>
                    </strong>
                  </div>
                ))}
              </div>
              <div>
                <div className="mk-panel-title">Department comparison</div>
                <DepartmentRows />
              </div>
            </div>
            <div className="mk-insight">
              <span className="mk-insight-icon">
                <Target size={18} />
              </span>
              <div>
                <strong>Finance has the highest phishing risk.</strong>
                <p>A focused refresher is a good next step.</p>
              </div>
              <button onClick={onAction}>
                Assign refresher learning <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        Illustrative product preview · Example data, not customer results
      </figcaption>
    </figure>
  );
}
const signals = [
  {
    name: "Knowledge",
    weight: 35,
    score: 84,
    description: "Quiz and assessment results show what employees understand.",
    source: "Source: graded quizzes & assessments",
  },
  {
    name: "Behavior",
    weight: 30,
    score: 76,
    description:
      "Safe phishing simulations show how employees respond to a threat.",
    source: "Source: controlled simulation responses",
  },
  {
    name: "Reporting",
    weight: 20,
    score: 80,
    description:
      "Reported simulations and confirmed suspicious messages capture positive behavior.",
    source: "Source: simulation reports & reviewed messages",
  },
  {
    name: "Improvement",
    weight: 15,
    score: 65,
    description:
      "Baseline and follow-up assessments show what changed after learning.",
    source: "Source: before-and-after assessments",
  },
];
export function AwarenessScoreDemo() {
  const [selected, setSelected] = useState(0);
  const signal = signals[selected];
  return (
    <PreviewFrame title="Awareness Score">
      <div className="mk-score-demo">
        <div className="mk-score-demo-top">
          <ScoreRing />
          <div>
            <span className="mk-ui-eyebrow">ORGANIZATION AWARENESS</span>
            <h3>A score you can explain.</h3>
            <span className="mk-risk-tag">Medium risk</span>{" "}
            <Trend>+7 points</Trend>
          </div>
        </div>
        <div className="mk-signal-options" aria-label="Explore score signals">
          {signals.map((s, i) => (
            <button
              key={s.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              className={selected === i ? "is-active" : ""}
            >
              <span>{s.name}</span>
              <strong>{s.weight}%</strong>
              <i>
                <b style={{ width: `${s.weight * 2}%` }} />
              </i>
            </button>
          ))}
        </div>
        <div className="mk-signal-detail" aria-live="polite">
          <strong>{signal.name}</strong>
          <p>{signal.description}</p>
          <small>{signal.source}</small>
        </div>
        <div className="mk-score-note">
          <ShieldCheck size={14} />
          Versioned methodology. Traceable evidence.
        </div>
      </div>
    </PreviewFrame>
  );
}
export function HumanRiskPreview({ onAction }: { onAction: () => void }) {
  return (
    <PreviewFrame title="Human risk">
      <div className="mk-ui-body">
        <div className="mk-panel-title">
          See the differences between teams<span>All departments</span>
        </div>
        <DepartmentRows detailed />
        <div className="mk-topic">
          <span>Priority topic</span>
          <strong>Recognizing phishing</strong>
          <span>Finance · 18% click rate</span>
        </div>
        <div className="mk-insight mk-insight-stack">
          <div>
            <strong>Start with Finance.</strong>
            <p>
              Its simulation click rate is above the organization’s 9% average.
            </p>
          </div>
          <button onClick={onAction}>
            Assign Phishing Awareness <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </PreviewFrame>
  );
}
