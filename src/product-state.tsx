import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed';

export interface Campaign {
  id: string;
  name: string;
  audience: string;
  employees: number;
  status: CampaignStatus;
  completion: number;
  score: number | null;
  baseline: number | null;
  schedule: string;
  learning: string[];
  assessment: string;
  simulation?: string;
}

interface NotificationRecord {
  id: string;
  type: string;
  message: string;
  status: 'Sent' | 'Delivered' | 'Opened';
  date: string;
}

export interface LearningAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  audience: string;
  employees: number;
  dueDate: string;
  createdAt: string;
  status: 'Assigned' | 'Completed';
}

interface ProductState {
  employeeScore: number;
  previousEmployeeScore: number;
  organizationScore: number;
  previousOrganizationScore: number;
  quizCompleted: boolean;
  phishingReports: number;
  campaigns: Campaign[];
  notifications: NotificationRecord[];
  assignments: LearningAssignment[];
  scoreSignals: { knowledge: number; behavior: number; reporting: number; improvement: number };
  assessmentResult: number | null;
}

interface ProductContextValue extends ProductState {
  completePhishingQuiz: () => void;
  reportPhishing: () => void;
  createCampaign: (campaign: Omit<Campaign, 'id'>) => string;
  updateCampaignStatus: (id: string, status: CampaignStatus) => void;
  assignLearning: (assignment: Omit<LearningAssignment, 'id' | 'createdAt' | 'status'>) => void;
  completeAssessment: (score: number) => void;
  resetDemo: () => void;
}

const initialState: ProductState = {
  employeeScore: 72,
  previousEmployeeScore: 64,
  organizationScore: 78,
  previousOrganizationScore: 72,
  quizCompleted: false,
  phishingReports: 61,
  campaigns: [
    { id: 'q3-2026', name: 'Q3 Security Awareness 2026', audience: 'All employees', employees: 200, status: 'Active', completion: 82, score: 78, baseline: 64, schedule: 'Jul 1 – Sep 30, 2026', learning: ['Phishing Awareness', 'Password & Account Security'], assessment: 'Q3 Awareness Assessment', simulation: 'Password Expiration' },
    { id: 'finance-phishing', name: 'Finance Phishing Focus', audience: 'Finance', employees: 32, status: 'Scheduled', completion: 0, score: null, baseline: 58, schedule: 'Sep 15 – Sep 29, 2026', learning: ['Phishing Awareness'], assessment: 'Phishing Follow-up Assessment', simulation: 'Password Expiration' },
    { id: 'q2-2026', name: 'Q2 Security Awareness 2026', audience: 'All employees', employees: 200, status: 'Completed', completion: 91, score: 72, baseline: 61, schedule: 'Apr 1 – Jun 30, 2026', learning: ['Social Engineering', 'Data Protection Basics'], assessment: 'Q2 Awareness Assessment' },
    { id: 'q1-2026', name: 'Q1 Security Awareness 2026', audience: 'All employees', employees: 194, status: 'Completed', completion: 88, score: 69, baseline: 59, schedule: 'Jan 1 – Mar 31, 2026', learning: ['Safe Browsing & Device Security'], assessment: 'Q1 Awareness Assessment' },
  ],
  notifications: [
    { id: 'n1', type: 'Assignment', message: 'Phishing Awareness assigned to Finance', status: 'Delivered', date: 'Aug 28, 2026 · 09:42' },
    { id: 'n2', type: 'Reminder', message: 'Q3 learning due-date reminder', status: 'Opened', date: 'Aug 27, 2026 · 08:00' },
    { id: 'n3', type: 'Admin summary', message: 'Weekly human-risk summary', status: 'Delivered', date: 'Aug 25, 2026 · 08:00' },
  ],
  assignments: [
    { id:'a1', courseId:'phishing-awareness', courseTitle:'Phishing Awareness', audience:'All employees', employees:200, dueDate:'Sep 15, 2026', createdAt:'Aug 20, 2026 · 09:00', status:'Assigned' },
    { id:'a2', courseId:'password-account-security', courseTitle:'Password & Account Security', audience:'All employees', employees:200, dueDate:'Aug 10, 2026', createdAt:'Jul 25, 2026 · 10:30', status:'Completed' },
  ],
  scoreSignals: { knowledge:81, behavior:74, reporting:76, improvement:83 },
  assessmentResult: null,
};

const STORAGE_KEY = 'averis-product-state-v1';
const ProductContext = createContext<ProductContextValue | null>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);

  const value = useMemo<ProductContextValue>(() => ({
    ...state,
    completePhishingQuiz: () => setState((current) => {
      if (current.quizCompleted) return current;
      return {
        ...current,
        quizCompleted: true,
        employeeScore: 78,
        organizationScore: 79,
        campaigns: current.campaigns.map((campaign) => campaign.id === 'q3-2026' ? { ...campaign, completion: 83, score: 79 } : campaign),
        notifications: [{ id: `n-${Date.now()}`, type: 'Certificate', message: 'Phishing Awareness certificate issued to Andini Putri', status: 'Delivered', date: 'Aug 28, 2026 · 10:18' }, ...current.notifications],
      };
    }),
    reportPhishing: () => setState((current) => ({
      ...current,
      phishingReports: current.phishingReports + 1,
      employeeScore: Math.min(100, current.employeeScore + (current.employeeScore < 79 ? 1 : 0)),
      notifications: [{ id: `n-${Date.now()}`, type: 'Behavior signal', message: 'Andini reported a suspicious message', status: 'Delivered', date: 'Aug 28, 2026 · 10:22' }, ...current.notifications],
    })),
    createCampaign: (campaign) => {
      const id = `${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
      setState((current) => ({ ...current, campaigns: [{ ...campaign, id }, ...current.campaigns] }));
      return id;
    },
    updateCampaignStatus: (id,status) => setState((current)=>({ ...current, campaigns:current.campaigns.map(item=>item.id===id?{...item,status}:item) })),
    assignLearning: (assignment) => setState((current) => ({
      ...current,
      assignments: [{ ...assignment, id:`a-${Date.now()}`, createdAt:'Aug 29, 2026 · 09:00', status:'Assigned' }, ...current.assignments],
      notifications: [{ id:`n-${Date.now()}`, type:'Assignment', message:`${assignment.courseTitle} assigned to ${assignment.audience}`, status:'Delivered', date:'Aug 29, 2026 · 09:00' }, ...current.notifications],
    })),
    completeAssessment: (score) => setState((current)=>{
      const signals={...current.scoreSignals,knowledge:score,improvement:Math.min(100,current.scoreSignals.improvement+3)};
      const organizationScore=Math.round(signals.knowledge*.35+signals.behavior*.30+signals.reporting*.20+signals.improvement*.15);
      return {...current,assessmentResult:score,scoreSignals:signals,organizationScore,notifications:[{id:`n-${Date.now()}`,type:'Assessment',message:`Andini menyelesaikan asesmen baseline dengan skor ${score}`,status:'Delivered',date:'29 Agu 2026 · 10.00'},...current.notifications]};
    }),
    resetDemo: () => setState(initialState),
  }), [state]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProduct must be used inside ProductProvider');
  return context;
}
