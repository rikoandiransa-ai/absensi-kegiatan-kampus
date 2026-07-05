# Campus Activity System - Full Stack Application

A modern, highly polished, and secure web application for managing campus activities, student profiles, and activity registration/attendance. It features a responsive layout following the requested deep blue and vibrant orange theme.

---

## 📂 Project Folder Structure

The project has a unified full-stack structure integrating **React (Vite)** on the frontend and **Node.js (Express)** on the backend:

```text
├── database_store.json     # Relational local persistent JSON store (with atomic writes)
├── database.sql            # Complete MySQL database relational DDL script & seeds
├── server.ts               # Primary Express app server entry point & REST APIs
├── server/
│   └── db.ts               # Database service mapping (with integrity & unique checks)
├── src/
│   ├── main.tsx            # React application entry point
│   ├── App.tsx             # Primary layout router and state manager
│   ├── index.css           # Global Tailwind CSS, custom animations, and print stylesheet
│   ├── types.ts            # Shared TypeScript interfaces (students, activities, etc.)
│   ├── context/
│   │   └── AuthContext.tsx # Centralized login session & token context
│   └── components/
│       ├── Sidebar.tsx     # Responsive action sidebar
│       ├── LoginView.tsx   # Elegant credentials login screen
│       ├── DashboardView.tsx # Bento statistics and Recharts activity graph
│       ├── StudentDataView.tsx # Students profiles list & CRUD modals
│       ├── ActivityDataView.tsx # Activities scheduler list & CRUD modals
│       ├── AttendanceView.tsx # Enrollment engine & attendance marking board
│       └── AttendanceSummaryView.tsx # Summaries, filter tools, CSV Excel & PDF prints
├── package.json            # Scripts & full-stack dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler options
```

---

## 🛠️ Installation & Setup

Follow these steps to run the application locally in your development environment:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (installed automatically with Node.js)
- [MySQL DBMS](https://www.mysql.com/) (to import the `.sql` schema for production)

### 1. Extract and Install Dependencies
In your workspace terminal, install the project libraries:
```bash
npm install
```

### 2. Set Up the Environment Variables
Create a `.env` file in the root directory by copying the example file:
```bash
cp .env.example .env
```
Ensure that any required variables are configured correctly.

### 3. Run the Development Server
Launch the unified full-stack server (runs both backend API and frontend Vite middleware on port 3000):
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

### 4. Build and Run in Production
To compile the frontend static bundle and compile the backend `server.ts` into a self-contained CommonJS script:
```bash
npm run build
npm start
```

---

## 🗄️ Relational Database Schema (MySQL)

For production deployment, import the included **`database.sql`** file into your MySQL database server.

### Relationships & Tables Map
1. **`users`**: Manages auth credentials. Contains user logins with encrypted passwords and roles (`admin` or `student`).
2. **`students`**: Linked to `users` via a `FOREIGN KEY (username) REFERENCES users(username)`. Holds student academic information.
3. **`activities`**: Holds scheduled events, locations, date/time, and status (`Active` or `Completed`).
4. **`attendance`**: Connects a student to an activity. Enforces integrity constraints:
   - `FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE`
   - `FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`
   - **Unique Index constraint**: A student can only register once per activity (`UNIQUE KEY uq_student_activity (student_id, activity_id)`).
   - **Overlap Validation**: Ensures students may only register for at most **one** ongoing *Active* activity at any given time.

---

## 🔑 Sample Credentials / Dummy Data

The application boots automatically with high-quality pre-seeded dummy data:

### Accounts:
- **Administrator**:
  - **Username:** `admin`
  - **Password:** `admin123`
- **Undergraduate Student**:
  - **Student ID (NIM):** `202601001` (or Username: `student1`)
  - **Password:** `admin123`

---

## 📝 Detailed Explanation of Each File

- **`server.ts`**: The core backend API engine. Handles CORS, JSON body parser, registers authentication routes, securable CRUD handlers, summary aggregates, and serves the static files or Vite dev middleware.
- **`server/db.ts`**: Simulates a relational MySQL client with ACID-like atomic operations, automatically saving updates to `database_store.json`. It guarantees relational foreign key integrity and student registration constraints.
- **`src/types.ts`**: Provides strict TypeScript types and enums, ensuring zero runtime data-type issues between components.
- **`src/context/AuthContext.tsx`**: Creates a central React AuthContext. Intercepts backend tokens, maps authorization headers, manages localStorage caching, and exports helper session hooks.
- **`src/App.tsx`**: Acts as the main route gateway. If unauthorized, displays the Login panel; otherwise, shows the top Navbar and dynamic views within the Sidebar canvas.
- **`src/index.css`**: Configures custom theme definitions (Plus Jakarta Sans font, specific colors, and transitions) and integrates **print media stylesheets** to ensure summary exports format beautifully into physical papers or PDFs.
- **`src/components/LoginView.tsx`**: Displays an elegant split login portal with illustrative descriptions and responsive error badges.
- **`src/components/DashboardView.tsx`**: Displays real-time student counts, totals, absences, upcoming schedules, and maps student attendance data onto interactive Recharts bar charts.
- **`src/components/StudentDataView.tsx`**: Provides administrative tables to search, filter, and run full CRUD operations (add, edit details, change password, delete student records) safely.
- **`src/components/ActivityDataView.tsx`**: Enables administrators to add, edit, or delete campus activities, and set statuses (`Active` / `Completed`).
- **`src/components/AttendanceView.tsx`**: A dashboard allowing students to quickly self-register for active events and administrators to mark attendance states (`Hadir`, `Alfa`, `Izin`, `Sakit`).
- **`src/components/AttendanceSummaryView.tsx`**: Aggregates metrics, groupings by date/activity, and provides instant client-side tools to download files into Microsoft Excel (CSV) or trigger optimized native browser print templates to export clean PDFs.
