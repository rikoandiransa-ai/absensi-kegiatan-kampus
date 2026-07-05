export interface User {
  id: number;
  username: string;
  role: 'admin' | 'student';
}

export interface Student {
  student_id: string;
  name: string;
  study_program: string;
  faculty: string;
  email: string;
  username: string;
}

export interface Activity {
  id: number;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  status: 'Active' | 'Completed';
}

export interface Attendance {
  id: number;
  student_id: string;
  student_name?: string;
  study_program?: string;
  faculty?: string;
  email?: string;
  activity_id: number;
  activity_name?: string;
  activity_organizer?: string;
  activity_status?: string;
  activity_date?: string;
  activity_time?: string;
  date: string;
  time: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa' | 'Terdaftar';
}

export interface AuthState {
  token: string | null;
  user: {
    username: string;
    role: 'admin' | 'student';
    name: string;
    student_id?: string;
    email?: string;
    study_program?: string;
    faculty?: string;
  } | null;
}

export interface RekapSummary {
  totals: {
    participants: number;
    presents: number;
    absences: number;
    excused: number;
    registered: number;
  };
  summaryByActivity: Array<{
    activity_id: number;
    activity_name: string;
    organizer: string;
    status: 'Active' | 'Completed';
    participants: number;
    presents: number;
    absences: number;
    excused: number;
    registered: number;
  }>;
  summaryByDate: Array<{
    date: string;
    presents: number;
    absences: number;
    registered: number;
  }>;
}
