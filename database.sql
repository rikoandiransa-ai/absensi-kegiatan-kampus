-- ==========================================
-- Campus Activity System Database Schema
-- DBMS: MySQL
-- ==========================================

CREATE DATABASE IF NOT EXISTS campus_activity_db;
USE campus_activity_db;

-- 1. Users Table (Handles system authentication and roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Students Table (Holds detailed student profiles)
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    study_program VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (username) 
        REFERENCES users(username) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Activities Table (Campus events and sessions)
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    organizer VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active' or 'Completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Attendance Table (Students' registration & check-in for activities)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    activity_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Hadir', -- 'Hadir' (Present), 'Izin' (Excused), 'Sakit' (Sick), 'Alfa' (Absent), 'Terdaftar' (Registered)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_activity FOREIGN KEY (activity_id) 
        REFERENCES activities(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    -- Enforces that a student cannot register for the same activity twice
    UNIQUE KEY uq_student_activity (student_id, activity_id),
    INDEX idx_student_id (student_id),
    INDEX idx_activity_id (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- DUMMY DATA SEEDING
-- ==========================================

-- Seed default Administrator (Password: 'admin' -> hashed)
-- Seed student users (Passwords are also hashed)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$hjtvIAA69nZ8tKnC8m1zKOJBZ4aeNjCBLMhzcIwcmSNrGnnn7znk6', 'admin'),
('student1', '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS', 'student'),
('student2', '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS', 'student'),
('student3', '$2b$10$yAM.q4trkUUXnijUefFabuuuZz6eg1s0Jh8PHpBBQsNipr5CtUudS', 'student');

-- Seed Student details
INSERT INTO students (student_id, name, study_program, faculty, email, username) VALUES
('202601001', 'Alice Johnson', 'Computer Science', 'Science and Technology', 'alice@campus.edu', 'student1'),
('202601002', 'Bob Smith', 'Information Systems', 'Science and Technology', 'bob@campus.edu', 'student2'),
('202601003', 'Charlie Brown', 'Electrical Engineering', 'Engineering', 'charlie@campus.edu', 'student3');

-- Seed Activities
INSERT INTO activities (name, description, date, time, location, organizer, status) VALUES
('Campus Hackathon 2026', 'A 24-hour coding challenge for building innovative campus solutions.', '2026-07-10', '09:00:00', 'Main Auditorium', 'CS Student Union', 'Active'),
('AI & Machine Learning Seminar', 'An introductory session on generative models and their applications in education.', '2026-07-12', '13:30:00', 'Seminar Hall B', 'AI Research Lab', 'Active'),
('Career Fair 2026', 'Connect with top-tier companies and explore internship opportunities.', '2026-06-28', '10:00:00', 'Student Center', 'University Career Office', 'Completed');

-- Seed Attendance (Registrations & Statuses)
INSERT INTO attendance (student_id, activity_id, date, time, status) VALUES
('202601001', 1, '2026-07-10', '09:05:00', 'Hadir'),
('202601002', 1, '2026-07-10', '09:12:00', 'Hadir'),
('202601003', 2, '2026-07-12', '13:28:00', 'Hadir'),
('202601001', 3, '2026-06-28', '10:15:00', 'Hadir'),
('202601002', 3, '2026-06-28', '10:02:00', 'Hadir'),
('202601003', 3, '2026-06-28', '00:00:00', 'Alfa');
