export const courseCatalog = [
  { id: 'phishing-awareness', title: 'Phishing Awareness' },
  { id: 'password-account-security', title: 'Password & Account Security' },
  { id: 'social-engineering', title: 'Social Engineering' },
  { id: 'data-protection-basics', title: 'Data Protection Basics' },
  { id: 'safe-browsing-device-security', title: 'Safe Browsing & Device Security' },
  { id: 'business-email-compromise', title: 'Business Email Compromise' },
  { id: 'secure-remote-working', title: 'Secure Remote Working' },
];

export function createInitialProductState() {
  return {
    employeeScore: 72,
    previousEmployeeScore: 64,
    organizationScore: 78,
    previousOrganizationScore: 72,
    quizCompleted: false,
    phishingReports: 61,
    campaigns: [
      {
        id: 'q3-2026', name: 'Q3 Security Awareness 2026',
        objective: 'Reduce phishing and account-security risk.', owner: 'Syarif Rahman',
        audience: 'All employees', employees: 200, status: 'Active', completion: 82,
        score: 78, baseline: 64, schedule: 'Jul 1 – Sep 30, 2026',
        learning: ['Phishing Awareness', 'Password & Account Security'],
        assessment: 'Baseline + Follow-up', simulation: 'Password Expiration',
        baselineEnabled: true, followUpEnabled: true, learningDueDate: 'Sep 15, 2026',
        endDate: 'Sep 30, 2026',
      },
      {
        id: 'finance-phishing', name: 'Finance Phishing Focus',
        objective: 'Improve phishing decisions in Finance.', owner: 'Syarif Rahman',
        audience: 'Finance', employees: 32, status: 'Scheduled', completion: 0,
        score: null, baseline: 58, schedule: 'Sep 15 – Sep 29, 2026',
        learning: ['Phishing Awareness'], assessment: 'Follow-up',
        simulation: 'Shared Document Invitation', baselineEnabled: false,
        followUpEnabled: true, learningDueDate: 'Sep 24, 2026', endDate: 'Sep 29, 2026',
      },
      {
        id: 'q2-2026', name: 'Q2 Security Awareness 2026', audience: 'All employees',
        employees: 200, status: 'Completed', completion: 91, score: 72, baseline: 61,
        schedule: 'Apr 1 – Jun 30, 2026',
        learning: ['Social Engineering', 'Data Protection Basics'],
        assessment: 'Baseline + Follow-up', baselineEnabled: true, followUpEnabled: true,
      },
    ],
    notifications: [
      {
        id: 'n1', type: 'Assignment',
        message: 'Phishing Awareness ditugaskan kepada Andini Putri',
        status: 'Delivered', date: 'Aug 28, 2026 · 09:42',
      },
    ],
    assignments: [
      {
        id: 'a1', campaignId: 'q3-2026', courseId: 'phishing-awareness',
        courseTitle: 'Phishing Awareness', audience: 'All employees', employees: 200,
        dueDate: 'Sep 15, 2026', createdAt: 'Aug 20, 2026 · 09:00', required: true,
        progress: 0, status: 'Not Started',
      },
      {
        id: 'a2', campaignId: 'q3-2026', courseId: 'password-account-security',
        courseTitle: 'Password & Account Security', audience: 'All employees', employees: 200,
        dueDate: 'Sep 15, 2026', createdAt: 'Aug 20, 2026 · 09:00', required: true,
        progress: 100, status: 'Completed', quizScore: 88,
      },
    ],
    assessments: [
      {
        id: 'as-q3-baseline', campaignId: 'q3-2026', type: 'Baseline',
        title: 'Assessment Awal Q3', status: 'Completed', dueDate: 'Aug 15, 2026', score: 64,
      },
      {
        id: 'as-q3-followup', campaignId: 'q3-2026', type: 'Follow-up',
        title: 'Assessment Tindak Lanjut Q3', status: 'Locked', dueDate: 'Sep 22, 2026',
      },
    ],
    certificates: [
      {
        id: 'AVERIS-2026-ANDINI-PASSWORD-ACCOUNT-SECURITY',
        courseId: 'password-account-security', courseTitle: 'Password & Account Security',
        employeeName: 'Andini Putri', score: 88, issuedAt: 'Aug 10, 2026', status: 'Issued',
      },
    ],
    simulations: [
      {
        id: 'sim-q3', campaignId: 'q3-2026', template: 'Password Expiration',
        status: 'Scheduled', delivered: 0, opened: 0, clicked: 0,
        credentialAttempted: 0, reported: 0, noAction: 0,
      },
    ],
    quizAttempts: [],
    events: [],
    scoreSignals: { knowledge: 81, behavior: 74, reporting: 76, improvement: 83 },
    assessmentResult: 64,
  };
}
