import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check,
  ChevronDown, ClipboardCheck, Clock3, Download, FileChartColumn, Filter,
  KeyRound, MailWarning, MoreHorizontal, Plus, Search, Send, ShieldCheck,
  SlidersHorizontal, Target, TrendingDown, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { awarenessTrend, courses, departments, employees, scoreLevel, topics } from './data';
import {
  Avatar, AverisMark, BackButton, Button, InsightBanner, PageHeader, ProgressBar, ScoreBadge,
  SearchBox, SectionHeader, StatusBadge, Toast, TopicBar,
} from './components';
import { useProduct } from './product-state';

const iconMap = { mail: MailWarning, key: KeyRound, users: Users, database: ShieldCheck, shield: ShieldCheck };

export function AdminOverview() {
  const navigate = useNavigate();
  return <>
    <PageHeader eyebrow="ACME Indonesia  /  Current cycle" title="Security Awareness Overview" subtitle="Monitor employee awareness and identify human security risks across your organization." actions={<div className="updated-copy"><span className="live-dot" /> Last updated 2 hours ago</div>} />
    <div className="kpi-grid">
      <article className="kpi-card dominant">
        <div className="kpi-label"><span>Organization Awareness Score</span><span className="metric-icon"><ShieldCheck size={19} /></span></div>
        <div className="score-value">78 <small>/ 100</small></div>
        <div className="kpi-foot"><ScoreBadge score={78} /><span className="positive"><TrendingUp size={15} /> 6 points</span><span>vs previous cycle</span></div>
      </article>
      <article className="kpi-card">
        <div className="kpi-label"><span>Training Completion</span><span className="metric-icon soft"><ClipboardCheck size={19} /></span></div>
        <div className="score-value">82<small>%</small></div>
        <ProgressBar value={82} />
        <p><strong>164</strong> of 200 employees completed</p>
      </article>
      <article className="kpi-card">
        <div className="kpi-label"><span>Average Quiz Score</span><span className="metric-icon soft"><Target size={19} /></span></div>
        <div className="score-value">81</div>
        <div className="kpi-foot"><span className="positive"><TrendingUp size={15} /> 4 points</span><span>vs previous cycle</span></div>
      </article>
      <article className="kpi-card warning-card">
        <div className="kpi-label"><span>Employees Needing Attention</span><span className="metric-icon amber"><AlertCircle size={19} /></span></div>
        <div className="score-value">18</div>
        <p><strong>9%</strong> of workforce may benefit from additional learning</p>
        <button className="text-link" onClick={() => navigate('/admin/employees')}>Review employees <ArrowRight size={15} /></button>
      </article>
    </div>
    <InsightBanner action={<Button variant="secondary" onClick={() => navigate('/admin/learning/phishing-awareness')}>Assign phishing training</Button>}>
      <strong>Phishing remains your weakest awareness topic.</strong>
      <p>At 62/100, it is 16 points below your organization’s overall score.</p>
    </InsightBanner>
    <div className="dashboard-grid">
      <article className="panel trend-panel">
        <SectionHeader title="Awareness Score Trend" subtitle="Organization average across active assessments" action={<select aria-label="Chart period"><option>Last 4 months</option></select>} />
        <div className="chart-summary"><strong>78</strong><span><TrendingUp size={14} /> 16% improvement</span></div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={awarenessTrend} margin={{ top: 12, right: 16, bottom: 0, left: -22 }}>
            <defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DE1A34" stopOpacity={0.2}/><stop offset="100%" stopColor="#DE1A34" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke="#e8edf5" vertical={false} strokeDasharray="4 4" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#78869d', fontSize: 12 }} />
            <YAxis domain={[60, 85]} axisLine={false} tickLine={false} tick={{ fill: '#78869d', fontSize: 12 }} />
            <Tooltip contentStyle={{ border: '1px solid #dce3ee', borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }} />
            <Area type="monotone" dataKey="score" stroke="#DE1A34" strokeWidth={2.5} fill="url(#scoreFill)" activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </article>
      <article className="panel topics-panel">
        <SectionHeader title="Awareness by Topic" subtitle="Current cycle performance" action={<button className="text-link" onClick={() => navigate('/admin/awareness')}>View details <ArrowRight size={15} /></button>} />
        <div className="topic-list">{topics.map((topic, i) => <TopicBar key={topic.name} name={topic.name} score={topic.score} note={i === 0 ? 'Lowest awareness topic' : undefined} />)}</div>
      </article>
    </div>
    <div className="dashboard-grid lower">
      <article className="panel table-panel attention-panel">
        <SectionHeader title="Employees Needing Attention" subtitle="Prioritized by awareness score and recent activity" action={<button className="text-link" onClick={() => navigate('/admin/employees')}>View all employees <ArrowRight size={15} /></button>} />
        <div className="table-scroll"><table><thead><tr><th>Employee</th><th>Department</th><th>Awareness</th><th>Weakest topic</th><th>Training</th><th></th></tr></thead><tbody>
          {employees.slice(0,4).map((employee) => <tr key={employee.id} onClick={() => navigate(`/admin/employees/${employee.id}`)}><td><div className="employee-cell"><Avatar name={employee.name} size="sm" /><span><strong>{employee.name}</strong><small>{employee.email}</small></span></div></td><td>{employee.department}</td><td><div className="score-inline"><strong>{employee.score}</strong><ScoreBadge score={employee.score} /></div></td><td>{employee.weakest}</td><td><StatusBadge status={employee.status} /></td><td><button className="row-action" aria-label={`View ${employee.name}`}><ArrowRight size={17} /></button></td></tr>)}
        </tbody></table></div>
      </article>
      <article className="panel activity-panel">
        <SectionHeader title="Recent Activity" subtitle="Across ACME Indonesia" />
        <div className="activity-list">
          {[['AP','Andini completed Phishing Awareness','12 min ago','complete'],['RR','Rizky scored 88 on Password Security','1 hr ago','score'],['FI','Finance reached 81% completion','3 hrs ago','team'],['15','15 employees were assigned Social Engineering Basics','Yesterday','assign']].map(([avatar,text,time,type]) => <div className="activity" key={text}><span className={`activity-icon ${type}`}>{avatar}</span><div><strong>{text}</strong><small>{time}</small></div></div>)}
        </div>
      </article>
    </div>
  </>;
}

export function EmployeesPage() {
  const navigate = useNavigate();
  const { employeeScore } = useProduct();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [riskFilter,setRiskFilter]=useState(false);
  const filtered = useMemo(() => employees.map((employee)=>employee.id==='andini-putri'?{...employee,score:employeeScore}:employee).filter((employee) => (employee.name.toLowerCase().includes(query.toLowerCase()) || employee.email.includes(query.toLowerCase())) && (department === 'All departments' || employee.department === department) && (!riskFilter || employee.score < 70)), [query, department, employeeScore, riskFilter]);
  const exportEmployees = () => { const csv=['Name,Email,Department,Awareness Score',...filtered.map(item=>`${item.name},${item.email},${item.department},${item.score}`)].join('\n'); const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); const link=document.createElement('a'); link.href=url; link.download='averis-employees.csv'; link.click(); URL.revokeObjectURL(url); };
  return <>
    <PageHeader title="Employees" subtitle="Monitor awareness and assign targeted learning to your workforce." actions={<><Button variant="secondary" onClick={exportEmployees}><ArrowDownToLine size={17} /> Export</Button><Button onClick={() => navigate('/admin/learning?assign=1')}><UserPlus size={17} /> Assign learning</Button></>} />
    <div className="summary-strip"><div><span>Total employees</span><strong>200</strong></div><div><span>Completed</span><strong>164</strong></div><div><span>In progress</span><strong>21</strong></div><div><span>Not started</span><strong>15</strong></div><div><span>Average awareness</span><strong>78 <small>/100</small></strong></div></div>
    <article className="panel table-panel full-table">
      <div className="toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search by name or email..." /><div className="filter-group"><label><span className="sr-only">Department</span><select value={department} onChange={(e) => setDepartment(e.target.value)}><option>All departments</option>{departments.map((dep) => <option key={dep.name}>{dep.name}</option>)}</select></label><button className={`filter-button ${riskFilter?'active':''}`} onClick={()=>setRiskFilter(!riskFilter)} aria-pressed={riskFilter}><SlidersHorizontal size={17} /> {riskFilter?'Needs attention':'More filters'}</button></div></div>
      <div className="active-filter-row"><span>Showing {filtered.length} of 200 employees</span><span className="filter-chip">Current cycle: Q3 2026</span></div>
      <div className="table-scroll"><table><thead><tr><th><input type="checkbox" aria-label="Select all" /></th><th>Employee</th><th>Department</th><th>Assigned learning</th><th>Completion</th><th>Awareness score</th><th>Risk level</th><th>Last activity</th><th></th></tr></thead><tbody>
        {filtered.map((employee) => <tr key={employee.id}><td><input type="checkbox" aria-label={`Select ${employee.name}`} /></td><td onClick={() => navigate(`/admin/employees/${employee.id}`)}><div className="employee-cell"><Avatar name={employee.name} size="sm" /><span><strong>{employee.name}</strong><small>{employee.email}</small></span></div></td><td>{employee.department}</td><td>{employee.completed} of {employee.assigned}</td><td><div className="completion-cell"><ProgressBar value={employee.completion} /><span>{employee.completion}%</span></div></td><td><strong>{employee.score}</strong> /100</td><td><ScoreBadge score={employee.score} /></td><td>{employee.lastActivity}</td><td><button className="row-action" onClick={()=>navigate(`/admin/employees/${employee.id}`)} aria-label={`View ${employee.name}`}><MoreHorizontal size={18} /></button></td></tr>)}
      </tbody></table></div>
      <div className="pagination"><span>{filtered.length} employee records shown · 200 total in organization</span></div>
    </article>
  </>;
}

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const employee = employees.find((item) => item.id === employeeId) ?? employees[0];
  const navigate = useNavigate();
  const { employeeScore, quizCompleted } = useProduct();
  const isAndini = employee.id === 'andini-putri';
  const detailScore = isAndini ? employeeScore : employee.score;
  const detailTopics = [{name:'Phishing', score:isAndini ? (quizCompleted?87:58) : Math.max(employee.score - 9, 42)}, {name:'Password Security',score:88}, {name:'Social Engineering',score:70}, {name:'Data Protection',score:82}, {name:'Safe Browsing',score:76}];
  return <>
    <BackButton label="Employees" />
    <div className="employee-detail-head"><div className="employee-identity"><Avatar name={employee.name} size="lg" /><div><span className="section-kicker">HUMAN RISK PROFILE</span><h1>{employee.name}</h1><p>{employee.department} · {employee.email}</p></div></div><Button onClick={() => navigate('/admin/learning?assign=1')}><Plus size={17} /> Assign Learning</Button></div>
    <div className="employee-stat-grid"><article className="panel score-profile"><span>Awareness Score</span><div><strong>{detailScore}</strong><small>/100</small></div><ScoreBadge score={detailScore} /><p><TrendingUp size={15} /> 8 points since previous cycle</p></article><article className="panel stat-card"><span>Courses completed</span><strong>4 <small>of 5</small></strong><ProgressBar value={80} /><p>1 course due September 15</p></article><article className="panel stat-card"><span>Average quiz score</span><strong>78</strong><p>Across 4 completed topics</p></article><article className="panel stat-card"><span>Last activity</span><strong className="date-stat">Aug 28</strong><p>Completed Phishing Awareness</p></article></div>
    <section className="enterprise-section signal-summary"><SectionHeader title="Contributing signals" action={<button className="text-link" onClick={()=>navigate('/admin/awareness/methodology')}>Score methodology <ArrowRight size={14}/></button>}/><div><div><span>Knowledge score</span><strong>76</strong><small>4 assessments</small></div><div><span>Behavioral score</span><strong>68</strong><small>1 simulation observed</small></div><div><span>Exposure level</span><strong>Moderate</strong><small>Finance · sensitive data</small></div><div><span>Positive actions</span><strong>3</strong><small>2 reports · 1 safe response</small></div></div><p><strong>Why attention may be required:</strong> Phishing knowledge is below target and the last simulation recorded a link click. Reporting behavior is improving.</p></section>
    <div className="detail-grid"><article className="panel"><SectionHeader title="Topic Performance" subtitle="Scores from completed topic assessments" />{detailTopics.map((topic) => <TopicBar key={topic.name} {...topic} />)}</article><article className="panel"><SectionHeader title="Awareness History" subtitle="Score progression by cycle" /><ResponsiveContainer width="100%" height={260}><AreaChart data={[{cycle:'Q4 ’25',score:59},{cycle:'Q1 ’26',score:64},{cycle:'Q2 ’26',score:64},{cycle:'Q3 ’26',score:detailScore}]} margin={{top:15,right:15,left:-25,bottom:0}}><defs><linearGradient id="employeeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DE1A34" stopOpacity={.18}/><stop offset="1" stopColor="#DE1A34" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 4"/><XAxis dataKey="cycle" axisLine={false} tickLine={false}/><YAxis domain={[50,80]} axisLine={false} tickLine={false}/><Tooltip/><Area dataKey="score" type="monotone" stroke="#DE1A34" strokeWidth={2.5} fill="url(#employeeFill)"/></AreaChart></ResponsiveContainer></article></div>
    <article className="panel assigned-panel"><SectionHeader title="Learning and certificates" subtitle="Assignments, assessment results, and issued evidence" /><div className="learning-rows"><div><span className="course-mini-icon warning"><MailWarning size={19}/></span><div><strong>Phishing Awareness</strong><small>Completed · Certificate AVR-2026-008721</small></div><StatusBadge status="Completed"/><strong>87 /100</strong><button className="text-link" onClick={()=>navigate('/admin/learning/phishing-awareness')}>View details <ArrowRight size={15}/></button></div><div><span className="course-mini-icon"><KeyRound size={19}/></span><div><strong>Password & Account Security</strong><small>Completed · Certificate AVR-2026-007986</small></div><StatusBadge status="Completed"/><strong>88 /100</strong><button className="text-link" onClick={()=>navigate('/admin/learning/password-account-security')}>View details <ArrowRight size={15}/></button></div><div><span className="course-mini-icon"><Users size={19}/></span><div><strong>Social Engineering</strong><small>In progress · Due Sep 22, 2026</small></div><StatusBadge status="In Progress"/><strong>40%</strong><button className="text-link" onClick={()=>navigate('/admin/learning/social-engineering')}>View course <ArrowRight size={15}/></button></div></div></article>
  </>;
}

export function LearningLibrary() {
  const navigate = useNavigate();
  const { assignLearning } = useProduct();
  const requestedCourse = new URLSearchParams(location.search).get('course');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [showAssign, setShowAssign] = useState(new URLSearchParams(location.search).has('assign'));
  const [selected, setSelected] = useState(courses.find(course=>course.id===requestedCourse)??courses[0]);
  const [toast, setToast] = useState(false);
  const [assignmentMessage,setAssignmentMessage]=useState('');
  const filtered = courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase()) && (category === 'All categories' || course.category === category));
  return <>
    <PageHeader title="Learning" subtitle="Assign short security awareness modules to your employees." actions={<Button onClick={() => setShowAssign(true)}><Plus size={17}/> Assign learning</Button>} />
    <InsightBanner><strong>Target your weakest awareness areas.</strong><p>Phishing and Social Engineering are recommended for this cycle.</p></InsightBanner>
    <div className="library-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search learning modules..."/><select value={category} onChange={(event)=>setCategory(event.target.value)}><option>All categories</option>{[...new Set(courses.map(course=>course.category))].map(item=><option key={item}>{item}</option>)}</select></div>
    <div className="course-grid">{filtered.map((course) => { const Icon = iconMap[course.icon as keyof typeof iconMap]; return <article className="course-card" key={course.id}><div className="course-card-top"><span className={`course-icon ${course.icon}`}><Icon size={23}/></span><StatusBadge status={course.category}/></div><h2>{course.title}</h2><p>{course.description}</p><div className="course-meta"><span><Clock3 size={15}/>{course.duration} min</span><span><ClipboardCheck size={15}/>{course.questions} questions</span></div><div className="course-stats"><div><span>Assigned</span><strong>{course.assigned}</strong></div><div><span>Completion</span><strong>{course.completion}%</strong></div></div><ProgressBar value={course.completion}/><div className="course-actions"><Button variant="secondary" onClick={() => navigate(`/admin/learning/${course.id}`)}>View course</Button><Button onClick={() => {setSelected(course);setShowAssign(true)}}>Assign</Button></div></article>})}</div>
    {showAssign && <AssignModal initialCourse={selected} onClose={() => setShowAssign(false)} onComplete={(course,audience,employees,dueDate) => {setSelected(course);assignLearning({courseId:course.id,courseTitle:course.title,audience,employees,dueDate});setAssignmentMessage(`${course.title} assigned to ${employees} employees in ${audience}.`);setShowAssign(false);setToast(true)}}/>}
    {toast && <Toast message={assignmentMessage} onClose={() => setToast(false)}/>} 
  </>;
}

function AssignModal({initialCourse,onClose,onComplete}:{initialCourse:typeof courses[number];onClose:()=>void;onComplete:(course:typeof courses[number],audience:string,employees:number,dueDate:string)=>void}) {
  const [step,setStep]=useState(1); const [course,setCourse]=useState(initialCourse); const [target,setTarget]=useState('Finance Department'); const [dueDate,setDueDate]=useState('2026-09-15'); const [sendNotification,setSendNotification]=useState(true);
  const audiences=[{name:'All Employees',count:200,detail:'Everyone in ACME Indonesia'},{name:'Finance Department',count:32,detail:'Recommended for the weakest topic'},{name:'Sales Department',count:35,detail:'Department awareness score: 67'},{name:'Operations Department',count:30,detail:'Department awareness score: 76'}];
  const audience=audiences.find(item=>item.name===target)??audiences[0]; const formattedDate=dueDate?new Date(`${dueDate}T00:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Not set';
  const next=()=>setStep(current=>Math.min(4,current+1)); const back=()=>setStep(current=>Math.max(1,current-1));
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="assign-title"><button className="modal-backdrop" onClick={onClose} aria-label="Close assignment"/><div className="modal-card assign-modal"><div className="modal-head"><div><span className="eyebrow">Assign learning · Step {step} of 4</span><h2 id="assign-title">{step===1?'Choose a module':step===2?'Choose the audience':step===3?'Set the schedule':'Review assignment'}</h2><p>{step===1?'Select one focused awareness module.':step===2?'Choose the group that needs this learning.':step===3?'Set a clear completion deadline.':'Confirm the details before assigning.'}</p></div><button onClick={onClose} aria-label="Close">×</button></div><div className="stepper assign-stepper">{['Course','Audience','Schedule','Review'].map((label,index)=><span key={label} className={step>=index+1?'active':''}>{step>index+1?<Check size={13}/>:index+1}<small>{label}</small></span>)}</div>
    {step===1&&<div className="modal-body course-choice-list">{courses.map(item=><label key={item.id} className={course.id===item.id?'selected':''}><input type="radio" name="course" checked={course.id===item.id} onChange={()=>setCourse(item)}/><span className={`course-mini-icon ${item.icon}`}><BookOpen size={18}/></span><span><strong>{item.title}</strong><small>{item.category} · {item.duration} min · {item.questions} questions</small></span>{course.id===item.id&&<Check size={18}/>}</label>)}</div>}
    {step===2&&<div className="modal-body"><div className="choice-list audience-choice-list">{audiences.map(item=><label className={target===item.name?'selected':''} key={item.name}><input type="radio" checked={target===item.name} onChange={()=>setTarget(item.name)}/><span><strong>{item.name}</strong><small>{item.count} employees · {item.detail}</small></span><strong className="audience-count">{item.count}</strong></label>)}</div></div>}
    {step===3&&<div className="modal-body schedule-step"><label className="field-label" htmlFor="assignment-date">Completion deadline</label><div className="input-with-icon"><CalendarDays size={18}/><input id="assignment-date" type="date" min="2026-08-30" value={dueDate} onChange={(event)=>setDueDate(event.target.value)}/></div><label className="notification-option"><input type="checkbox" checked={sendNotification} onChange={(event)=>setSendNotification(event.target.checked)}/><span><strong>Notify employees when assigned</strong><small>Send an assignment email with the module and due date.</small></span></label><div className="schedule-summary"><Clock3 size={17}/><p>Employees have until <strong>{formattedDate}</strong> to complete this module.</p></div></div>}
    {step===4&&<div className="modal-body review-box"><div className="assignment-review-head"><span className="course-mini-icon warning"><BookOpen size={19}/></span><div><strong>{course.title}</strong><small>{course.duration} minutes · {course.questions} questions</small></div></div><dl><div><dt>Audience</dt><dd>{target}</dd></div><div><dt>Recipients</dt><dd>{audience.count} employees</dd></div><div><dt>Due date</dt><dd>{formattedDate}</dd></div><div><dt>Notification</dt><dd>{sendNotification?'Send immediately':'Do not send'}</dd></div></dl><p><ShieldCheck size={17}/> The assignment will appear in employee learning records and campaign reporting.</p></div>}
    <div className="modal-foot assign-modal-foot"><Button variant="secondary" onClick={step===1?onClose:back}>{step===1?'Cancel':'Back'}</Button><span>Step {step} of 4</span><Button disabled={step===3&&!dueDate} onClick={step===4?()=>onComplete(course,target,audience.count,formattedDate):next}>{step===4?<><Send size={17}/>Assign to {audience.count}</>:<>Continue<ArrowRight size={16}/></>}</Button></div></div></div>;
}

export function CourseDetailAdmin() {
  const {courseId}=useParams(); const course=courses.find(c=>c.id===courseId)??courses[0]; const navigate=useNavigate();
  return <><BackButton label="Learning library"/><div className="course-detail-hero"><span className="course-icon mail"><MailWarning size={27}/></span><div><span className="eyebrow">{course.category}</span><h1>{course.title}</h1><p>{course.description}</p><div className="course-meta"><span><Clock3 size={15}/>{course.duration} minutes</span><span><ClipboardCheck size={15}/>{course.questions} questions</span><span><Users size={15}/>{course.assigned} assigned</span></div></div><Button onClick={()=>navigate('/admin/learning?assign=1')}><Plus size={17}/>Assign course</Button></div><div className="detail-grid course-detail-grid"><article className="panel"><SectionHeader title="Course outline" subtitle="Short, focused content designed for the flow of work"/><div className="outline-list">{['What is Phishing?','Common Warning Signs','Look Before You Click','What Should You Do?','Knowledge Check'].map((x,i)=><div key={x}><span>{i+1}</span><div><strong>{x}</strong><small>{i===4?`${course.questions} question quiz`:'Micro-learning section · 1–2 min'}</small></div><Check size={18}/></div>)}</div></article><aside className="panel course-performance"><SectionHeader title="Current performance"/><div className="radial-score"><strong>{course.completion}%</strong><small>completion</small></div><dl><div><dt>Assigned</dt><dd>{course.assigned}</dd></div><div><dt>Completed</dt><dd>{Math.round(course.assigned*course.completion/100)}</dd></div><div><dt>Average quiz score</dt><dd>76</dd></div></dl><InsightBanner><strong>Recommended action</strong><p>Assign to Finance where phishing awareness is 58.</p></InsightBanner></aside></div></>;
}

export function AwarenessPage() {
  const {organizationScore,previousOrganizationScore}=useProduct();
  const distribution=[{name:'Strong',value:46,color:'#b8b9bc'},{name:'Good',value:91,color:'#de1a34'},{name:'Needs Improvement',value:45,color:'#a8172a'},{name:'High Risk',value:18,color:'#6f101d'}];
  return <><PageHeader title="Awareness" subtitle="Understand human security risk across topics, departments, and employees." actions={<Button variant="secondary" onClick={()=>window.print()}><Download size={17}/>Export summary</Button>}/><div className="awareness-hero"><div><span>Organization Awareness Score</span><strong>{organizationScore} <small>/ 100</small></strong><ScoreBadge score={organizationScore}/></div><div><TrendingUp size={21}/><strong>+{organizationScore-previousOrganizationScore} points</strong><span>from Q2 Security Awareness 2026</span></div><p>Your organization’s awareness is improving. Phishing and Social Engineering remain the highest-priority areas.</p></div><div className="analytics-grid"><article className="panel"><SectionHeader title="Awareness by Topic" subtitle="Average assessment score across the organization"/>{topics.map((topic,i)=><TopicBar key={topic.name} {...topic} note={i===0?'Lowest performing topic':undefined}/>)}</article><article className="panel"><SectionHeader title="Employee Distribution" subtitle="200 employees by awareness level"/><div className="distribution-chart"><ResponsiveContainer width="54%" height={230}><PieChart><Pie data={distribution} dataKey="value" innerRadius={64} outerRadius={88} paddingAngle={2} stroke="none">{distribution.map(x=><Cell fill={x.color} key={x.name}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>200</strong><span>employees</span></div><div className="distribution-legend">{distribution.map(item=><div key={item.name}><i style={{background:item.color}}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div></article></div><div className="analytics-grid lower"><article className="panel department-panel"><SectionHeader title="Awareness by Department" subtitle="Compare scores to identify where support is needed" action={<select><option>Sort: Highest score</option><option>Sort: Lowest score</option></select>}/><div className="department-list">{departments.map((dep,i)=><div key={dep.name}><span className="rank">{i+1}</span><div><strong>{dep.name}</strong><small>{dep.employees} employees · {dep.completion}% completion</small></div><ProgressBar value={dep.score} tone={dep.score>=85?'green':dep.score>=70?'blue':'amber'}/><strong>{dep.score}</strong><ScoreBadge score={dep.score}/></div>)}</div></article><article className="panel"><SectionHeader title="Awareness Trend" subtitle="Organization score by month"/><ResponsiveContainer width="100%" height={310}><AreaChart data={[...awarenessTrend.slice(0,-1),{month:'Aug',score:organizationScore}]} margin={{top:20,right:20,left:-20,bottom:0}}><defs><linearGradient id="awareFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DE1A34" stopOpacity={.2}/><stop offset="1" stopColor="#DE1A34" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf5"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis domain={[60,90]} axisLine={false} tickLine={false}/><Tooltip/><Area dataKey="score" type="monotone" stroke="#DE1A34" strokeWidth={2.5} fill="url(#awareFill)"/></AreaChart></ResponsiveContainer></article></div></>;
}

const reportData=[{id:'q3-2026',name:'Q3 Security Awareness 2026',status:'Active',employees:200,completion:82,score:78,period:'Jul 1 – Sep 30, 2026'},{id:'q2-2026',name:'Q2 Security Awareness 2026',status:'Completed',employees:200,completion:91,score:72,period:'Apr 1 – Jun 30, 2026'},{id:'q1-2026',name:'Q1 Security Awareness 2026',status:'Completed',employees:194,completion:88,score:69,period:'Jan 1 – Mar 31, 2026'}];
export function ReportsPage(){const navigate=useNavigate();const {organizationScore,campaigns}=useProduct();const currentCompletion=campaigns.find(item=>item.id==='q3-2026')?.completion??82;const reports=reportData.map(report=>report.id==='q3-2026'?{...report,score:organizationScore,completion:currentCompletion}:report);return <><PageHeader title="Reports" actions={<Button onClick={()=>navigate('/admin/reports/q3-2026')}><FileChartColumn size={17}/>Buka Laporan Aktif</Button>}/><div className="report-callout"><div><ShieldCheck size={22}/><span><strong>Evidence supporting awareness control requirements</strong><p>Training, assessment, certificate, and campaign records are included.</p></span></div><Button variant="secondary" onClick={()=>navigate('/admin/reports/q3-2026')}>Lihat Struktur Bukti</Button></div><div className="reports-list">{reports.map(report=><article className="panel report-card" key={report.id}><div className="report-title"><span className="report-icon"><FileChartColumn size={22}/></span><div><div><h2>{report.name}</h2><StatusBadge status={report.status}/></div><p>{report.period}</p></div></div><div className="report-metrics"><div><span>Employees</span><strong>{report.employees}</strong></div><div><span>Completion</span><strong>{report.completion}%</strong></div><div><span>Awareness Score</span><strong>{report.score}</strong><ScoreBadge score={report.score}/></div></div><div className="report-actions"><Button variant="secondary" onClick={()=>navigate(`/admin/reports/${report.id}`)}>View Report</Button><Button variant="ghost" onClick={()=>window.print()}><Download size={16}/>Export PDF</Button></div></article>)}</div></>}

export function ReportDetail(){const {reportId}=useParams();const {organizationScore,campaigns}=useProduct();const currentCompletion=campaigns.find(item=>item.id==='q3-2026')?.completion??82;const source=reportData.find(r=>r.id===reportId)??reportData[0];const report=source.id==='q3-2026'?{...source,score:organizationScore,completion:currentCompletion}:source;return <><BackButton label="Reports"/><PageHeader eyebrow={report.period} title="Security Awareness Report" subtitle={`${report.name} · ACME Indonesia`} actions={<Button onClick={() => window.print()}><Download size={17}/>Export Report</Button>}/><div className="report-cover panel"><div><BrandReport/><StatusBadge status={report.status}/></div><span className="report-label">HUMAN SECURITY RISK INTELLIGENCE</span><h2>Security Awareness Report</h2><p>ACME Indonesia · Q3 2026 · Generated 28 August 2026</p><div className="kpi-grid report-kpis"><article><span>Organization Awareness Score</span><strong>{report.score}</strong><ScoreBadge score={report.score}/></article><article><span>Program Coverage</span><strong>{report.completion}%</strong><small>Current campaign completion</small></article><article><span>Behavior Signals</span><strong>74</strong><small>Reporting and simulation behavior</small></article><article><span>People Needing Attention</span><strong>18</strong><small>9% of workforce</small></article></div><div className="report-generated">Generated by AVERIS — by VulneraX · Report owner: Syarif Rahman</div></div><div className="analytics-grid"><article className="panel"><SectionHeader title="Executive Summary"/><p className="report-copy">ACME Indonesia’s Awareness Score improved to <strong>{report.score}/100</strong>. Program coverage reached <strong>{report.completion}%</strong>. Phishing remains the lowest-performing topic; Finance and Sales require targeted follow-up.</p><InsightBanner><strong>Recommended decision</strong><p>Assign a phishing refresher to Finance and schedule a follow-up assessment.</p></InsightBanner></article><article className="panel"><SectionHeader title="Evidence Included"/><ul className="evidence-list">{['Employee training records','Campaign completion history','Assessment and behavior signals','Certificate register','Score methodology and change history','Admin activity record'].map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul></article></div></>}
function BrandReport(){return <div className="brand report-brand"><AverisMark/><span className="brand-lockup"><strong>AVERIS</strong><small>by VulneraX</small></span></div>}
