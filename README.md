# FaceAttend — Smart Face Recognition Attendance System

**FaceAttend** is an enterprise-grade, clean, responsive, and production-ready web application for biometric facial attendance management. Designed for colleges, universities, research institutes, and modern enterprises.

---

## 🌟 Key Features

### Dual Role Architecture
- **Admin Portal**:
  - **Command Dashboard**: Live attendance counters, today's turnout percentage, 7-day trend charts, real-time activity stream, and quick action shortcuts.
  - **User Directory**: Search, department/class filtering, add/edit/delete users, and toggle account activation.
  - **Live Face Registration**: Camera viewfinder with facial alignment guides, real-time bounding box, instant 128-d descriptor extraction, and AES-256 encrypted biometric storage.
  - **Face Database Vault**: Search and audit enrolled biometric profiles, preview thumbnails, update or delete biometric descriptors.
  - **Attendance Management**: Filter check-in logs by date, user, department, and status (Present, Late, Absent). Includes CSV export and manual admin override.
  - **Analytics & Reports**: Visual comparison across departments, turnout rate trajectories, and downloadable CSV summaries.
  - **System Settings**: Configurable Late threshold time (e.g., 09:30 AM), Euclidean matching distance tolerance, institution name, and security audit logs.

- **Student / User Portal**:
  - **Personal Dashboard**: Today's check-in status, attendance percentage, punctuality metrics, and past records.
  - **1-Click Face Attendance**: Live camera scanner with instant face detection, automated matching against registered embeddings, duplicate check-in prevention, and celebratory UI.
  - **My Attendance History**: Filterable timeline of past attendance with timestamps, confidence scores, and CSV export.
  - **User Profile**: Account details, enrolled face profile status, and self-service password update.

---

## 🔒 Security & Biometrics Privacy

1. **No Raw Image Storage**: FaceAttend does not store full-resolution camera captures. It extracts a **128-dimensional floating-point vector** (descriptor).
2. **AES-256-GCM Biometric Encryption**: Every biometric descriptor is encrypted at rest using AES-256 authenticated encryption with randomized initialization vectors (IV) and authentication tags.
3. **No Biometric Data Leakage**: Biometric tensors are never exposed across public or normal API responses.
4. **Single-Entry Constraint**: Database-level unique constraint (`[userId, attendanceDate]`) prevents duplicate attendance on the same day.
5. **Secure Authentication**: Passwords hashed with `bcryptjs` (salt rounds = 10) and stateless JWT role-guarded middleware.

---

## 💻 Tech Stack

- **Frontend**:
  - React 18 + Vite + TypeScript
  - Tailwind CSS (Linear / Stripe-inspired clean design palette)
  - Lucide React (Clean vector iconography)
  - Recharts (Interactive Area & Bar analytics charts)
  - Canvas Confetti (Celebratory feedback upon attendance confirmation)
  - `@vladmandic/face-api` (Browser-native neural network engine with preloaded TinyFaceDetector, FaceLandmark68Net, and FaceRecognitionNet weights)
- **Backend**:
  - Node.js + Express.js + TypeScript
  - Prisma ORM
  - SQLite (zero-config local deployment, seamless 1-line switch to PostgreSQL)
  - AES-256-GCM Cryptographic Vault
- **Database Schema**:
  - `User` (id, fullName, email, passwordHash, studentId, department, className, role, isActive)
  - `FaceProfile` (id, userId, encryptedEmbedding, facePreview, registeredAt)
  - `Attendance` (id, userId, attendanceDate, checkInTime, status, confidence, verificationMethod)
  - `SystemSetting` (key, value, description)
  - `AuditLog` (action, performedBy, userId, details, createdAt)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Run the Full Stack Application
From the root directory:
```bash
# Start both Backend server (Port 5000) and Frontend Vite app (Port 5173)
npm run dev
```

The application will be accessible at:
👉 **http://localhost:5173**

Backend API runs at:
👉 **http://localhost:5000/api**

---

## 🔑 Default Demo Accounts

The database comes pre-seeded with an administrator and sample students. You can also use the one-click **"Quick Demo Access"** buttons on the Login page:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@faceattend.com` | `admin123` | Full access to directory, biometrics, rules & logs |
| **Student (CS)** | `aarav.sharma@faceattend.com` | `student123` | Student portal, 1-click face check-in, history |
| **Student (EC)** | `ananya.d@faceattend.com` | `student123` | Student portal, profile & attendance log |

---

## 📁 Project Structure

```
face-attendance/
├── client/                      # React 18 + Vite + Tailwind CSS Frontend
│   ├── public/
│   │   └── models/              # Preloaded Face-API neural network models
│   ├── src/
│   │   ├── components/
│   │   │   ├── face/            # FaceCameraScanner with bounding box & HUD
│   │   │   └── layout/          # Navbar, Sidebar, AppLayout, ProtectedRoute
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── pages/
│   │   │   ├── admin/           # Dashboard, Users, AddUser, FaceRegistration, Attendance, Reports, Settings
│   │   │   └── user/            # Dashboard, MarkAttendance, History, Profile
│   │   ├── services/            # api.ts (Fetch wrapper), faceRecognition.ts (Face-API engine)
│   │   └── types/               # TypeScript interfaces
│   └── package.json
├── server/                      # Express.js + Prisma ORM Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema models
│   │   └── seed.ts              # Database seeder (Admin, students, sample records)
│   ├── src/
│   │   ├── controllers/         # Auth, User, Face, Attendance, Report, Settings
│   │   ├── middleware/          # JWT auth & admin-only guards
│   │   ├── routes/              # Express API routers
│   │   ├── utils/               # AES-256 crypto & Euclidean distance math
│   │   └── index.ts             # Express server setup
│   └── package.json
└── package.json                 # Root script runner (concurrent dev/build)
```

---

## 📊 Database Scripts (Optional)

If you wish to re-seed or inspect the database:
```bash
# Regenerate Prisma Client
npm --prefix server run prisma:generate

# Sync schema changes to database
npm --prefix server run prisma:push

# Re-run sample database seeding
npm --prefix server run prisma:seed
```

---

## 📷 How Face Recognition Works in FaceAttend

1. **Camera Stream**: The browser requests webcam permission via `navigator.mediaDevices.getUserMedia`.
2. **Face Detection**: `TinyFaceDetector` finds the facial bounding box in real time (250ms cadence).
3. **Face Landmark Alignment**: `FaceLandmark68Net` identifies 68 facial landmarks to align rotation and tilt.
4. **Embedding Generation**: `FaceRecognitionNet` computes a 128-dimensional biometric descriptor vector.
5. **AES-256 Storage**: On registration, this vector is encrypted with an authenticated cipher and stored in the database.
6. **Matching & Threshold**: During attendance check-in, the Euclidean distance between the live scan and the stored descriptor is calculated. If distance $\le$ configurable threshold (default `0.50`), the identity is verified and attendance is confirmed.
7. **Punctuality Evaluation**: If the check-in time exceeds the system late cutoff (e.g. `09:30 AM`), the status is automatically recorded as `LATE`, otherwise `PRESENT`.

