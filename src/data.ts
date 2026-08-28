import type { Course, Employee, ScoreLevel } from './types';

export const awarenessTrend = [
  { month: 'May', score: 67 },
  { month: 'Jun', score: 71 },
  { month: 'Jul', score: 74 },
  { month: 'Aug', score: 78 },
];

export const topics = [
  { name: 'Phishing Awareness', short: 'Phishing', score: 62 },
  { name: 'Social Engineering', short: 'Social Engineering', score: 68 },
  { name: 'Password Security', short: 'Password Security', score: 86 },
  { name: 'Data Protection', short: 'Data Protection', score: 79 },
  { name: 'Safe Browsing', short: 'Safe Browsing', score: 83 },
];

export const departments = [
  { name: 'Engineering', employees: 50, score: 86, completion: 92 },
  { name: 'HR', employees: 15, score: 84, completion: 93 },
  { name: 'Marketing', employees: 23, score: 81, completion: 87 },
  { name: 'Operations', employees: 30, score: 76, completion: 80 },
  { name: 'Finance', employees: 32, score: 69, completion: 75 },
  { name: 'Sales', employees: 35, score: 67, completion: 71 },
  { name: 'Management', employees: 15, score: 80, completion: 93 },
];

const employeeSeed = [
  ['andini-putri', 'Andini Putri', 'Finance', 72, 'Phishing', 'Completed', '12 min ago'],
  ['rizky-ramadhan', 'Rizky Ramadhan', 'Operations', 55, 'Social Engineering', 'Completed', '1 hr ago'],
  ['muhammad-akbar', 'Muhammad Akbar', 'Sales', 58, 'Phishing', 'In Progress', '2 hrs ago'],
  ['nadia-yusuf', 'Nadia Yusuf', 'Finance', 61, 'Data Protection', 'Completed', 'Yesterday'],
  ['fajar-pratama', 'Fajar Pratama', 'Engineering', 89, 'Social Engineering', 'Completed', 'Today'],
  ['siti-rahma', 'Siti Rahma', 'HR', 85, 'Safe Browsing', 'Completed', 'Yesterday'],
  ['dewi-lestari', 'Dewi Lestari', 'Marketing', 82, 'Phishing', 'Completed', '2 days ago'],
  ['ahmad-fauzan', 'Ahmad Fauzan', 'Engineering', 91, 'Data Protection', 'Completed', 'Today'],
  ['bunga-sari', 'Bunga Sari', 'Sales', 66, 'Password Security', 'In Progress', '3 days ago'],
  ['dimas-saputra', 'Dimas Saputra', 'Operations', 74, 'Phishing', 'Completed', 'Yesterday'],
  ['eka-wulandari', 'Eka Wulandari', 'Finance', 71, 'Social Engineering', 'Completed', '2 days ago'],
  ['galih-maulana', 'Galih Maulana', 'Engineering', 87, 'Phishing', 'Completed', '4 hrs ago'],
  ['intan-permata', 'Intan Permata', 'Marketing', 79, 'Data Protection', 'In Progress', 'Yesterday'],
  ['joko-susanto', 'Joko Susanto', 'Operations', 64, 'Safe Browsing', 'Not Started', '8 days ago'],
  ['kartika-dewi', 'Kartika Dewi', 'HR', 83, 'Phishing', 'Completed', '3 hrs ago'],
  ['lukman-hakim', 'Lukman Hakim', 'Sales', 68, 'Social Engineering', 'In Progress', '3 days ago'],
  ['maya-anjani', 'Maya Anjani', 'Finance', 77, 'Phishing', 'Completed', 'Today'],
  ['naufal-hidayat', 'Naufal Hidayat', 'Management', 88, 'Data Protection', 'Completed', '2 days ago'],
];

export const employees: Employee[] = employeeSeed.map((item, index) => {
  const [id, name, department, score, weakest, status, lastActivity] = item as [string, string, string, number, string, Employee['status'], string];
  const assigned = index % 3 === 0 ? 4 : 5;
  const completed = status === 'Completed' ? assigned : status === 'In Progress' ? assigned - 2 : assigned - 3;
  return {
    id,
    name,
    initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2),
    email: `${id.replace('-', '.')}@acme.co.id`,
    department,
    assigned,
    completed,
    completion: Math.round((completed / assigned) * 100),
    score,
    weakest,
    status,
    lastActivity,
  };
});

export const courses: Course[] = [
  { id: 'phishing-awareness', title: 'Phishing Awareness', category: 'Phishing', duration: 7, questions: 8, description: 'Learn how to identify suspicious emails, links, attachments, and common phishing techniques.', assigned: 200, completion: 74, icon: 'mail' },
  { id: 'password-account-security', title: 'Password & Account Security', category: 'Account Security', duration: 6, questions: 6, description: 'Learn password best practices, MFA, and how to protect company accounts.', assigned: 168, completion: 88, icon: 'key' },
  { id: 'social-engineering', title: 'Social Engineering', category: 'Social Engineering', duration: 8, questions: 8, description: 'Understand manipulation techniques used by attackers and how to respond safely.', assigned: 120, completion: 67, icon: 'users' },
  { id: 'data-protection-basics', title: 'Data Protection Basics', category: 'Data Protection', duration: 7, questions: 7, description: 'Learn how to safely handle sensitive company and customer information.', assigned: 184, completion: 81, icon: 'database' },
  { id: 'safe-browsing-device-security', title: 'Safe Browsing & Device Security', category: 'Device Security', duration: 6, questions: 6, description: 'Learn safe browsing habits and essential device security practices.', assigned: 142, completion: 79, icon: 'shield' },
  { id: 'business-email-compromise', title: 'Business Email Compromise', category: 'Email Security', duration: 8, questions: 7, description: 'Recognize executive impersonation, payment diversion, and urgent business email requests.', assigned: 96, completion: 63, icon: 'mail' },
  { id: 'secure-remote-working', title: 'Secure Remote Working', category: 'Workplace Security', duration: 6, questions: 6, description: 'Protect company information while working from home, shared spaces, or public networks.', assigned: 118, completion: 72, icon: 'shield' },
];

export const quizQuestions = [
  { question: 'You receive an email from “IT Support” asking you to reset your password immediately using an unfamiliar link. What should you do?', answers: ['Click the link immediately', 'Reply with your current password', 'Verify the request through an official channel', 'Forward it to coworkers'], correct: 2 },
  { question: 'Which detail is the strongest warning sign in an unexpected invoice email?', answers: ['It uses the company logo', 'The attachment is an executable file', 'It arrives during work hours', 'It includes a signature'], correct: 1 },
  { question: 'A senior executive urgently asks you by email to purchase gift cards. What is the safest response?', answers: ['Act quickly to avoid delay', 'Confirm the request through a known channel', 'Send the codes by email', 'Ask a coworker to pay'], correct: 1 },
  { question: 'What should you inspect before opening a link in an email?', answers: ['The font style', 'The email length', 'The actual destination URL', 'The sender’s job title'], correct: 2 },
  { question: 'A login page looks familiar but its web address is slightly misspelled. What should you do?', answers: ['Log in to test it', 'Close it and visit the official site directly', 'Use a different password', 'Refresh the page'], correct: 1 },
  { question: 'What is the safest action with an unexpected attachment from a known contact?', answers: ['Open it because you know the sender', 'Disable antivirus first', 'Verify with the sender through another channel', 'Upload it to a public website'], correct: 2 },
  { question: 'Which request should always raise concern?', answers: ['A meeting invitation', 'A request to share your password or MFA code', 'A newsletter subscription', 'A calendar update'], correct: 1 },
  { question: 'How should you handle a suspected phishing message?', answers: ['Delete it without telling anyone', 'Reply and ask if it is real', 'Use the company reporting process', 'Share it in a group chat'], correct: 2 },
];

export function scoreLevel(score: number): ScoreLevel {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'High Risk';
}
