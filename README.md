# Cloud-Based Attendance Management System

A modern, responsive web application for a college **Cloud Computing Mini Project**.

Built with **React.js**, **Vite**, **Tailwind CSS**, and integrated with **Google Firebase Authentication** and **Cloud Firestore Database**, with interactive analytics powered by **Recharts** and icons from **Lucide React**.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC)
- **Admin** (role assigned by a trusted administrator):
  - Full system oversight and aggregate metrics.
  - CRUD management for **Students**, **Teachers**, **Classes/Batches**, and **Courses/Subjects**.
  - Institutional settings (attendance threshold, late penalty weights).
  - Optional sample-data action that only adds missing documents.
- **Teacher**:
  - View assigned classes and subjects.
  - Interactive attendance marking interface (Present, Absent, Late).
  - **Duplicate Session Prevention**: detects an existing session for a class, subject, and date. Only its recording teacher or an admin can update it.
    - Inspect attendance history within the account's authorized scope.
- **Student**:
  - Personal attendance dashboard with percentage calculation from the student's own attendance records.
  - **Debarment Risk Warning**: automated red alert banner when attendance drops below the 75% threshold.
  - Subject-wise breakdown with graphical progress bars.
  - Monthly attendance trends and recent mark history.

### 2. College Attendance Calculation Policy
- **Formula**:
  $$\text{Attendance Percentage} = \left(\frac{\text{Classes Attended}}{\text{Total Classes Conducted}}\right) \times 100$$
- **Late Policy Rule**: Present awards $1.0$ credit, Late awards $0.5$ credit (customizable in Settings), and Absent awards $0.0$ credit.
- **Minimum Requirement**: $75\%$ minimum attendance to qualify for semester examinations.

### 3. Reports & Analytics Engine
- Daily attendance logs.
- Monthly attendance trends.
- Student-wise attendance summary.
- Subject-wise performance.
- Class-wise attendance percentages.
- **One-Click CSV Export**: exports the currently loaded records with UTF-8 BOM encoding for Microsoft Excel.

### 4. Firebase and Local Demo Modes
- With a complete Firebase web configuration, the app uses Firebase Email/Password Authentication and Cloud Firestore. Cloud read/write errors are shown instead of being hidden by local data.
- Without Firebase configuration, the login screen explicitly offers a separate local demo mode backed by browser storage. Demo data is not cloud data and is never automatically seeded or reset.
- Client-side route checks improve navigation UX; Firestore Security Rules are the authorization boundary for cloud data.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS + Modern Glassmorphism |
| **Cloud Database** | Google Firebase Cloud Firestore |
| **Authentication** | Firebase Auth (Email/Password) + Firestore role profiles |
| **Visual Analytics** | Recharts (AreaCharts, BarCharts) |
| **Iconography** | Lucide React |
| **Export Engine** | Custom UTF-8 CSV Generator |

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; v24 tested)
- npm (installed with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/Cloud-Attendance-System.git
cd Cloud-Attendance-System
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open the URL printed by Vite (normally [http://localhost:5173](http://localhost:5173)).

---

## 🔑 Demo Login Credentials (Quick Evaluation)

When Firebase is not configured, the login screen provides **Local Demo Mode** buttons. These do not authenticate with Firebase or access cloud data:

| Role | Demo Account | Access Level |
|---|---|---|
| **Administrator** | Admin Demo button | Local academic management & settings |
| **Faculty Member** | Teacher Demo button | Local attendance, courses & history |
| **Student** | Student Demo button | Local attendance dashboard |

*(In local demo mode, the demo buttons do not use Firebase credentials. This mode is for UI evaluation only.)*

---

## ☁️ Google Firebase Project Setup Guide

To connect the application to your own live Google Cloud Firebase project:

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a project name (e.g., `college-attendance-system`).
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2: Enable Firebase Authentication
1. In the Firebase console left menu, go to **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, choose **Email/Password** and toggle **Enable**.
4. Click **Save**.

### Step 3: Create Cloud Firestore Database
1. In the Firebase console left menu, go to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose a cloud location close to your region (e.g., `asia-south1` or `us-central`).
4. Create the database. Do not leave test-mode rules in place for application use.
5. Click **Create**.

### Step 4: Register Web App & Obtain Config
1. In the Firebase console, click the **Project Overview** gear icon ⚙️ -> **Project settings**.
2. Under the **General** tab, scroll down to **Your apps** and click the Web icon `</>`.
3. Enter an app nickname (e.g., `Attendance-Web`) and click **Register app**.
4. Copy the keys provided inside the `firebaseConfig` snippet.

### Step 5: Configure Environment Variables
Create a file named `.env` in the project root (copy from `.env.example`):

```bash
Copy-Item .env.example .env
```

Fill in your actual Firebase values:
```env
VITE_FIREBASE_API_KEY=AIzaSyD-your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

These Firebase web-app identifiers are used by the browser SDK; never put service-account credentials, Admin SDK private keys, or passwords in `.env` or frontend code. Restart the dev server (`npm run dev`) after changing `.env`.

### Step 6: Prepare trusted account profiles and rules
1. Public registration creates a student profile only. It cannot grant admin/teacher roles or link a student record.
2. Create the first admin user in Firebase Authentication. In Firestore, create `users/{that-auth-uid}` with the trusted role `admin`, matching `uid` and `email`, and a `displayName`. Do this through a trusted Firebase Console account or a secure server-side Admin SDK—not from the browser.
3. Create teacher Auth users and their `users/{uid}` profiles with trusted `role: "teacher"` and `teacherId` set to the teacher document's Firestore document ID. Manage class/subject assignments in that admin-managed teacher document. Link registered students to an existing student document by setting trusted `studentId` on their user profile. Do not let users set these fields themselves.
4. Review `firestore.rules`; it allows self-registration only for restricted student profiles, admin-only role assignment, teacher assignment-scoped access, and student-owned attendance reads.
5. Only after reviewing the rules and creating a trusted admin profile, replace the Firestore Rules in Firebase Console with this project’s local `firestore.rules` and publish them. Publishing is a separate manual action; this project does not do it automatically.

### Step 7: Optional sample data
The admin Settings page has an explicit **Add Missing Sample Data** action. It adds only documents that do not already exist and does not create auth users or assign roles. It is optional; no data is seeded, reset, or overwritten on startup.

### Local Firebase Emulator testing
The emulator mode uses a fixed demo project ID and local endpoints. It does not use production Firebase configuration. In the emulator mode, Vite loads environment files only from `src/firebase` instead of the project root.

1. In one terminal, start only the Auth and Firestore Emulators:
   ```powershell
   npm run emulators:demo
   ```
2. In a second terminal, start the app in emulator mode:
   ```powershell
   npm run dev:emulator
   ```
3. Open the app at `http://localhost:3000` and the Emulator UI at `http://localhost:4000`.
4. Register a student through the app. The Auth account and its student profile are created in the emulators.
5. To test staff roles, create Admin and Teacher Auth accounts in the Auth Emulator UI. In the Firestore Emulator UI, add `users/{Auth UID}` profiles for them with trusted lowercase `role` values. For Teacher, provision its `teacherId` document and assignments. For Student, link `studentId` to a student document with a `classId`. These are local emulator fixtures only.
6. Add the required local class, subject, teacher, and student documents in the Firestore Emulator UI, then sign in through the app to test each dashboard. As Teacher, mark a session for a class with 3 or 4 students; confirm the session and records appear in Firestore Emulator UI and attendance is visible to those students.

The emulator ports are Auth `9099`, Firestore `54322`, and Emulator UI `4000`. Do not run the normal production-mode `npm run dev` for this emulator-only test.

---

## 🛡️ Role Assignment

Admin and teacher roles, along with student/teacher record links and class assignments, are trusted administrative data. The browser registration flow cannot assign them. Do not use a frontend passcode, environment variable, or hidden UI control as authorization.

---

## 🗄️ Firestore Database Schema

The cloud database uses 7 normalized collections:

```
├── users/ (User authentication & role documents)
│   └── {userId}: { uid, email, displayName, role: 'admin'|'teacher'|'student', department, phone }
│
├── students/ (Enrolled student master records)
│   └── {studentId}: { id, rollNumber, name, email, classId, className, phone, guardianName, guardianPhone, status }
│
├── teachers/ (Faculty master records)
│   └── {teacherId}: { id, teacherId, name, email, department, designation, assignedClasses: [], assignedSubjects: [] }
│
├── classes/ (Cohort batches)
│   └── {classId}: { id, name, department, semester, academicYear, room, totalStudents }
│
├── subjects/ (Academic courses)
│   └── {subjectId}: { id, code, name, classId, className, teacherId, teacherName, credits, department }
│
├── attendanceSessions/ (Lecture attendance session summaries)
│   └── {sessionId}: { id, classId, className, subjectId, subjectCode, date, slot, teacherId, teacherName, presentCount, absentCount, lateCount, totalCount, remarks, createdAt }
│
└── attendanceRecords/ (Individual student attendance marks)
    └── {recordId}: { id, sessionId, studentId, studentName, studentRoll, classId, subjectId, date, status: 'Present'|'Absent'|'Late', remarks, teacherId, updatedAt }
```

---

## 📦 Production Build & Deployment

To generate an optimized production bundle:
```bash
npm run build
```
This produces an optimized `dist/` directory with code splitting (`vendor-react`, `vendor-recharts`, `vendor-firebase`, `vendor-icons`).

### Deploy to Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project, set public directory to "dist", configure as single-page app: Yes
firebase deploy --only hosting
```

---

## 🎓 College Viva & Evaluation Notes

1. **Why Cloud Computing for Attendance?**
   - Traditional paper attendance or isolated spreadsheets suffer from tampering, data loss, and delays. Cloud Firestore offers multi-region replication, sub-second queries, and automated backups.
2. **How is data integrity maintained during marking?**
   - Attendance sessions and individual records are saved using one Firestore `writeBatch()` commit (either the batch is accepted or none of its writes are).
3. **How does duplicate prevention work?**
   - Before opening a session, the system queries `attendanceSessions` for composite key matches `(classId == X && subjectId == Y && date == Z)`. If found, it routes to edit mode instead of creating duplicate records.
4. **How is the 75% rule calculated?**
   - In Firebase mode, attendance percentage is calculated from the student's own permitted records: $\frac{\text{Present} + \text{late weight} \times \text{Late}}{\text{Total Sessions}} \times 100$.
