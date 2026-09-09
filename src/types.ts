export type Role = 'super_admin' | 'admin' | 'manager' | 'employee';
export type AdminRole = Exclude<Role, 'employee'>;

export function isAdminRole(role: Role): role is AdminRole {
  return role !== 'employee';
}
export type ScoreLevel = 'Strong' | 'Good' | 'Needs Improvement' | 'High Risk';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  assigned: number;
  completed: number;
  completion: number;
  score: number;
  weakest: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  lastActivity: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  duration: number;
  questions: number;
  description: string;
  assigned: number;
  completion: number;
  icon: string;
}
