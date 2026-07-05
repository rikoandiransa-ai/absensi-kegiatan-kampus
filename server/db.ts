import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'database_store.json');

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'student';
  created_at: string;
}

export interface Student {
  student_id: string; // NIM
  name: string;
  study_program: string;
  faculty: string;
  email: string;
  username: string; // references User.username
  created_at: string;
}

export interface Activity {
  id: number;
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  organizer: string;
  status: 'Active' | 'Completed';
  created_at: string;
}

export interface Attendance {
  id: number;
  student_id: string;
  activity_id: number;
  date: string; // Auto saved date YYYY-MM-DD
  time: string; // Auto saved time HH:MM
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alfa' | 'Terdaftar';
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  students: Student[];
  activities: Activity[];
  attendance: Attendance[];
  nextUserSeq: number;
  nextActivitySeq: number;
  nextAttendanceSeq: number;
}

// Default dummy data
const defaultData: DatabaseSchema = {
  users: [
    {
      id: 1,
      username: 'admin',
      // bcrypt hash for 'admin'
      password_hash: '$2b$10$hjtvIAA69nZ8tKnC8m1zKOJBZ4aeNjCBLMhzcIwcmSNrGnnn7znk6',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      username: 'student1',
      password_hash: '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS',
      role: 'student',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      username: 'student2',
      password_hash: '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS',
      role: 'student',
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      username: 'student3',
      password_hash: '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS',
      role: 'student',
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      username: 'student4',
      password_hash: '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS',
      role: 'student',
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      username: 'student5',
      password_hash: '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS',
      role: 'student',
      created_at: new Date().toISOString(),
    }
  ],
  students: [
    {
      student_id: '202601001',
      name: 'Andi Pratama',
      study_program: 'Computer Science',
      faculty: 'Science and Technology',
      email: 'andi@unaba.ac.id',
      username: 'student1',
      created_at: new Date().toISOString(),
    },
    {
      student_id: '202601002',
      name: 'Budi Santoso',
      study_program: 'Information Systems',
      faculty: 'Science and Technology',
      email: 'budi@unaba.ac.id',
      username: 'student2',
      created_at: new Date().toISOString(),
    },
    {
      student_id: '202601003',
      name: 'Citra Lestari',
      study_program: 'Electrical Engineering',
      faculty: 'Engineering',
      email: 'citra@unaba.ac.id',
      username: 'student3',
      created_at: new Date().toISOString(),
    },
    {
      student_id: '202601004',
      name: 'Dewi Wijaya',
      study_program: 'Management',
      faculty: 'Economics and Business',
      email: 'dewi@unaba.ac.id',
      username: 'student4',
      created_at: new Date().toISOString(),
    },
    {
      student_id: '202601005',
      name: 'Eko Prasetyo',
      study_program: 'Accounting',
      faculty: 'Economics and Business',
      email: 'eko@unaba.ac.id',
      username: 'student5',
      created_at: new Date().toISOString(),
    }
  ],
  activities: [
    {
      id: 1,
      name: 'Campus Hackathon 2026',
      description: 'A 24-hour coding challenge for building innovative campus solutions.',
      date: '2026-07-10',
      time: '09:00',
      location: 'Main Auditorium',
      organizer: 'CS Student Union',
      status: 'Active',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'AI & Machine Learning Seminar',
      description: 'An introductory session on generative models and their applications in education.',
      date: '2026-07-12',
      time: '13:30',
      location: 'Seminar Hall B',
      organizer: 'AI Research Lab',
      status: 'Active',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Career Fair 2026',
      description: 'Connect with top-tier companies and explore internship opportunities.',
      date: '2026-06-28',
      time: '10:00',
      location: 'Student Center',
      organizer: 'University Career Office',
      status: 'Completed',
      created_at: new Date().toISOString(),
    }
  ],
  attendance: [
    {
      id: 1,
      student_id: '202601001',
      activity_id: 1,
      date: '2026-07-10',
      time: '09:05',
      status: 'Hadir',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      student_id: '202601002',
      activity_id: 1,
      date: '2026-07-10',
      time: '09:12',
      status: 'Hadir',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      student_id: '202601003',
      activity_id: 2,
      date: '2026-07-12',
      time: '13:28',
      status: 'Hadir',
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      student_id: '202601001',
      activity_id: 3,
      date: '2026-06-28',
      time: '10:15',
      status: 'Hadir',
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      student_id: '202601002',
      activity_id: 3,
      date: '2026-06-28',
      time: '10:02',
      status: 'Hadir',
      created_at: new Date().toISOString(),
    },
    {
      id: 6,
      student_id: '202601003',
      activity_id: 3,
      date: '2026-06-28',
      time: '00:00',
      status: 'Alfa',
      created_at: new Date().toISOString(),
    }
  ],
  nextUserSeq: 7,
  nextActivitySeq: 4,
  nextAttendanceSeq: 7,
};

// Singleton DB Instance Reader/Writer
export class DbInstance {
  private static load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      this.save(defaultData);
      return defaultData;
    }
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading database file, resetting to defaults", e);
      this.save(defaultData);
      return defaultData;
    }
  }

  private static save(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Auth Operations
  static getUsers(): User[] {
    return this.load().users;
  }

  static findUserByUsername(username: string): User | undefined {
    return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  static createUser(username: string, passwordHash: string, role: 'admin' | 'student' = 'student'): User {
    const db = this.load();
    const newUser: User = {
      id: db.nextUserSeq++,
      username,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    this.save(db);
    return newUser;
  }

  static updateUserPassword(username: string, passwordHash: string) {
    const db = this.load();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      user.password_hash = passwordHash;
      this.save(db);
    }
  }

  static deleteUser(username: string) {
    const db = this.load();
    db.users = db.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    this.save(db);
  }

  // Student Operations
  static getStudents(): Student[] {
    return this.load().students;
  }

  static findStudentById(student_id: string): Student | undefined {
    return this.getStudents().find(s => s.student_id === student_id);
  }

  static findStudentByUsername(username: string): Student | undefined {
    return this.getStudents().find(s => s.username === username);
  }

  static createStudent(student: Omit<Student, 'created_at'>, passwordHash: string): Student {
    const db = this.load();
    
    // Check constraints
    if (db.students.some(s => s.student_id === student.student_id)) {
      throw new Error(`Student with ID ${student.student_id} already exists`);
    }
    if (db.students.some(s => s.email.toLowerCase() === student.email.toLowerCase())) {
      throw new Error(`Student with email ${student.email} already exists`);
    }
    if (db.users.some(u => u.username.toLowerCase() === student.username.toLowerCase())) {
      throw new Error(`Username ${student.username} is already taken`);
    }

    // Insert user credential record
    const newUser: User = {
      id: db.nextUserSeq++,
      username: student.username,
      password_hash: passwordHash,
      role: 'student',
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);

    // Insert student record
    const newStudent: Student = {
      ...student,
      created_at: new Date().toISOString(),
    };
    db.students.push(newStudent);

    this.save(db);
    return newStudent;
  }

  static updateStudent(student_id: string, updatedFields: Partial<Omit<Student, 'student_id' | 'username' | 'created_at'>>, newPassword?: string): Student {
    const db = this.load();
    const studentIndex = db.students.findIndex(s => s.student_id === student_id);
    if (studentIndex === -1) {
      throw new Error(`Student with ID ${student_id} not found`);
    }

    const currentStudent = db.students[studentIndex];

    // Validate email uniqueness if changing
    if (updatedFields.email && updatedFields.email.toLowerCase() !== currentStudent.email.toLowerCase()) {
      if (db.students.some(s => s.email.toLowerCase() === updatedFields.email!.toLowerCase())) {
        throw new Error(`Student with email ${updatedFields.email} already exists`);
      }
    }

    // Update student fields
    db.students[studentIndex] = {
      ...currentStudent,
      ...updatedFields,
    };

    // Update password in users table if supplied
    if (newPassword) {
      const user = db.users.find(u => u.username === currentStudent.username);
      if (user) {
        user.password_hash = bcrypt.hashSync(newPassword, 10);
      }
    }

    this.save(db);
    return db.students[studentIndex];
  }

  static deleteStudent(student_id: string) {
    const db = this.load();
    const student = db.students.find(s => s.student_id === student_id);
    if (!student) {
      throw new Error(`Student with ID ${student_id} not found`);
    }

    // Cascade delete student
    db.students = db.students.filter(s => s.student_id !== student_id);
    // Cascade delete user
    db.users = db.users.filter(u => u.username !== student.username);
    // Cascade delete attendance
    db.attendance = db.attendance.filter(a => a.student_id !== student_id);

    this.save(db);
  }

  // Activity Operations
  static getActivities(): Activity[] {
    return this.load().activities;
  }

  static findActivityById(id: number): Activity | undefined {
    return this.getActivities().find(a => a.id === id);
  }

  static createActivity(activity: Omit<Activity, 'id' | 'created_at'>): Activity {
    const db = this.load();
    const newActivity: Activity = {
      id: db.nextActivitySeq++,
      ...activity,
      created_at: new Date().toISOString(),
    };
    db.activities.push(newActivity);
    this.save(db);
    return newActivity;
  }

  static updateActivity(id: number, updatedFields: Partial<Omit<Activity, 'id' | 'created_at'>>): Activity {
    const db = this.load();
    const index = db.activities.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Activity with ID ${id} not found`);
    }

    db.activities[index] = {
      ...db.activities[index],
      ...updatedFields,
    };
    this.save(db);
    return db.activities[index];
  }

  static deleteActivity(id: number) {
    const db = this.load();
    const activity = db.activities.find(a => a.id === id);
    if (!activity) {
      throw new Error(`Activity with ID ${id} not found`);
    }

    db.activities = db.activities.filter(a => a.id !== id);
    // Cascade delete attendance
    db.attendance = db.attendance.filter(a => a.activity_id !== id);

    this.save(db);
  }

  // Attendance Operations
  static getAttendance(): Attendance[] {
    return this.load().attendance;
  }

  static registerAttendance(
    student_id: string, 
    activity_id: number, 
    customStatus?: Attendance['status'],
    customDate?: string,
    customTime?: string
  ): Attendance {
    const db = this.load();

    // 1. Verify student exists
    const student = db.students.find(s => s.student_id === student_id);
    if (!student) {
      throw new Error(`Student with ID ${student_id} not found`);
    }

    // 2. Verify activity exists and is Active
    const activity = db.activities.find(a => a.id === activity_id);
    if (!activity) {
      throw new Error(`Activity with ID ${activity_id} not found`);
    }

    // 3. Unique check: "Students may not register for more than one activity"
    // Interpretation: Students cannot register for multiple concurrent ACTIVE activities at the same time.
    // They can have only ONE registration across all 'Active' activities.
    if (activity.status === 'Active') {
      const activeRegistrations = db.attendance.filter(a => {
        if (a.student_id !== student_id) return false;
        const act = db.activities.find(ac => ac.id === a.activity_id);
        return act && act.status === 'Active';
      });

      if (activeRegistrations.length > 0) {
        throw new Error("Student is already registered in an ongoing active activity. You may not register for more than one active activity at a time.");
      }
    }

    // 4. Check unique constraint for student-activity combo
    if (db.attendance.some(a => a.student_id === student_id && a.activity_id === activity_id)) {
      throw new Error(`Student ${student_id} is already registered for this activity`);
    }

    // 5. Automatically record current date and time
    const now = new Date();
    const dateStr = customDate || now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = customTime || now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    const newAttendance: Attendance = {
      id: db.nextAttendanceSeq++,
      student_id,
      activity_id,
      date: dateStr,
      time: timeStr,
      status: customStatus || 'Terdaftar',
      created_at: now.toISOString(),
    };

    db.attendance.push(newAttendance);
    this.save(db);
    return newAttendance;
  }

  static updateAttendanceStatus(id: number, status: Attendance['status']): Attendance {
    const db = this.load();
    const index = db.attendance.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Attendance record with ID ${id} not found`);
    }

    db.attendance[index].status = status;
    this.save(db);
    return db.attendance[index];
  }

  static deleteAttendance(id: number) {
    const db = this.load();
    db.attendance = db.attendance.filter(a => a.id !== id);
    this.save(db);
  }
}
