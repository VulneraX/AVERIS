import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, CalendarDays, Check, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, LockKeyhole, ShieldCheck, Target, Users, X,
} from 'lucide-react';
import { BackButton, Button, EmptyState, PageHeader, ProgressBar, ScoreBadge, StatusBadge } from './components';
import { courses } from './data';
import { useProduct, type AssessmentAssignment, type CampaignStatus, type LearningAssignment } from './product-state';
import { useAuth } from './auth';
import { apiRequest } from './api';

const matchesAudience = (audience: string, department?: string|null) => ['all employees', String(department??'').toLowerCase(), `${String(department??'').toLowerCase()} department`].includes(audience.toLowerCase());
const statusLabel: Record<LearningAssignment['status'], string> = {
  'Not Started': 'Belum dimulai',
  'In Progress': 'Sedang dipelajari',
  'Content Completed': 'Materi selesai',
  'Quiz Available': 'Kuis tersedia',
  'Completed': 'Selesai',
  'Overdue': 'Terlambat',
};

function assignmentAction(assignment: LearningAssignment) {
  const campaignScope=assignment.campaignId?`${encodeURIComponent(assignment.campaignId)}/`:'';
  if (assignment.status === 'Quiz Available' || assignment.status === 'Content Completed') return { label: 'Mulai Kuis', path: `/employee/quiz/${campaignScope}${assignment.courseId}` };
  if (assignment.status === 'Completed') return { label: 'Lihat Hasil', path: `/employee/quiz/${campaignScope}${assignment.courseId}/result` };
  return { label: assignment.status === 'In Progress' ? 'Lanjutkan' : 'Mulai Pembelajaran', path: `/employee/learning/${campaignScope}${assignment.courseId}` };
}

function EmployeeTask({ assignment }: { assignment: LearningAssignment }) {
  const navigate = useNavigate();
  const { campaigns, assessments } = useProduct();
  const campaign = campaigns.find((item) => item.id === assignment.campaignId);
  const blocked = assessments.some((item) => item.campaignId === assignment.campaignId && item.type === 'Baseline' && item.status !== 'Completed');
  const course = courses.find((item) => item.id === assignment.courseId);
  const action = assignmentAction(assignment);
  return <article className="connected-task">
    <div className="task-icon"><BookOpen size={21}/></div>
    <div className="task-copy">
      <div className="task-meta"><span>{campaign?.name ?? 'Penugasan langsung'}</span><StatusBadge status={blocked ? 'Terkunci' : statusLabel[assignment.status]}/></div>
      <h3>{assignment.courseTitle}</h3>
      <p>{assignment.required ? 'Wajib' : 'Opsional'} · {course?.duration ?? 7} menit · Tenggat {assignment.dueDate}</p>
      <ProgressBar value={assignment.progress} label={statusLabel[assignment.status]}/>
    </div>
    {blocked ? <span className="locked-action"><LockKeyhole size={16}/>Selesaikan Assessment Awal</span> : <Button variant={assignment.status === 'Completed' ? 'secondary' : 'primary'} onClick={() => navigate(action.path)}>{action.label}<ArrowRight size={16}/></Button>}
  </article>;
}

function AssessmentTask({ assessment }: { assessment: AssessmentAssignment }) {
  const navigate = useNavigate();
  const { campaigns, assignments } = useProduct();
  const campaign = campaigns.find((item) => item.id === assessment.campaignId);
  const unfinished = assignments.filter((item) => item.campaignId === assessment.campaignId && item.required && item.status !== 'Completed').length;
  return <article className={`connected-task assessment-task ${assessment.status === 'Locked' ? 'locked' : ''}`}>
    <div className="task-icon"><ClipboardCheck size={21}/></div>
    <div className="task-copy">
      <div className="task-meta"><span>{campaign?.name}</span><StatusBadge status={assessment.status === 'Available' ? 'Tersedia' : assessment.status}/></div>
      <h3>{assessment.type === 'Baseline' ? 'Assessment Awal' : 'Assessment Tindak Lanjut'}</h3>
      <p>{assessment.status === 'Locked' ? `Selesaikan ${unfinished} learning wajib untuk membuka assessment ini.` : assessment.type === 'Baseline' ? 'Mengukur pemahaman Anda sebelum pembelajaran.' : 'Mengukur perubahan setelah pembelajaran selesai.'}</p>
    </div>
    {assessment.status === 'Available' && <Button onClick={() => navigate(`/employee/assessment/${assessment.id}`)}>Mulai Assessment<ArrowRight size={16}/></Button>}
    {assessment.status === 'In Progress' && <Button onClick={() => navigate(`/employee/assessment/${assessment.id}`)}>Lanjutkan<ArrowRight size={16}/></Button>}
    {assessment.status === 'Locked' && <span className="locked-action"><LockKeyhole size={16}/>Terkunci</span>}
  </article>;
}

export function ConnectedEmployeeHome() {
  const navigate = useNavigate();
  const {user}=useAuth();
  const { employeeScore, previousEmployeeScore, campaigns, assignments, assessments, certificates } = useProduct();
  const eligibleAssignments = useMemo(()=>assignments.filter((item) => matchesAudience(item.audience,user?.department)),[assignments,user?.department]);
  const primaryCampaign=campaigns.find(campaign=>campaign.status==='Active'&&eligibleAssignments.some(item=>item.campaignId===campaign.id))??campaigns.find(campaign=>eligibleAssignments.some(item=>item.campaignId===campaign.id));
  const visibleAssignments = eligibleAssignments.filter(item=>item.campaignId===primaryCampaign?.id);
  const campaignIds = new Set(visibleAssignments.map((item) => item.campaignId));
  const visibleAssessments = assessments.filter((item) => campaignIds.has(item.campaignId));
  const baseline = visibleAssessments.find((item) => item.type === 'Baseline' && item.status !== 'Completed');
  const learning = [...visibleAssignments.filter((item) => item.status !== 'Completed')].sort((a, b) => {
    if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
    if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  const followUp = visibleAssessments.find((item) => item.type === 'Follow-up' && item.status !== 'Completed');
  const tasks: Array<{ type: 'learning'; item: LearningAssignment } | { type: 'assessment'; item: AssessmentAssignment }> = [
    ...(baseline ? [{ type: 'assessment' as const, item: baseline }] : []),
    ...learning.map((item) => ({ type: 'learning' as const, item })),
    ...(followUp ? [{ type: 'assessment' as const, item: followUp }] : []),
  ];
  return <>
    <div className="employee-heading"><div><span className="eyebrow">WORKSPACE KARYAWAN</span><h1>Selamat datang, {user?.name}</h1><p>{primaryCampaign?`Fokus saat ini: ${primaryCampaign.name}`:'Tidak ada campaign aktif saat ini.'}</p></div><Button variant="secondary" onClick={() => navigate('/employee/learning')}>Buka Pembelajaran Saya</Button></div>
    <div className="employee-summary-strip">
      <div><span>Awareness Score</span><strong>{employeeScore}<small>/100</small></strong><ScoreBadge score={employeeScore}/></div>
      <div><span>Perubahan terakhir</span><strong className="positive">+{employeeScore - previousEmployeeScore}</strong><small>dari assessment sebelumnya</small></div>
      <div><span>Tugas aktif</span><strong>{tasks.filter((item) => item.item.status !== 'Locked').length}</strong><small>{learning.length} learning · {visibleAssessments.filter((item) => item.status === 'Available').length} assessment</small></div>
      <div><span>Sertifikat</span><strong>{certificates.filter((item) => item.status === 'Issued').length}</strong><button onClick={() => navigate('/employee/certificates')}>Lihat sertifikat</button></div>
    </div>
    <section className="employee-task-section">
      <div className="employee-section-head"><div><span className="section-kicker">CAMPAIGN AKTIF</span><h2>{primaryCampaign?.name??'Tugas Anda'}</h2></div><p>Hanya tugas dari campaign fokus yang ditampilkan di sini.</p></div>
      <div className="connected-task-list">{tasks.length ? tasks.map((task) => task.type === 'learning' ? <EmployeeTask key={task.item.id} assignment={task.item}/> : <AssessmentTask key={task.item.id} assessment={task.item}/>) : <div className="clean-empty"><CheckCircle2 size={24}/><div><strong>Semua tugas selesai</strong><p>Tidak ada tugas aktif saat ini.</p></div></div>}</div>
    </section>
  </>;
}

export function ConnectedMyLearning() {
  const navigate=useNavigate();
  const {user}=useAuth();
  const { campaigns, assignments, assessments } = useProduct();
  const [tab, setTab] = useState<'todo' | 'completed'>('todo');
  const visibleAssignments = useMemo(()=>assignments.filter((item) => matchesAudience(item.audience,user?.department)),[assignments,user?.department]);
  const campaignOptions=useMemo(()=>campaigns.filter(campaign=>visibleAssignments.some(item=>item.campaignId===campaign.id)&&campaign.status!=='Cancelled').sort((a,b)=>{const order:Record<string,number>={Active:0,Scheduled:1,Draft:2,Completed:3,Closed:4};return(order[a.status]??9)-(order[b.status]??9)}),[campaigns,visibleAssignments]);
  const [selectedCampaignId,setSelectedCampaignId]=useState(()=>campaignOptions[0]?.id||'');
  useEffect(()=>{if(!campaignOptions.some(item=>item.id===selectedCampaignId))setSelectedCampaignId(campaignOptions[0]?.id||'')},[campaignOptions,selectedCampaignId]);
  const campaign=campaignOptions.find(item=>item.id===selectedCampaignId);
  const campaignAssignments=visibleAssignments.filter(item=>item.campaignId===selectedCampaignId);
  const campaignAssessments=assessments.filter(item=>item.campaignId===selectedCampaignId);
  const taskItems:Array<{id:string;kind:'learning'|'assessment';title:string;description:string;status:string;done:boolean;locked:boolean;action?:()=>void;actionLabel?:string}>=[
    ...campaignAssessments.filter(item=>item.type==='Baseline').map(item=>({id:item.id,kind:'assessment' as const,title:'Assessment Awal',description:`Pengukuran awal · Tenggat ${item.dueDate}`,status:item.status,done:item.status==='Completed',locked:item.status==='Locked',...(['Available','In Progress'].includes(item.status)?{action:()=>navigate(`/employee/assessment/${item.id}`),actionLabel:item.status==='In Progress'?'Lanjutkan':'Mulai'}:{})})),
    ...campaignAssignments.map(item=>{const action=assignmentAction(item);const waiting=campaign?.status==='Scheduled'||campaign?.status==='Draft';return{id:item.id,kind:'learning' as const,title:item.courseTitle,description:waiting?`Tersedia saat campaign dimulai · ${campaign.schedule}`:`${item.required?'Wajib':'Opsional'} · Tenggat ${item.dueDate} · ${item.progress}%`,status:waiting?'Terjadwal':item.status,done:item.status==='Completed',locked:waiting,...(!waiting?{action:()=>navigate(action.path),actionLabel:action.label}:{})}}),
    ...campaignAssessments.filter(item=>item.type==='Follow-up').map(item=>({id:item.id,kind:'assessment' as const,title:'Assessment Tindak Lanjut',description:item.status==='Locked'?'Terbuka setelah learning wajib selesai':`Pengukuran akhir · Tenggat ${item.dueDate}`,status:item.status,done:item.status==='Completed',locked:item.status==='Locked',...(['Available','In Progress'].includes(item.status)?{action:()=>navigate(`/employee/assessment/${item.id}`),actionLabel:item.status==='In Progress'?'Lanjutkan':'Mulai'}:{})})),
  ];
  const items=taskItems.filter(item=>tab==='completed'?item.done:!item.done);
  const completed=taskItems.filter(item=>item.done).length;
  const progress=taskItems.length?Math.round(completed/taskItems.length*100):0;
  return <>
    <PageHeader title="Pembelajaran Saya" subtitle="Pilih campaign, lalu selesaikan tugasnya satu per satu."/>
    {campaign?<><section className="learning-campaign-picker"><label><span>CAMPAIGN</span><select value={selectedCampaignId} onChange={event=>{setSelectedCampaignId(event.target.value);setTab('todo')}}>{campaignOptions.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="learning-campaign-meta"><StatusBadge status={campaign.status}/><span>{campaign.schedule}</span></div><div className="learning-campaign-progress"><div><span>Progres</span><strong>{completed}/{taskItems.length} selesai</strong></div><ProgressBar value={progress}/></div></section>
      <div className="learning-tabs clean-learning-tabs"><button className={tab==='todo'?'active':''} onClick={()=>setTab('todo')}>Perlu dikerjakan <span>{taskItems.length-completed}</span></button><button className={tab==='completed'?'active':''} onClick={()=>setTab('completed')}>Selesai <span>{completed}</span></button></div>
      <section className="learning-focus-list">{items.length?items.map(item=><article key={item.id} className={item.locked?'locked':''}><div className="learning-row-icon">{item.kind==='learning'?<BookOpen size={18}/>:<ClipboardCheck size={18}/>}</div><div className="learning-row-copy"><span>{item.kind==='learning'?'LEARNING':'ASSESSMENT'}</span><strong>{item.title}</strong><small>{item.description}</small></div><StatusBadge status={item.status}/>{item.action&&!item.locked?<Button variant={item.done?'secondary':'primary'} onClick={item.action}>{item.actionLabel}<ArrowRight size={15}/></Button>:item.locked?<span className="learning-row-locked"><LockKeyhole size={14}/>Terkunci</span>:null}</article>):<div className="clean-empty"><CheckCircle2 size={24}/><div><strong>{tab==='todo'?'Semua tugas campaign selesai':'Belum ada tugas selesai'}</strong><p>{tab==='todo'?'Tidak ada tindakan lain yang diperlukan untuk campaign ini.':'Tugas yang selesai akan tercatat di sini.'}</p></div></div>}</section></>:<EmptyState title="Belum ada pembelajaran" description="Assignment akan muncul setelah administrator meluncurkan campaign untuk Anda."/>}
  </>;
}

const phishingQuestions = [
  ['Email dari “IT Support” meminta reset kata sandi melalui tautan asing. Apa tindakan paling aman?', ['Klik segera', 'Balas dengan kata sandi', 'Verifikasi melalui kanal resmi', 'Teruskan ke rekan'], 2],
  ['Tanda paling kuat pada lampiran invoice yang mencurigakan adalah…', ['Memakai logo perusahaan', 'File berekstensi executable', 'Dikirim pada jam kerja', 'Memiliki tanda tangan'], 1],
  ['Eksekutif meminta pembelian voucher secara mendesak. Apa yang harus dilakukan?', ['Segera membeli', 'Konfirmasi melalui kanal yang dikenal', 'Kirim kode melalui email', 'Minta rekan membayar'], 1],
  ['Apa yang perlu diperiksa sebelum membuka tautan email?', ['Jenis huruf', 'Panjang email', 'Alamat tujuan sebenarnya', 'Jabatan pengirim'], 2],
  ['Halaman login tampak resmi tetapi alamatnya salah eja. Apa tindakan yang benar?', ['Coba login', 'Tutup dan buka situs resmi langsung', 'Gunakan kata sandi lain', 'Muat ulang'], 1],
  ['Lampiran tidak terduga datang dari kontak yang dikenal. Apa tindakan paling aman?', ['Buka karena pengirim dikenal', 'Matikan antivirus', 'Verifikasi lewat kanal lain', 'Unggah ke situs publik'], 2],
  ['Permintaan apa yang selalu perlu dicurigai?', ['Undangan rapat', 'Permintaan kata sandi atau kode MFA', 'Newsletter', 'Pembaruan kalender'], 1],
  ['Bagaimana menangani pesan yang diduga phishing?', ['Hapus tanpa melapor', 'Balas pengirim', 'Gunakan proses pelaporan perusahaan', 'Bagikan ke grup'], 2],
] as const;

const genericQuestions = [
  ['Apa langkah pertama ketika menerima permintaan kerja yang tidak biasa?', ['Langsung mengikuti', 'Verifikasi konteks dan identitas', 'Bagikan ke publik', 'Abaikan prosedur'], 1],
  ['Kanal apa yang sebaiknya digunakan untuk data perusahaan?', ['Akun pribadi', 'Sistem resmi perusahaan', 'Perangkat publik', 'Aplikasi tanpa izin'], 1],
  ['Apa yang harus dilakukan saat ragu terhadap permintaan keamanan?', ['Mengambil jalan pintas', 'Menghubungi IT atau Security', 'Membagikan kredensial', 'Menunda tanpa laporan'], 1],
  ['Mengapa MFA penting?', ['Menggantikan semua kebijakan', 'Menambah lapisan perlindungan akun', 'Memudahkan berbagi akun', 'Menghapus kebutuhan verifikasi'], 1],
  ['Bagaimana menerapkan akses yang aman?', ['Berikan semua akses', 'Batasi sesuai kebutuhan kerja', 'Gunakan satu akun bersama', 'Simpan kata sandi di dokumen publik'], 1],
] as const;

export function ConnectedModuleQuiz() {
  const navigate = useNavigate();
  const {user}=useAuth();
  const { courseId } = useParams();
  const { assignments, completeModuleQuiz } = useProduct();
  const assignment = assignments.find((item) => item.courseId === courseId && matchesAudience(item.audience,user?.department));
  const questions = courseId === 'phishing-awareness' ? phishingQuestions : genericQuestions;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  if (!assignment || !['Quiz Available', 'Content Completed'].includes(assignment.status)) return <div className="access-state"><LockKeyhole size={28}/><h1>Kuis belum tersedia</h1><p>Selesaikan seluruh materi learning terlebih dahulu.</p><Button onClick={() => navigate(assignment ? `/employee/learning/${assignment.courseId}` : '/employee/learning')}>Kembali ke learning</Button></div>;
  const current = questions[index];
  const choose = (answer: number) => setAnswers((existing) => { const next = [...existing]; next[index] = answer; return next; });
  const submit = async () => {
    const correct = questions.reduce((total, item, questionIndex) => total + (answers[questionIndex] === item[2] ? 1 : 0), 0);
    const raw = Math.round((correct / questions.length) * 100);
    const score = questions.length === 8 && correct === 7 ? 87 : raw;
    await completeModuleQuiz(assignment.courseId, score, answers);
    navigate(`/employee/quiz/${assignment.courseId}/result`);
  };
  return <div className="quiz-page"><header className="quiz-top"><button onClick={() => navigate('/employee/learning')}><X size={20}/>Keluar</button><div><ShieldCheck size={20}/><strong>Kuis Modul · {assignment.courseTitle}</strong></div><span>Pertanyaan {index + 1} dari {questions.length}</span></header><div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div><main className="quiz-main"><div className="quiz-number"><span>{index + 1}</span><div><strong>Pertanyaan {index + 1}</strong><small>Pilih satu jawaban</small></div></div><h1>{current[0]}</h1><div className="quiz-options">{current[1].map((answer, answerIndex) => <button key={answer} className={answers[index] === answerIndex ? 'selected' : ''} onClick={() => choose(answerIndex)}><span>{String.fromCharCode(65 + answerIndex)}</span><strong>{answer}</strong>{answers[index] === answerIndex && <Check size={19}/>}</button>)}</div><div className="quiz-controls"><Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={17}/>Sebelumnya</Button><Button disabled={answers[index] === undefined} onClick={() => index === questions.length - 1 ? void submit() : setIndex(index + 1)}>{index === questions.length - 1 ? 'Kirim Kuis' : 'Berikutnya'}<ArrowRight size={17}/></Button></div></main></div>;
}

export function ConnectedQuizResult() {
  const navigate = useNavigate();
  const {user}=useAuth();
  const { campaignId,courseId } = useParams();
  const { assignments, certificates } = useProduct();
  const assignment = assignments.find((item) => item.courseId === courseId && (!campaignId||item.campaignId===campaignId) && matchesAudience(item.audience,user?.department));
  const certificate = certificates.find((item) => item.courseId === courseId && item.status === 'Issued');
  const [history,setHistory]=useState<Array<{id:string;attempt:number;score:number;passed:boolean;completedAt:string;nextRetryAt?:string}>>([]);
  useEffect(()=>{if(courseId)void apiRequest<{attempts:typeof history}>(`/api/quiz/${courseId}/history${campaignId?`?campaignId=${encodeURIComponent(campaignId)}`:''}`).then(response=>setHistory(response.attempts)).catch(()=>setHistory([]))},[campaignId,courseId]);
  if (assignment?.quizScore === undefined) return <div className="access-state"><FileCheck2 size={28}/><h1>Hasil belum tersedia</h1><p>Selesaikan kuis modul untuk melihat hasil.</p><Button onClick={() => navigate('/employee/learning')}>Kembali</Button></div>;
  const passed = assignment.quizScore >= 70;
  const quizPath=`/employee/quiz/${campaignId?`${campaignId}/`:''}${courseId}`;const learningPath=`/employee/learning/${campaignId?`${campaignId}/`:''}${courseId}`;
  return <div className="result-page"><div className="result-celebration"><span className="result-icon">{passed ? <Check size={32}/> : <FileCheck2 size={32}/>}</span><span className="eyebrow">KUIS MODUL SELESAI</span><h1>{passed ? 'Learning selesai' : 'Pembelajaran tambahan disarankan'}</h1><p>{passed ? 'Nilai Anda memenuhi kriteria kelulusan.' : 'Pelajari kembali materi sebelum mencoba ulang.'}</p><div className="result-score"><strong>{assignment.quizScore}</strong><small>/100</small></div><ScoreBadge score={assignment.quizScore}/></div><div className="result-facts"><div><span>Learning</span><strong>{assignment.courseTitle}</strong></div><div><span>Status</span><strong>{passed ? 'Lulus' : 'Belum lulus'}</strong></div><div><span>Sertifikat</span><strong>{certificate ? 'Diterbitkan' : 'Belum tersedia'}</strong></div></div>{history.length>0&&<section className="attempt-history"><h2>Riwayat attempt</h2>{history.map(item=><div key={item.id}><span>Attempt {item.attempt}<small>{new Date(item.completedAt).toLocaleString('id-ID')}</small></span><strong>{item.score}/100</strong><StatusBadge status={item.passed?'Lulus':'Belum lulus'}/></div>)}</section>}<div className="result-actions">{passed && certificate && <Button onClick={() => navigate(`/employee/certificates/${courseId}`)}><Award size={17}/>Lihat Sertifikat</Button>}{!passed&&<Button onClick={()=>navigate(quizPath)}>Coba lagi</Button>}<Button variant="secondary" onClick={() => navigate(`${quizPath}/review`)}>Tinjau Jawaban</Button><Button variant="secondary" onClick={() => navigate(passed ? '/employee/learning' : learningPath)}>{passed ? 'Kembali ke My Learning' : 'Pelajari kembali'}</Button></div></div>;
}

export function ConnectedAnswerReview() {
  const navigate = useNavigate();
  const { campaignId,courseId } = useParams();
  const { quizAttempts } = useProduct();
  const questions = courseId === 'phishing-awareness' ? phishingQuestions : genericQuestions;
  const attempt = quizAttempts.find((item) => item.courseId === courseId&&(!campaignId||item.campaignId===campaignId));
  if (!attempt) return <div className="access-state"><FileCheck2 size={28}/><h1>Jawaban belum tersedia</h1><p>Selesaikan kuis modul sebelum meninjau jawaban.</p><Button onClick={() => navigate('/employee/learning')}>Kembali</Button></div>;
  return <><BackButton label="Hasil Kuis"/><PageHeader title="Tinjau Jawaban"/><div className="answer-review-list">{questions.map((question, index) => { const correct = attempt.answers[index] === question[2]; return <article key={question[0]} className={correct ? 'correct' : 'incorrect'}><div className="review-number">{index + 1}</div><div><h2>{question[0]}</h2><dl><div><dt>Jawaban Anda</dt><dd>{question[1][attempt.answers[index]] ?? 'Tidak dijawab'}</dd></div>{!correct && <div><dt>Jawaban yang benar</dt><dd>{question[1][question[2]]}</dd></div>}</dl><p>{correct ? 'Jawaban benar.' : 'Verifikasi melalui prosedur dan kanal resmi membantu mencegah tindakan yang dipicu oleh rekayasa sosial.'}</p></div><StatusBadge status={correct ? 'Benar' : 'Perlu ditinjau'}/></article>; })}</div><div className="review-footer"><Button onClick={() => navigate(`/employee/quiz/${campaignId?`${campaignId}/`:''}${courseId}/result`)}>Kembali ke Hasil</Button></div></>;
}

const assessmentQuestions = genericQuestions;

export function ContextualAssessment() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const { assessments, startAssessment, completeAssessment } = useProduct();
  const assessment = assessments.find((item) => item.id === assessmentId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [started, setStarted] = useState(assessment?.status === 'In Progress');
  if (!assessment) return <div className="access-state"><ClipboardCheck size={28}/><h1>Assessment tidak ditemukan</h1><Button onClick={() => navigate('/employee')}>Kembali ke Home</Button></div>;
  if (assessment.status === 'Completed') return <div className="access-state success"><CheckCircle2 size={28}/><h1>Assessment selesai</h1><p>Nilai {assessment.score}/100 sudah masuk ke Awareness Score.</p><Button onClick={() => navigate('/employee/awareness')}>Lihat Awareness Score</Button></div>;
  if (assessment.status === 'Locked') return <div className="access-state"><LockKeyhole size={28}/><h1>Assessment masih terkunci</h1><p>Selesaikan seluruh learning wajib dan kuis modul terlebih dahulu.</p><Button onClick={() => navigate('/employee')}>Lihat tugas</Button></div>;
  if (!started) return <div className="assessment-intro"><ClipboardCheck size={30}/><span className="section-kicker">{assessment.type === 'Baseline' ? 'ASSESSMENT AWAL' : 'ASSESSMENT TINDAK LANJ'}</span><h1>{assessment.title}</h1><p>{assessment.type === 'Baseline' ? 'Assessment ini mengukur pemahaman Anda sebelum pembelajaran.' : 'Assessment ini mengukur perubahan setelah learning wajib selesai.'}</p><dl><div><dt>Pertanyaan</dt><dd>{assessmentQuestions.length}</dd></div><div><dt>Waktu</dt><dd>± 4 menit</dd></div><div><dt>Tenggat</dt><dd>{assessment.dueDate}</dd></div></dl><Button onClick={() => void startAssessment(assessment.id).then(result=>result&&setStarted(true))}>Mulai Assessment<ArrowRight size={16}/></Button></div>;
  const current = assessmentQuestions[index];
  const choose = (answer: number) => setAnswers((existing) => { const next = [...existing]; next[index] = answer; return next; });
  const submit = async () => { const correct = assessmentQuestions.reduce((total, item, i) => total + (answers[i] === item[2] ? 1 : 0), 0); await completeAssessment(Math.round(correct / assessmentQuestions.length * 100), assessment.id); navigate('/employee/awareness'); };
  return <div className="quiz-page"><header className="quiz-top"><button onClick={() => navigate('/employee')}><X size={20}/>Keluar</button><div><ClipboardCheck size={20}/><strong>{assessment.type === 'Baseline' ? 'Assessment Awal' : 'Assessment Tindak Lanjut'}</strong></div><span>Pertanyaan {index + 1} dari {assessmentQuestions.length}</span></header><div className="quiz-progress"><span style={{ width: `${((index + 1) / assessmentQuestions.length) * 100}%` }}/></div><main className="quiz-main"><div className="quiz-number"><span>{index + 1}</span><div><strong>Pertanyaan {index + 1}</strong><small>Pilih satu jawaban</small></div></div><h1>{current[0]}</h1><div className="quiz-options">{current[1].map((answer, answerIndex) => <button key={answer} className={answers[index] === answerIndex ? 'selected' : ''} onClick={() => choose(answerIndex)}><span>{String.fromCharCode(65 + answerIndex)}</span><strong>{answer}</strong></button>)}</div><div className="quiz-controls"><Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft size={17}/>Sebelumnya</Button><Button disabled={answers[index] === undefined} onClick={() => index === assessmentQuestions.length - 1 ? void submit() : setIndex(index + 1)}>{index === assessmentQuestions.length - 1 ? 'Kirim Assessment' : 'Berikutnya'}<ArrowRight size={17}/></Button></div></main></div>;
}

export function ConnectedCertificates() {
  const navigate = useNavigate();
  const { certificates } = useProduct();
  const issued = certificates.filter((item) => item.status === 'Issued');
  return <><PageHeader title="Sertifikat"/><div className="certificate-register">{issued.length ? issued.map((item) => <article key={item.id}><div className="certificate-list-icon"><Award size={22}/></div><div><span>SERTIFIKAT PENYELESAIAN</span><h2>{item.courseTitle}</h2><p>Diterbitkan {item.issuedAt} · Nilai {item.score}/100</p><code>{item.id}</code></div><Button variant="secondary" onClick={() => navigate(`/employee/certificates/${item.courseId}`)}>Lihat Sertifikat</Button></article>) : <div className="clean-empty"><Award size={24}/><div><strong>Belum ada sertifikat</strong><p>Sertifikat diterbitkan setelah learning dan kuis modul dinyatakan lulus.</p></div></div>}</div></>;
}

export function ConnectedCampaignBuilder() {
  const navigate = useNavigate();
  const { createCampaign } = useProduct();
  const steps = ['Detail', 'Audiens', 'Learning', 'Pengukuran', 'Jadwal', 'Review'];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: 'Q4 Security Awareness 2026', objective: 'Mengurangi risiko phishing dan keamanan akun.', owner: 'Syarif Rahman', audience: 'All employees', employees: 200, learning: ['Phishing Awareness'], baselineEnabled: true, followUpEnabled: true, simulation: '', startDate: '2026-10-01', learningDueDate: '2026-11-30', endDate: '2026-12-15', status: 'Draft' as CampaignStatus });
  const toggleLearning = (title: string) => setForm((current) => ({ ...current, learning: current.learning.includes(title) ? current.learning.filter((item) => item !== title) : [...current.learning, title] }));
  const error = useMemo(() => form.endDate < form.learningDueDate ? 'Tanggal akhir kampanye harus setelah tenggat learning.' : form.learningDueDate < form.startDate ? 'Tenggat learning harus setelah tanggal mulai.' : '', [form.startDate, form.learningDueDate, form.endDate]);
  const save = async () => {
    const assessment = [form.baselineEnabled ? 'Baseline' : '', form.followUpEnabled ? 'Follow-up' : ''].filter(Boolean).join(' + ') || 'Tidak ada';
    const id = await createCampaign({ name: form.name, objective: form.objective, owner: form.owner, audience: form.audience, employees: form.employees, learning: form.learning, baselineEnabled: form.baselineEnabled, followUpEnabled: form.followUpEnabled, assessment, simulation: form.simulation || undefined, startDate: form.startDate, learningDueDate: form.learningDueDate, endDate: form.endDate, schedule: `${form.startDate} – ${form.endDate}`, status: 'Draft', completion: 0, score: null, baseline: null });
    if(id)navigate(`/admin/campaigns/${id}?created=1`);
  };
  return <><BackButton label="Kampanye"/><PageHeader title="Buat Kampanye"/><div className="builder-shell connected-builder"><aside className="builder-steps">{steps.map((label, index) => <button key={label} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => index <= step && setStep(index)}><span>{index < step ? <Check size={13}/> : index + 1}</span><strong>{label}</strong></button>)}</aside><section className="builder-content"><div className="builder-heading"><span>LANGKAH {step + 1} DARI 6</span><h2>{steps[step]}</h2></div>
    {step === 0 && <div className="form-stack"><label>Nama kampanye<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Tujuan<textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })}/></label><label>Pemilik<select value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}><option>Syarif Rahman</option><option>Diana Kusuma</option></select></label></div>}
    {step === 1 && <div className="choice-list">{[{ name: 'All employees', count: 200, meta: '7 departemen' }, { name: 'Finance', count: 32, meta: 'Departemen Finance' }, { name: 'Sales', count: 35, meta: 'Departemen Sales' }, { name: 'Selected employees', count: 25, meta: '25 karyawan terpilih' }].map((item) => <label key={item.name} className={form.audience === item.name ? 'selected' : ''}><input type="radio" checked={form.audience === item.name} onChange={() => setForm({ ...form, audience: item.name, employees: item.count })}/><Users size={18}/><span><strong>{item.name}</strong><small>{item.count} karyawan · {item.meta}</small></span></label>)}</div>}
    {step === 2 && <div className="builder-options"><div className="builder-note"><BookOpen size={18}/><p>Learning berstatus <strong>Wajib</strong> dan menentukan penyelesaian kampanye.</p></div>{courses.map((course) => <label key={course.id} className={form.learning.includes(course.title) ? 'selected' : ''}><input type="checkbox" checked={form.learning.includes(course.title)} onChange={() => toggleLearning(course.title)}/><span><strong>{course.title}</strong><small>{course.category} · {course.duration} menit · {course.questions} pertanyaan · Wajib</small></span></label>)}</div>}
    {step === 3 && <div className="measurement-options"><label className={form.baselineEnabled ? 'selected' : ''}><input type="checkbox" checked={form.baselineEnabled} onChange={(event) => setForm({ ...form, baselineEnabled: event.target.checked })}/><ClipboardCheck size={20}/><span><strong>Assessment Awal</strong><small>Mengukur pemahaman sebelum learning dimulai.</small></span></label><label className={form.followUpEnabled ? 'selected' : ''}><input type="checkbox" checked={form.followUpEnabled} onChange={(event) => setForm({ ...form, followUpEnabled: event.target.checked })}/><Target size={20}/><span><strong>Assessment Tindak Lanjut</strong><small>Terbuka setelah seluruh learning wajib selesai.</small></span></label><label className={Boolean(form.simulation) ? 'selected' : ''}><input type="checkbox" checked={Boolean(form.simulation)} onChange={(event) => setForm({ ...form, simulation: event.target.checked ? 'Password Expiration' : '' })}/><ShieldCheck size={20}/><span><strong>Simulasi Phishing</strong><small>Mengukur perilaku; tidak mengumpulkan kata sandi asli.</small></span></label>{form.simulation && <label>Template simulasi<select value={form.simulation} onChange={(event) => setForm({ ...form, simulation: event.target.value })}><option>Password Expiration</option><option>Shared Document Invitation</option><option>Delivery Notification</option><option>Executive Payment Request</option></select></label>}</div>}
    {step === 4 && <div className="form-stack schedule-grid"><label>Tanggal mulai<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })}/></label><label>Tenggat learning<input type="date" value={form.learningDueDate} onChange={(event) => setForm({ ...form, learningDueDate: event.target.value })}/></label><label>Tanggal akhir<input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })}/></label><label>Pengingat<select><option>7 hari sebelum tenggat</option><option>3 dan 7 hari sebelum tenggat</option><option>Tanpa pengingat otomatis</option></select></label>{error && <p className="form-error">{error}</p>}</div>}
    {step === 5 && <div className="campaign-review-v2"><div><span>Kampanye</span><strong>{form.name}</strong></div><div><span>Audiens</span><strong>{form.audience} · {form.employees} karyawan</strong></div><div><span>Learning</span><strong>{form.learning.join(', ') || 'Belum dipilih'}</strong></div><div><span>Assessment</span><strong>{form.baselineEnabled ? 'Awal' : 'Tanpa baseline'} · {form.followUpEnabled ? 'Tindak lanjut' : 'Tanpa tindak lanjut'}</strong></div><div><span>Simulasi</span><strong>{form.simulation || 'Tidak digunakan'}</strong></div><div><span>Jadwal</span><strong>{form.startDate} – {form.endDate}</strong></div><div><span>Setelah disimpan</span><strong>Kampanye berstatus Draft. Tugas dibuat saat kampanye diluncurkan.</strong></div></div>}
    <footer className="builder-footer"><Button variant="secondary" onClick={() => step === 0 ? navigate('/admin/campaigns') : setStep(step - 1)}>{step === 0 ? 'Batal' : <><ArrowLeft size={16}/>Kembali</>}</Button><Button disabled={!form.name.trim() || !form.objective.trim() || (step >= 2 && form.learning.length === 0) || Boolean(error)} onClick={() => step === 5 ? void save() : setStep(step + 1)}>{step === 5 ? 'Simpan sebagai Draft' : <>Lanjut<ArrowRight size={16}/></>}</Button></footer></section></div></>;
}
