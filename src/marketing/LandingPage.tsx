import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Logo,
  DemoButton,
  SectionHeading,
  FeatureSection,
  CheckList,
} from "./shared";
import {
  AwarenessScoreDemo,
  HumanRiskPreview,
  ProductPreview,
} from "./ProductPreview";
import {
  CampaignPreview,
  EmployeePreview,
  EvidencePreview,
  LearningPreview,
  ReportingBehaviorPreview,
  ReportPreview,
  SimulationPreview,
} from "./ProgramPreviews";
import { ContactDialog, type DialogKind } from "./ContactDialog";
import "./marketing.css";
import "./intelligence-marketing.css";
import {
  IntelligencePreview,
  IntelligenceLoop,
  RiskMethodPreview,
  StudioStory,
  AdaptiveStory,
  CoachStory,
  AutopilotStory,
} from "./IntelligencePreview";

const navItems = [
  ["Product", "#product"],
  ["Solutions", "#solutions"],
  ["How It Works", "#how-it-works"],
  ["Resources", "#resources"],
];
function Navbar({ openDialog }: { openDialog: (kind: DialogKind) => void }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const mobile = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) mobile.current?.showModal();
    else mobile.current?.close();
    const before = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <header className="mk-header">
      <div className="mk-container mk-nav">
        <Logo />
        <nav className="mk-desktop-nav" aria-label="Main navigation">
          {navItems.map(([name, href]) => (
            <a key={name} href={href}>
              {name}
            </a>
          ))}
          <button onClick={() => openDialog("pricing")}>Pricing</button>
        </nav>
        <div className="mk-nav-actions">
          <a href="/login" className="mk-sign-in">
            Sign in
          </a>
          <DemoButton onClick={() => openDialog("demo")} />
          <button
            ref={trigger}
            className="mk-menu-toggle"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mk-mobile-menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
      <dialog
        id="mk-mobile-menu"
        ref={mobile}
        className="mk-mobile-menu"
        onCancel={close}
        aria-label="Mobile navigation"
      >
        <div>
          <Logo />
          <button onClick={close} aria-label="Close navigation">
            <X size={22} />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {navItems.map(([name, href]) => (
            <a key={name} href={href} onClick={close}>
              {name}
              <ChevronRight size={18} />
            </a>
          ))}
          <button
            onClick={() => {
              close();
              openDialog("pricing");
            }}
          >
            Pricing
            <ChevronRight size={18} />
          </button>
          <a href="/login">
            Sign in
            <ArrowRight size={18} />
          </a>
        </nav>
        <DemoButton
          onClick={() => {
            close();
            openDialog("demo");
          }}
        />
      </dialog>
    </header>
  );
}
function Hero({ onDemo }: { onDemo: () => void }) {
  return (
    <section className="mk-hero" id="product">
      <div className="mk-container">
        <div className="mk-hero-copy">
          <span className="mk-eyebrow">
            <span className="mk-eyebrow-line" />
            Human Risk Intelligence Platform
          </span>
          <h1>
            Turn human behavior into
            <br className="mk-desktop-break" />{" "}
            <span>measurable security resilience.</span>
          </h1>
          <p>
            Connect awareness, real behavior, and business context.
            <br className="mk-desktop-break" /> See where support is needed,
            take targeted action,
            <br className="mk-desktop-break" /> and measure whether the next
            decision is safer.
          </p>
          <div className="mk-hero-actions">
            <DemoButton onClick={onDemo} />
            <a className="mk-button mk-secondary" href="#platform-preview">
              See AVERIS in Action
              <ArrowDown size={16} />
            </a>
          </div>
          <div className="mk-hero-micro">
            <span>
              <Check size={13} />
              Built for security teams
            </span>
            <span>
              <Check size={13} />
              Measurable by design
            </span>
          </div>
        </div>
        <div className="mk-hero-product" id="platform-preview">
          <div className="mk-preview-caption">
            <span>
              <span className="mk-small-dot" /> THE SIGNAL BEHIND YOUR PROGRAM
            </span>
            <span>Measure awareness. Understand risk. Change behavior.</span>
          </div>
          <IntelligencePreview />
        </div>
      </div>
    </section>
  );
}
function Trust() {
  return (
    <section className="mk-trust">
      <div className="mk-container">
        <p>Built for teams responsible for human security risk</p>
        <div>
          {[
            { label: "Security", icon: ShieldCheck },
            { label: "IT", icon: Layers3 },
            { label: "GRC", icon: ClipboardCheck },
            { label: "HR & Learning", icon: Users },
          ].map(({ label, icon: Icon }) => (
            <span key={label}>
              <Icon size={21} strokeWidth={1.5} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
function Problem() {
  return (
    <section className="mk-section mk-problem">
      <div className="mk-container mk-feature">
        <div>
          <SectionHeading
            eyebrow="BEYOND THE CHECKBOX"
            title="Completion is not the same as awareness."
          >
            A completed training module doesn’t tell you whether employees can
            identify threats, avoid risky behavior, or report suspicious
            activity.
          </SectionHeading>
          <p className="mk-problem-conclusion">
            You need to know what changed.
            <br />
            <strong>Not just who clicked “complete.”</strong>
          </p>
        </div>
        <div className="mk-comparison">
          <div className="mk-completion">
            <span>TRADITIONAL AWARENESS</span>
            <div>
              <p>Training completed</p>
              <strong>
                92<span>%</span>
              </strong>
            </div>
            <div className="mk-completion-bar">
              <i />
            </div>
            <small>Example completion metric</small>
          </div>
          <div className="mk-unknowns">
            <strong>But what does that tell you?</strong>
            {[
              "Can employees recognize phishing?",
              "Will they report suspicious messages?",
              "Which departments carry the most risk?",
              "Did awareness actually improve?",
            ].map((s) => (
              <div key={s}>
                <span>?</span>
                {s}
              </div>
            ))}
          </div>
          <div className="mk-comparison-answer">
            <BarChart3 size={18} />
            <span>
              AVERIS connects the signals to show measurable human risk.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
function Roles() {
  const [active, setActive] = useState(0);
  const roles = [
    {
      name: "Security / IT",
      title: "Know where to focus next.",
      copy: "Measure human risk, identify weak topics, and target the teams that need additional support.",
      icon: ShieldCheck,
      items: [
        "Organization and department insights",
        "Targeted interventions",
        "Phishing and reporting signals",
      ],
    },
    {
      name: "GRC",
      title: "Put evidence within reach.",
      copy: "Connect awareness activity to a traceable record of what happened and what improved.",
      icon: ClipboardCheck,
      items: [
        "Campaign history and audit records",
        "Assessment and completion evidence",
        "Executive PDF and employee CSV",
      ],
    },
    {
      name: "HR / Learning",
      title: "Make awareness manageable.",
      copy: "Coordinate employee learning with clear assignments, realistic deadlines, and focused content.",
      icon: GraduationCap,
      items: [
        "Short, purposeful learning",
        "Audience and schedule controls",
        "Employee progress visibility",
      ],
    },
    {
      name: "Management",
      title: "See progress without the complexity.",
      copy: "Understand awareness trends and program outcomes through an explainable score and concise reporting.",
      icon: Building2,
      items: [
        "Before-and-after comparisons",
        "Department risk trends",
        "Decision-ready reporting",
      ],
    },
  ];
  const role = roles[active];
  const Icon = role.icon;
  return (
    <section className="mk-section" id="solutions">
      <div className="mk-container mk-roles">
        <SectionHeading
          eyebrow="A SHARED VIEW, THE RIGHT CONTEXT"
          title="One program. Every team aligned."
        />
        <div className="mk-role-tabs" aria-label="Explore team solutions">
          {roles.map((r, i) => (
            <button
              key={r.name}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={i === active ? "is-active" : ""}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="mk-role-content" aria-live="polite">
          <div>
            <Icon size={25} />
            <h3>{role.title}</h3>
            <p>{role.copy}</p>
          </div>
          <CheckList items={role.items} />
        </div>
      </div>
    </section>
  );
}
function Security() {
  return (
    <section className="mk-section mk-muted-section" id="security">
      <div className="mk-container">
        <div className="mk-security-heading">
          <SectionHeading
            eyebrow="SECURITY & PRIVACY"
            title="Designed with security in mind."
          >
            Practical controls for the people and evidence behind your awareness
            program.
          </SectionHeading>
          <LockKeyhole size={42} strokeWidth={1.2} />
        </div>
        <div className="mk-security-grid">
          {[
            {
              icon: LockKeyhole,
              title: "Access with boundaries",
              text: "Server-side role-based access control, tenant-scoped data, and secure sessions.",
            },
            {
              icon: FileCheck2,
              title: "Actions with a record",
              text: "Audit logging provides a traceable history of important program and administrative activity.",
            },
            {
              icon: Fingerprint,
              title: "Simulation with care",
              text: "Hashed simulation tokens, pseudonymized telemetry, and no real credential collection.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={21} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function Integrations() {
  return (
    <section className="mk-section mk-integrations" id="integrations">
      <div className="mk-container">
        <SectionHeading
          eyebrow="YOUR EXISTING WORKFLOW"
          title="Fit awareness into your security stack."
        >
          Use supported identity and email connections today. See what’s
          planned, without the guesswork.
        </SectionHeading>
        <div className="mk-supported">
          <span>
            <Check size={15} />
            <strong>Organization SSO / OIDC</strong>
          </span>
          <span>
            <Check size={15} />
            <strong>Email / SMTP</strong>
          </span>
          <small>Available · Requires deployment configuration</small>
        </div>
        <div className="mk-integration-grid">
          {[
            "Microsoft Entra ID",
            "Microsoft 365",
            "Google Workspace",
            "Microsoft Teams",
            "SCIM",
            "SIEM / Webhooks",
          ].map((name, i) => (
            <div key={name}>
              <span
                className={`mk-integration-mark mk-integration-${i}`}
                aria-hidden="true"
              >
                {i < 2 ? (
                  <span className="mk-ms-mark">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  ["", "", "G", "T", "S", "↗"][i]
                )}
              </span>
              <strong>{name}</strong>
              <span className="mk-planned">Planned</span>
            </div>
          ))}
        </div>
        <p className="mk-integration-note">
          Named connectors and directory sync are not yet available. Planned
          integrations have no committed release date.
        </p>
      </div>
    </section>
  );
}
function Footer({ openDialog }: { openDialog: (kind: DialogKind) => void }) {
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-main">
          <div>
            <Logo />
            <p>
              Human Risk
              <br />
              Intelligence Platform.
            </p>
            <small>Measure Awareness. Understand Risk. Change Behavior.</small>
          </div>
          <div>
            <strong>Product</strong>
            {[
              ["Awareness", "#awareness"],
              ["Campaigns", "#campaigns"],
              ["Learning", "#learning"],
              ["Simulations", "#simulations"],
              ["Reporting", "#reporting"],
            ].map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
          </div>
          <div>
            <strong>Company</strong>
            <a href="#product">About</a>
            <button onClick={() => openDialog("contact")}>Contact</button>
          </div>
          <div>
            <strong>Resources</strong>
            <button onClick={() => openDialog("documentation")}>
              Documentation
            </button>
            <a href="#security">Security</a>
          </div>
          <div>
            <strong>Legal</strong>
            <button onClick={() => openDialog("privacy")}>Privacy</button>
            <button onClick={() => openDialog("terms")}>Terms</button>
          </div>
        </div>
        <div className="mk-footer-bottom">
          <span>© 2026 AVERIS. All rights reserved.</span>
          <span>
            A product by <strong>VulneraX</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
export default function LandingPage() {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const onDemo = () => setDialog("demo");
  return (
    <div className="mk-page">
      <a href="#main-content" className="mk-skip-link">
        Skip to content
      </a>
      <Navbar openDialog={setDialog} />
      <main id="main-content">
        <Hero onDemo={onDemo} />
        <Trust />
        <Problem />
        <IntelligenceLoop />
        <FeatureSection
          id="awareness"
          eyebrow="THE AWARENESS SCORE"
          title="Measure awareness. Keep the evidence clear."
          description="Four signals. One explainable Awareness Score. Understand what employees know, how they respond, and whether your program is making a difference."
          visual={<AwarenessScoreDemo />}
        >
          <CheckList
            items={[
              "Knowledge, behavior, reporting, and improvement",
              "Evidence you can measure and audit",
              "A clear starting point for your next action",
            ]}
          />
          <a className="mk-text-link" href="/methodology">
            See how Awareness Score works
            <ArrowRight size={16} />
          </a>
          <small className="mk-copy-note">
            Missing evidence stays unmeasured. Scores guide learning, not
            employee performance ratings.
          </small>
        </FeatureSection>
        <FeatureSection
          id="human-risk"
          eyebrow="AN EXPLAINABLE HUMAN RISK INDEX"
          title="Understand the risk behind the score."
          description="Awareness tells you what people know and how they respond. Human Risk Index adds verified threat exposure and reviewed business impact to guide your next intervention."
          reverse
          muted
          visual={<RiskMethodPreview />}
        >
          <CheckList
            items={[
              "Threat × vulnerability × impact",
              "Traceable events, clear factor contributions",
              "Missing evidence stays unmeasured",
              "Individual risk visible only to security administrators",
            ]}
          />
          <a className="mk-text-link" href="/risk-methodology">
            Read the Human Risk Index methodology
            <ArrowRight size={16} />
          </a>
          <p className="mk-copy-note">
            Lower Human Risk Index means less observed risk. It is separate from
            Awareness Score, where higher means stronger awareness.
          </p>
        </FeatureSection>
        <AdaptiveStory />
        <StudioStory />
        <FeatureSection
          id="campaigns"
          eyebrow="TAKE THE RIGHT ACTION"
          title="Run awareness programs without an LMS project."
          description="Bring the audience, learning, assessments, and optional simulations into one focused campaign. A simple workflow, from first measurement to follow-up."
          visual={<CampaignPreview />}
        >
          <CheckList
            items={[
              "Choose employees or departments",
              "Configure baseline and follow-up assessments",
              "Schedule learning and reminders",
              "Track progress in one place",
            ]}
          />
        </FeatureSection>
        <FeatureSection
          id="learning"
          eyebrow="LEARNING WITH A PURPOSE"
          title="Short learning. Clear purpose."
          description="Five to ten minutes on a topic that matters. Give employees practical guidance they can use in their next email, meeting, or workday."
          reverse
          muted
          visual={<LearningPreview />}
        >
          <div className="mk-course-list">
            {[
              "Phishing Awareness",
              "Password & Account Security",
              "Social Engineering",
              "Data Protection Basics",
              "Business Email Compromise",
              "Secure Remote Working",
            ].map((name) => (
              <span key={name}>
                <BookOpen size={14} />
                {name}
              </span>
            ))}
          </div>
        </FeatureSection>
        <FeatureSection
          id="simulations"
          eyebrow="PHISHING SIMULATION"
          title="Measure behavior safely."
          description="Run controlled phishing simulations to understand how employees respond. Track clicks and reporting behavior without collecting real employee credentials."
          visual={<SimulationPreview />}
        >
          <CheckList
            items={[
              "Safe tracking and privacy-conscious telemetry",
              "Department-level behavior comparisons",
              "Reporting measured as a positive security habit",
            ]}
          />
        </FeatureSection>
        <CoachStory />
        <FeatureSection
          id="report-phishing"
          eyebrow="RECOGNIZE POSITIVE BEHAVIOR"
          title="Turn reporting into a measurable security habit."
          description="Employees are part of your defense. Give them a clear path to report suspicious messages, then connect reviewed reports to awareness insights."
          reverse
          visual={<ReportingBehaviorPreview />}
        >
          <p className="mk-quiet-callout">
            A report is more than an event.
            <br />
            <strong>It’s a sign that awareness is becoming action.</strong>
          </p>
        </FeatureSection>
        <FeatureSection
          id="employee-experience"
          eyebrow="THE EMPLOYEE EXPERIENCE"
          title="Security awareness employees can actually finish."
          description="One clear next step. A reason to do it. A deadline they can see. Employees get the guidance they need without campaign complexity."
          muted
          visual={<EmployeePreview />}
        >
          <CheckList
            items={[
              "Know what to do and why it matters",
              "Pick up learning where they left off",
              "See their progress and awareness results",
            ]}
          />
        </FeatureSection>
        <section className="mk-section mk-reporting-section" id="reporting">
          <div className="mk-container">
            <div className="mk-centered-heading">
              <SectionHeading
                eyebrow="PROVE IMPROVEMENT"
                title="Prove improvement, not just participation."
              >
                Show management whether awareness improved. Compare baseline and
                follow-up results, connect behavior to learning, and keep each
                metric clear.
              </SectionHeading>
            </div>
            <div className="mk-reporting-layout">
              <div className="mk-reporting-notes">
                <span className="mk-ui-eyebrow">A CLEARER PROGRAM REVIEW</span>
                <h3>
                  What happened.
                  <br />
                  What changed.
                  <br />
                  What comes next.
                </h3>
                <p>
                  Participation, completion, pass rate, and campaign outcomes
                  are distinct measures. AVERIS helps you report them that way.
                </p>
                <div className="mk-output-list">
                  <span>
                    <FileCheck2 size={17} />
                    Executive PDF
                  </span>
                  <span>
                    <Users size={17} />
                    Employee CSV
                  </span>
                  <span>
                    <ClipboardCheck size={17} />
                    Compliance Evidence
                  </span>
                </div>
              </div>
              <ReportPreview onExport={() => setDialog("report")} />
            </div>
          </div>
        </section>
        <FeatureSection
          id="resources"
          eyebrow="EVIDENCE, WITHOUT THE SCRAMBLE"
          title="Evidence when auditors or management ask."
          description="Keep the history behind your program close at hand: campaigns, completion, assessments, certificates, activity logs, and reports."
          reverse
          visual={<EvidencePreview />}
        >
          <p className="mk-copy-note">
            Maintain evidence that supports internal security awareness and
            compliance programs.
          </p>
          <button
            className="mk-text-link"
            onClick={() => setDialog("documentation")}
          >
            Explore the documentation
            <ArrowRight size={16} />
          </button>
        </FeatureSection>
        <AutopilotStory />
        <Roles />
        <Security />
        <Integrations />
        <section className="mk-final-cta" id="contact">
          <div className="mk-container">
            <span className="mk-eyebrow">
              MEASURE AWARENESS. UNDERSTAND RISK. CHANGE BEHAVIOR.
            </span>
            <h2>
              Turn your next security signal
              <br className="mk-desktop-break" /> into a safer decision.
            </h2>
            <p>
              Understand employee awareness, identify human risk,
              <br className="mk-desktop-break" /> and prove whether your program
              is improving.
            </p>
            <div>
              <DemoButton onClick={onDemo} />
              <button
                className="mk-button mk-secondary"
                onClick={() => setDialog("contact")}
              >
                Contact Us
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer openDialog={setDialog} />
      {dialog && (
        <ContactDialog
          key={dialog}
          kind={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
