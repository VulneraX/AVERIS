import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { AppShell, Brand, Button } from './components';
import {
  AdminOverview, AwarenessPage, CourseDetailAdmin, EmployeeDetailPage,
  EmployeesPage, LearningLibrary, ReportDetail, ReportsPage,
} from './AdminPages';
import {
  AnswerReview, BaselineAssessment, CertificateDetail, CertificatesPage, EmployeeAwareness,
  EmployeeHome, LearningContent, MyLearningPage, QuizPage, QuizResult,
} from './EmployeePages';
import type { Role } from './types';
import { currentLanguage, switchLanguage } from './i18n';
import { CampaignBuilderPage, CampaignDetailPage, CampaignsPage, IntegrationsPage, OverviewPage, ScoreMethodologyPage, SettingsPage } from './ProductPages';

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const login = () => {
    setLoading(true);
    window.setTimeout(() => navigate(role === 'admin' ? '/admin' : '/employee'), 550);
  };
  return <div className="login-page">
    <section className="login-brand-panel">
      <div className="login-brand-top"><Brand /><span>Security Awareness &amp; Human Risk Platform</span></div>
      <div className="login-story">
        <span className="login-eyebrow"><ShieldCheck size={16}/> Visibility into human risk</span>
        <h1>Measure Awareness.<br/><span>Reduce Human Risk.</span></h1>
        <p>Measure understanding, identify weak areas, and improve your organization’s security habits over time.</p>
        <div className="story-points">
          <div><span><Check size={16}/></span><p><strong>Measure what matters</strong><small>Go beyond training completion with Awareness Scores.</small></p></div>
          <div><span><Check size={16}/></span><p><strong>Act on weak areas</strong><small>Focus learning where human security risk is highest.</small></p></div>
          <div><span><Check size={16}/></span><p><strong>Show improvement</strong><small>Track awareness progress across every cycle.</small></p></div>
        </div>
      </div>
      <p className="login-quote">AVERIS makes human security risk visible and measurable. <span>by VulneraX</span></p>
      <div className="brand-orbit orbit-one"/><div className="brand-orbit orbit-two"/><div className="brand-grid"/>
    </section>
    <main className="login-form-panel">
      <div className="mobile-login-brand"><Brand/></div>
      <div className="login-language"><span>Language</span><div className="language-switch"><button className={currentLanguage()==='en'?'active':''} onClick={()=>switchLanguage('en')}>EN</button><button className={currentLanguage()==='id'?'active':''} onClick={()=>switchLanguage('id')}>ID</button></div></div>
      <form className="login-form" onSubmit={(e)=>{e.preventDefault();login()}}>
        <span className="eyebrow">Welcome to AVERIS</span>
        <h2>Sign in to your account</h2>
        <p>Use your work account to continue.</p>
        <div className="demo-switch"><button type="button" className={role==='admin'?'active':''} onClick={()=>setRole('admin')}><span>Admin view</span><small>Manage organization risk</small></button><button type="button" className={role==='employee'?'active':''} onClick={()=>setRole('employee')}><span>Employee view</span><small>Complete assigned learning</small></button></div>
        <label className="login-field"><span>Work email</span><div><Mail size={18}/><input type="email" value={role==='admin'?'admin@acme.co.id':'andini@acme.co.id'} readOnly/></div></label>
        <label className="login-field"><span>Password</span><div><LockKeyhole size={18}/><input type={showPassword?'text':'password'} defaultValue="password123"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <div className="login-options"><label><input type="checkbox"/>Remember me</label><button type="button" onClick={()=>setNotice('Password recovery instructions would be sent to your work email.')}>Forgot password?</button></div>
        {notice && <p className="login-inline-notice" role="status">{notice}</p>}
        <Button type="submit" disabled={loading} className="login-button">{loading?<span className="spinner"/>:<>{role==='admin'?'Sign in as Admin':'Sign in as Andini'}<ArrowRight size={18}/></>}</Button>
        <p className="login-help">Contact your administrator if you cannot access your account.</p>
      </form>
      <footer>Protected by ACME Indonesia security policies · <button onClick={()=>setNotice('Privacy settings are managed by ACME Indonesia.')}>Privacy</button></footer>
    </main>
  </div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) { return <AppShell role="admin">{children}</AppShell>; }
function EmployeeRoute({ children }: { children: React.ReactNode }) { return <AppShell role="employee">{children}</AppShell>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<LoginPage/>}/>
    <Route path="/admin" element={<AdminRoute><OverviewPage/></AdminRoute>}/>
    <Route path="/admin/employees" element={<AdminRoute><EmployeesPage/></AdminRoute>}/>
    <Route path="/admin/employees/:employeeId" element={<AdminRoute><EmployeeDetailPage/></AdminRoute>}/>
    <Route path="/admin/campaigns" element={<AdminRoute><CampaignsPage/></AdminRoute>}/>
    <Route path="/admin/campaigns/new" element={<AdminRoute><CampaignBuilderPage/></AdminRoute>}/>
    <Route path="/admin/campaigns/:campaignId" element={<AdminRoute><CampaignDetailPage/></AdminRoute>}/>
    <Route path="/admin/learning" element={<AdminRoute><LearningLibrary/></AdminRoute>}/>
    <Route path="/admin/learning/:courseId" element={<AdminRoute><CourseDetailAdmin/></AdminRoute>}/>
    <Route path="/admin/awareness" element={<AdminRoute><AwarenessPage/></AdminRoute>}/>
    <Route path="/admin/awareness/methodology" element={<AdminRoute><ScoreMethodologyPage/></AdminRoute>}/>
    <Route path="/admin/simulations" element={<Navigate to="/admin/campaigns" replace/>}/>
    <Route path="/admin/integrations" element={<AdminRoute><IntegrationsPage/></AdminRoute>}/>
    <Route path="/admin/settings" element={<AdminRoute><SettingsPage/></AdminRoute>}/>
    <Route path="/admin/reports" element={<AdminRoute><ReportsPage/></AdminRoute>}/>
    <Route path="/admin/reports/:reportId" element={<AdminRoute><ReportDetail/></AdminRoute>}/>
    <Route path="/employee" element={<EmployeeRoute><EmployeeHome/></EmployeeRoute>}/>
    <Route path="/employee/learning" element={<EmployeeRoute><MyLearningPage/></EmployeeRoute>}/>
    <Route path="/employee/learning/:courseId" element={<LearningContent/>}/>
    <Route path="/employee/quiz/:courseId" element={<QuizPage/>}/>
    <Route path="/employee/quiz/:courseId/result" element={<QuizResult/>}/>
    <Route path="/employee/quiz/:courseId/review" element={<EmployeeRoute><AnswerReview/></EmployeeRoute>}/>
    <Route path="/employee/awareness" element={<EmployeeRoute><EmployeeAwareness/></EmployeeRoute>}/>
    <Route path="/employee/assessment/baseline" element={<BaselineAssessment/>}/>
    <Route path="/employee/certificates" element={<EmployeeRoute><CertificatesPage/></EmployeeRoute>}/>
    <Route path="/employee/certificates/:courseId" element={<EmployeeRoute><CertificateDetail/></EmployeeRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
