import { randomUUID } from "node:crypto";

// Editorial training content. These are not AI-generated courses or observed events.
export const COMPETENCIES = [
  [
    "Phishing",
    "Spot an unexpected request",
    "An email says your account will be disabled unless you follow a link immediately.",
    "Unexpected urgency, an unfamiliar sender, and a link outside your usual workflow.",
    "Open the service using a trusted bookmark and report the suspicious message.",
    "Follow the email link because the sender display name looks familiar.",
    "Reply with your password so support can investigate.",
  ],
  [
    "BEC",
    "Verify a payment change",
    "A vendor email requests a new bank account for an invoice that is due today.",
    "A payment change, urgency, and an attempt to bypass the normal approval process.",
    "Call the vendor using the number already on file and follow your payment approval process.",
    "Use the telephone number included in the change request.",
    "Make a small test payment to the new account.",
  ],
  [
    "QR Phishing",
    "Keep sign-in in your trusted workflow",
    "A printed notice asks you to scan a QR code to keep your work account active.",
    "An unexpected QR code moves authentication outside the service you normally use.",
    "Open the service directly and verify the request with your established support channel.",
    "Scan the code and enter a one-time code to check whether it works.",
    "Assume a printed notice is more trustworthy than an email.",
  ],
  [
    "Smishing",
    "Verify unexpected text messages",
    "A text message says a parcel needs a small payment before delivery.",
    "An unexpected payment request and a shortened or unfamiliar web address.",
    "Check the delivery through the carrier’s official app or a trusted address.",
    "Pay the small amount because it is unlikely to matter.",
    "Reply with your work address and identity details.",
  ],
  [
    "Vishing",
    "Verify the caller independently",
    "Someone claiming to be IT calls and asks you to approve a sign-in prompt.",
    "The caller’s identity is unverified and they ask you to approve access you did not initiate.",
    "End the call, decline the request, and contact IT through the known directory.",
    "Approve it because the caller knows your name.",
    "Read a real one-time authentication code to the caller.",
  ],
  [
    "Social Engineering",
    "Slow down a pressured request",
    "An unfamiliar visitor asks you to hold a secure door because their badge is not working.",
    "A story creates social pressure to bypass an access control.",
    "Direct the visitor to reception and follow the organization’s visitor process.",
    "Let them in because challenging the request feels impolite.",
    "Lend them your badge for a few minutes.",
  ],
  [
    "MFA",
    "Approve only the sign-ins you start",
    "Your phone receives repeated authentication prompts while you are not signing in.",
    "Repeated unsolicited prompts may be an attempt to exhaust your attention.",
    "Deny the prompts and report them through your organization’s security process.",
    "Approve one prompt to stop the notifications.",
    "Disable MFA until the prompts stop.",
  ],
  [
    "Passkeys",
    "Protect account recovery as carefully as sign-in",
    "An unexpected support message asks you to remove your passkey and enroll a replacement.",
    "A request changes your authentication method without a verified support workflow.",
    "Use the official account settings and verify the support request independently.",
    "Remove the passkey through the link in the message.",
    "Share your device unlock code with the support caller.",
  ],
  [
    "Device Code Phishing",
    "Do not authorize a device you did not initiate",
    "A chat message supplies a device code and asks you to enter it on a familiar login page.",
    "A legitimate login page can still authorize an attacker’s device when you use their code.",
    "Only enter a device code from a workflow you started on a device you control.",
    "Enter the code because the login page is genuine.",
    "Ask the sender for another code and try again.",
  ],
  [
    "OAuth Consent",
    "Check what an app is asking to access",
    "A document link asks you to approve an unfamiliar app with access to your mailbox.",
    "The requested permissions exceed the task and the app has not been approved.",
    "Cancel and ask your organization’s approved-app process to review the request.",
    "Approve because the authorization screen belongs to a trusted provider.",
    "Try it with a colleague’s account instead.",
  ],
  [
    "Password Security",
    "Use unique credentials and approved storage",
    "A work service asks you to create a new password. You already have a strong personal password.",
    "Reusing a password connects otherwise separate accounts to a single breach.",
    "Create a unique password with the approved password manager, or use a supported passkey.",
    "Reuse the personal password with a work-related suffix.",
    "Store the password in a shared team document.",
  ],
  [
    "Data Protection",
    "Check the recipient and the purpose",
    "You are about to send an employee spreadsheet to an external recipient.",
    "The file may contain personal data that the recipient does not need.",
    "Confirm the purpose and recipient, minimize the data, and use an approved sharing method.",
    "Send the full file so the recipient can decide what is useful.",
    "Upload the spreadsheet to a public file-sharing link.",
  ],
  [
    "AI Security",
    "Use approved AI with appropriate data",
    "A public AI tool could summarize a confidential customer document for a meeting.",
    "The tool may process or retain sensitive information outside approved controls.",
    "Use an approved tool and check the data-handling policy before sharing information.",
    "Upload the document because you are only asking for a summary.",
    "Remove the filename but leave all customer details in the document.",
  ],
  [
    "Shadow AI",
    "Check approval before connecting a new tool",
    "A browser extension offers AI meeting notes and asks for access to all work documents.",
    "An unapproved tool requests broad ongoing access to organizational information.",
    "Check the approved-tool list and request a review before connecting it.",
    "Connect it using a personal account to bypass work restrictions.",
    "Approve all permissions and uninstall it after the meeting.",
  ],
  [
    "Secure Collaboration",
    "Share with the smallest necessary audience",
    "A teammate asks for a document and the sharing dialog defaults to anyone with the link.",
    "Link access can extend beyond the intended people and persist after the task.",
    "Select named recipients, use the minimum permission, and set an expiry when appropriate.",
    "Use the public link because the teammate needs quick access.",
    "Post the link in an external community for convenience.",
  ],
  [
    "Remote Work",
    "Keep work in an approved environment",
    "While traveling, you need to review a sensitive document on a shared computer.",
    "A shared device may retain files, sessions, or keystrokes outside your control.",
    "Use your managed device and the approved remote-access process.",
    "Use private browsing on the shared computer and assume it leaves no traces.",
    "Download the document to the shared desktop and delete it later.",
  ],
  [
    "Secure Browsing",
    "Treat unexpected browser instructions cautiously",
    "A web page says your browser is broken and asks you to paste a command into a system prompt.",
    "A website is asking you to run code outside the browser to solve an unexpected problem.",
    "Close the page and use your known IT support channel if help is needed.",
    "Paste the command because the page claims to be a security check.",
    "Disable browser protections and reload the page.",
  ],
  [
    "Malware",
    "Handle unexpected attachments safely",
    "An unexpected attachment asks you to enable active content to see an invoice.",
    "The document asks for extra execution permissions to reveal ordinary information.",
    "Do not enable active content; verify the sender independently and report the message.",
    "Enable it because invoices often require extra software.",
    "Forward the attachment to coworkers to see whether it opens for them.",
  ],
  [
    "Ransomware",
    "Report unusual device behavior promptly",
    "Your managed laptop shows unexpected file changes and an unfamiliar ransom notice.",
    "Sudden file changes and a demand for payment need an immediate security response.",
    "Follow your incident process and contact security promptly using a trusted channel.",
    "Pay the demand yourself to avoid bothering the security team.",
    "Experiment with unknown recovery tools found in online comments.",
  ],
  [
    "Incident Reporting",
    "Report early, even when you are unsure",
    "You followed a suspicious link and are unsure whether any information was exposed.",
    "Security needs timely context; waiting for certainty can delay the response.",
    "Report what happened promptly and preserve the details without forwarding unsafe content.",
    "Wait for proof of harm before telling anyone.",
    "Delete the message and avoid mentioning the interaction.",
  ],
  [
    "Insider Risk Awareness",
    "Handle concerning access through the right process",
    "A colleague asks for your credentials to finish a task they cannot access.",
    "Sharing credentials bypasses authorization and makes actions difficult to attribute.",
    "Keep account access private and help the requester obtain their own authorized access.",
    "Share the password temporarily because they are a colleague.",
    "Approve access using your identity while they perform the task.",
  ],
  [
    "Secure Development",
    "Keep secrets out of source control",
    "You notice an access token in a commit that has already been pushed.",
    "Removing the current file does not remove the secret from repository history or copies.",
    "Report the exposure, revoke or rotate the token, and follow the secret-removal process.",
    "Delete the line and assume the token is now safe.",
    "Move the token into a less obvious filename in the same repository.",
  ],
  [
    "Vendor Risk",
    "Verify access before helping a supplier",
    "A supplier requests temporary access to a shared workspace outside the agreed project scope.",
    "The request changes access and purpose beyond an established agreement.",
    "Verify the request with the project owner and follow the approved vendor-access process.",
    "Grant access because the supplier is already known to the organization.",
    "Give the supplier a colleague’s existing account.",
  ],
  [
    "Executive Security",
    "Verify urgent requests regardless of apparent identity",
    "A convincing voice message appears to come from an executive and requests a confidential transfer.",
    "Familiar voice or video is not proof of authorization; the request bypasses normal verification.",
    "Verify through a known independent channel and preserve the normal approval controls.",
    "Approve because the voice sounds exactly like the executive.",
    "Focus only on whether the recording has obvious visual or audio artifacts.",
  ],
];
export function competency(topic) {
  return COMPETENCIES.find((c) => c[0] === topic) || COMPETENCIES[0];
}
export function courseDocument(topic, language = "en") {
  const [name, objective, scenario, indicators, action, wrong1, wrong2] =
    competency(topic);
  return {
    title: name === "Phishing" ? "Phishing Recognition" : name,
    category: name,
    description:
      objective + ". Practice a realistic decision and know what to do next.",
    duration: name === "BEC" || name === "Executive Security" ? 6 : 4,
    difficulty: "Foundation",
    language,
    passingScore: 80,
    maxAttempts: 3,
    retryMinutes: 5,
    lessons: [
      {
        title: objective,
        kind: "Scenario",
        content: `${scenario}\n\nPause and consider the request. The important signals are: ${indicators}`,
      },
      {
        title: "Choose a safer next step",
        kind: "Article",
        content: `${action}\n\nA familiar name, convincing message, or urgent deadline does not replace independent verification. Use the contact details and tools you already trust.`,
      },
      {
        title: "Build the habit",
        kind: "Checklist",
        content: `1. Pause when a request is unexpected.\n2. Check the context and authorization.\n3. ${action}\n4. Report concerns through your organization’s process.\n\nIf you already interacted, report promptly. You are helping the security team respond.`,
      },
    ],
    questions: [
      {
        prompt: `${scenario} What is the safest next step?`,
        type: "scenario",
        options: [wrong1, action, wrong2],
        correct: [1],
        explanation: `${action} ${indicators}`,
      },
      {
        prompt: `Which detail in this ${name.toLowerCase()} scenario deserves attention?`,
        type: "choice",
        options: [
          indicators,
          "The request uses a professional tone, which guarantees it is authorized.",
          "The request arrived during working hours, so it cannot be suspicious.",
        ],
        correct: [0],
        explanation:
          "Context and authorization matter more than a polished appearance or familiar timing.",
      },
      {
        prompt:
          "You acted on the request before recognizing the concern. What should you do now?",
        type: "choice",
        options: [
          "Wait to see whether anyone else notices.",
          "Delete the evidence and continue working.",
          "Report promptly through your organization’s process and explain what happened.",
        ],
        correct: [2],
        explanation:
          "A timely, accurate report helps the security team assess the situation and respond. Reporting is positive behavior.",
      },
    ],
  };
}
export function coachingContent(topic, positive = false) {
  const [, objective, scenario, indicators, action] = competency(topic);
  return {
    title: positive
      ? "Good call. Keep that habit."
      : `A moment to practice ${topic.toLowerCase()}.`,
    seconds: 45,
    objective,
    scenario,
    signals: indicators.split(", ").slice(0, 3),
    nextTime: action,
    message: positive
      ? "Reporting and independent verification help your team respond sooner."
      : "This is a learning moment, not a performance judgment. Pause, verify, and ask for help when something feels wrong.",
  };
}
export function simulationDocument(
  topic,
  difficulty = 2,
  channel = "Email",
  context = "",
) {
  const [, objective, scenario, indicators, action] = competency(topic);
  return {
    title: `${topic} practice`,
    topic,
    channel,
    difficulty,
    emotionalTrigger: "Urgency",
    context: context || "A routine workplace request",
    objective,
    subject: `Practice: ${objective}`,
    message:
      difficulty <= 3
        ? `${scenario} Pause before acting: what can you verify independently?`
        : difficulty <= 6
          ? `${scenario} The sender uses familiar workplace terminology and says the usual contact is unavailable. A response is expected before the next meeting.`
          : `${scenario} The request references a genuine project and includes details already familiar to your team. It appears within an ongoing conversation, but the requested change has not been verified through your established process. A colleague says the matter is time-sensitive.`,
    indicators: indicators.split(", ").map((s) => s.replace(/\.$/, "")),
    safeAction: action,
    difficultyFactors: [
      { factor: "Workplace familiarity", value: Math.min(10, difficulty + 1) },
      { factor: "Ambiguity of indicators", value: difficulty },
      {
        factor: "Pressure to bypass verification",
        value: Math.max(1, difficulty - 1),
      },
    ],
    safety:
      "Controlled scenario. No credentials, malware, real MFA codes, or external authorization are requested.",
  };
}
export function seedCatalog(db) {
  const stamp = new Date().toISOString();
  for (const org of db.prepare("SELECT id FROM organizations").all()) {
    for (const [topic] of COMPETENCIES) {
      const key = `averis-v2:${topic.toLowerCase().replaceAll(" ", "-")}`;
      if (
        db
          .prepare(
            "SELECT 1 FROM course_revisions WHERE organization_id=? AND course_id=?",
          )
          .get(org.id, key)
      )
        continue;
      db.prepare(
        "INSERT INTO course_revisions(id,organization_id,course_id,version,status,document_json,created_at) VALUES (?,?,?,1,'Published',?,?)",
      ).run(
        randomUUID(),
        org.id,
        key,
        JSON.stringify(courseDocument(topic)),
        stamp,
      );
    }
  }
}
