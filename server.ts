import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { DbInstance, User, Student, Activity, Attendance } from './server/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.GEMINI_API_KEY || 'campus-activity-secret-key-123';

// Express middleware
app.use(express.json());

// Extend express Request interface to support JWT user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: 'admin' | 'student';
        student_id?: string;
      };
    }
  }
}

// Authentication Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired access token' });
      return;
    }
    req.user = decoded;
    next();
  });
};

// Route security assertions
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Administrator privilege required' });
    return;
  }
  next();
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/login
app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username/Student ID and Password are required' });
    return;
  }

  // 1. Check if username is direct username
  let dbUser = DbInstance.findUserByUsername(username);
  let student: Student | undefined;

  // 2. If user not found, check if it's a student_id
  if (!dbUser) {
    student = DbInstance.findStudentById(username);
    if (student) {
      dbUser = DbInstance.findUserByUsername(student.username);
    }
  } else {
    // If found by username, try to load student profile if role is 'student'
    if (dbUser.role === 'student') {
      student = DbInstance.findStudentByUsername(dbUser.username);
    }
  }

  if (!dbUser) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  // Only allow admin logins
  if (dbUser.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Only administrators are authorized to log in.' });
    return;
  }

  // Verify password hash
  const isValid = bcrypt.compareSync(password, dbUser.password_hash);
  if (!isValid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  // Generate JWT Session Token
  const token = jwt.sign(
    { 
      username: dbUser.username, 
      role: dbUser.role,
      student_id: student?.student_id
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      username: dbUser.username,
      role: dbUser.role,
      name: student ? student.name : 'Universitas Anak Bangsa',
      student_id: student?.student_id,
      email: student?.email,
      study_program: student?.study_program,
      faculty: student?.faculty
    }
  });
});

// ==========================================
// STUDENT PROFILE CRUD
// ==========================================

// GET /api/students - List all students
app.get('/api/students', authenticateToken, (req: Request, res: Response) => {
  const students = DbInstance.getStudents();
  res.json(students);
});

// POST /api/students - Add student (accessible to anyone)
app.post('/api/students', authenticateToken, (req: Request, res: Response) => {
  const { student_id, name, study_program, faculty, email, username, password } = req.body;

  if (!student_id || !name || !study_program || !faculty || !email || !username || !password) {
    res.status(400).json({ message: 'All student fields are required' });
    return;
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const newStudent = DbInstance.createStudent({
      student_id,
      name,
      study_program,
      faculty,
      email,
      username,
    }, passwordHash);

    res.status(201).json(newStudent);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create student' });
  }
});

// PUT /api/students/:id - Edit student (accessible to anyone)
app.put('/api/students/:id', authenticateToken, (req: Request, res: Response) => {
  const student_id = req.params.id;
  const { name, study_program, faculty, email, password } = req.body;

  try {
    const updated = DbInstance.updateStudent(student_id, {
      name,
      study_program,
      faculty,
      email,
    }, password || undefined);

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Delete student (accessible to anyone)
app.delete('/api/students/:id', authenticateToken, (req: Request, res: Response) => {
  const student_id = req.params.id;

  try {
    DbInstance.deleteStudent(student_id);
    res.json({ success: true, message: 'Student and related credentials successfully deleted' });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Student not found' });
  }
});

// ==========================================
// CAMPUS ACTIVITIES CRUD
// ==========================================

// GET /api/activity - List all activities
app.get('/api/activity', authenticateToken, (req: Request, res: Response) => {
  const activities = DbInstance.getActivities();
  res.json(activities);
});

// POST /api/activity - Add activity
app.post('/api/activity', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { name, description, date, time, location, organizer, status } = req.body;

  if (!name || !date || !time || !location || !organizer) {
    res.status(400).json({ message: 'Name, Date, Time, Location, and Organizer are required' });
    return;
  }

  try {
    const newActivity = DbInstance.createActivity({
      name,
      description: description || '',
      date,
      time,
      location,
      organizer,
      status: status || 'Active',
    });

    res.status(201).json(newActivity);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create activity' });
  }
});

// PUT /api/activity/:id - Edit activity
app.put('/api/activity/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const activity_id = parseInt(req.params.id, 10);
  const { name, description, date, time, location, organizer, status } = req.body;

  if (isNaN(activity_id)) {
    res.status(400).json({ message: 'Invalid Activity ID' });
    return;
  }

  try {
    const updated = DbInstance.updateActivity(activity_id, {
      name,
      description,
      date,
      time,
      location,
      organizer,
      status,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update activity' });
  }
});

// DELETE /api/activity/:id - Delete activity
app.delete('/api/activity/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const activity_id = parseInt(req.params.id, 10);

  if (isNaN(activity_id)) {
    res.status(400).json({ message: 'Invalid Activity ID' });
    return;
  }

  try {
    DbInstance.deleteActivity(activity_id);
    res.json({ success: true, message: 'Activity successfully deleted' });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Activity not found' });
  }
});

// ==========================================
// ATTENDANCE & REGISTRATION ENDPOINTS
// ==========================================

// POST /api/absensi - Register student to an activity (Attendance)
app.post('/api/absensi', authenticateToken, (req: Request, res: Response) => {
  const { student_id, activity_id, status, custom_date, custom_time } = req.body;

  if (!student_id || !activity_id) {
    res.status(400).json({ message: 'student_id and activity_id are required' });
    return;
  }

  try {
    const registration = DbInstance.registerAttendance(
      student_id,
      parseInt(activity_id, 10),
      status || 'Terdaftar',
      custom_date,
      custom_time
    );
    res.status(201).json(registration);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// GET /api/absensi - View all attendance logs (resolved relations)
app.get('/api/absensi', authenticateToken, (req: Request, res: Response) => {
  const attendance = DbInstance.getAttendance();
  const students = DbInstance.getStudents();
  const activities = DbInstance.getActivities();

  // Map and join records to supply full details
  const resolvedAttendance = attendance.map(a => {
    const student = students.find(s => s.student_id === a.student_id);
    const activity = activities.find(act => act.id === a.activity_id);

    return {
      id: a.id,
      student_id: a.student_id,
      student_name: student ? student.name : 'Unknown Student',
      study_program: student ? student.study_program : 'N/A',
      faculty: student ? student.faculty : 'N/A',
      email: student ? student.email : 'N/A',
      activity_id: a.activity_id,
      activity_name: activity ? activity.name : 'Unknown Activity',
      activity_organizer: activity ? activity.organizer : 'N/A',
      activity_status: activity ? activity.status : 'N/A',
      activity_date: activity ? activity.date : '',
      activity_time: activity ? activity.time : '',
      date: a.date,
      time: a.time,
      status: a.status,
    };
  });

  // Return all records so that anyone can see and manage registrations
  res.json(resolvedAttendance);
});

// PUT /api/absensi/:id - Marks/updates attendance status (accessible to anyone)
app.put('/api/absensi/:id', authenticateToken, (req: Request, res: Response) => {
  const attendance_id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(attendance_id) || !status) {
    res.status(400).json({ message: 'attendance_id and status are required' });
    return;
  }

  try {
    const updated = DbInstance.updateAttendanceStatus(attendance_id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Attendance record not found' });
  }
});

// DELETE /api/absensi/:id - Delete registration/attendance record (accessible to anyone)
app.delete('/api/absensi/:id', authenticateToken, (req: Request, res: Response) => {
  const attendance_id = parseInt(req.params.id, 10);

  if (isNaN(attendance_id)) {
    res.status(400).json({ message: 'Invalid attendance ID' });
    return;
  }

  try {
    DbInstance.deleteAttendance(attendance_id);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Attendance record not found' });
  }
});

// ==========================================
// ATTENDANCE SUMMARY ENDPOINT
// ==========================================

// GET /api/rekap - Attendance summary & reports
app.get('/api/rekap', authenticateToken, (req: Request, res: Response) => {
  const attendance = DbInstance.getAttendance();
  const students = DbInstance.getStudents();
  const activities = DbInstance.getActivities();

  const totalParticipants = students.length;
  const totalAttendance = attendance.filter(a => a.status === 'Hadir').length;
  const totalAbsences = attendance.filter(a => a.status === 'Alfa').length;
  const totalExcused = attendance.filter(a => a.status === 'Izin' || a.status === 'Sakit').length;
  const totalRegistered = attendance.filter(a => a.status === 'Terdaftar').length;

  // Summary by Activity
  const summaryByActivity = activities.map(act => {
    const records = attendance.filter(a => a.activity_id === act.id);
    return {
      activity_id: act.id,
      activity_name: act.name,
      organizer: act.organizer,
      status: act.status,
      participants: records.length,
      presents: records.filter(r => r.status === 'Hadir').length,
      absences: records.filter(r => r.status === 'Alfa').length,
      excused: records.filter(r => r.status === 'Izin' || r.status === 'Sakit').length,
      registered: records.filter(r => r.status === 'Terdaftar').length,
    };
  });

  // Summary by Date
  const summaryByDateMap: Record<string, { date: string; presents: number; absences: number; registered: number }> = {};
  attendance.forEach(a => {
    if (!summaryByDateMap[a.date]) {
      summaryByDateMap[a.date] = {
        date: a.date,
        presents: 0,
        absences: 0,
        registered: 0,
      };
    }
    if (a.status === 'Hadir') summaryByDateMap[a.date].presents++;
    else if (a.status === 'Alfa') summaryByDateMap[a.date].absences++;
    else if (a.status === 'Terdaftar') summaryByDateMap[a.date].registered++;
  });

  const summaryByDate = Object.values(summaryByDateMap).sort((a, b) => b.date.localeCompare(a.date));

  res.json({
    totals: {
      participants: totalParticipants,
      presents: totalAttendance,
      absences: totalAbsences,
      excused: totalExcused,
      registered: totalRegistered,
    },
    summaryByActivity,
    summaryByDate,
  });
});

// ==========================================
// VITE DEV SERVER & STATIC FILES ROUTING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for non-API client routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Campus Activity System server running at http://localhost:${PORT}`);
  });
}

startServer();
