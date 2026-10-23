# 🎓 CampusCircle — Campus Clubs & Events Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Status-V1--Complete-success.svg)](#)

> A modern, responsive, role-based platform for discovering university clubs, tracking events, and managing student engagement — built from ground up with **vanilla TypeScript, HTML5, CSS3**, and strict architectural separation based on High-Level Design (HLD) and Low-Level Design (LLD) specifications.

---

## 📌 Problem Statement

Students in university campuses often lack a single, consolidated platform to discover student-led clubs, explore upcoming campus events, and register for workshops. At the same time, club leaders struggle to manage event capacity and track attendee lists, while university administrators lack visibility into campus activities and official club recognition requests.

**CampusCircle** addresses this disconnect by providing:
1. **Students**: A centralized discovery feed to search clubs, filter events by category/date, register for events with real-time seat availability, and manage event passes.
2. **Club Leaders**: A dedicated administrative portal to post, edit, and delete events, and inspect attendee rosters.
3. **University Administrators**: Platform oversight to approve or reject club recognition charters and review student safety reports.

---

## 🏛️ System Architecture & HLD Modules

CampusCircle is organized into **five responsibility-focused modules** tracing directly to the High-Level Design (HLD) specifications:

```
campus-circle/
├── src/
│   ├── models/                  # Strict TypeScript Data Contracts
│   │   ├── user.ts              # Student, Club Admin, Platform Admin roles
│   │   ├── club.ts              # Club entity, status (approved, pending, rejected)
│   │   ├── event.ts             # Event entity, capacity, schedule, categories
│   │   ├── registration.ts      # Event registration & cancellation pass
│   │   ├── notification.ts      # User alert notifications
│   │   └── report.ts            # Moderation & safety reports
│   │
│   ├── storage/                 # Data Persistence Layer
│   │   └── storageService.ts    # localStorage engine seeded from JSON datasets
│   │
│   ├── auth/                    # Session & Persona Switcher
│   │   └── session.ts           # Role switcher managing active user context
│   │
│   └── modules/                 # HLD Architectural Modules
│       ├── club-discovery/      # [Module 1] Browse, search, filter & join clubs
│       ├── participation/       # [Module 2] Event registration, duplicate check & capacity
│       ├── event-management/    # [Module 3] Event feed, date/category filters & CRUD
│       ├── club-management/     # [Module 4] Club Admin portal & attendee roster
│       ├── university-admin/    # [Module 5] Admin oversight, report resolution & club approvals
│       └── notifications/       # [Cross-Cutting] Notification Service & alert drawer
```

---

## 👥 Role Breakdown & Key Features

### 1. 🎓 Student Persona
- **Club Discovery**: Live keyword search across club names/descriptions, filter by category (*Technology, Academic, Arts & Culture, Social Impact*), and one-click "+ Join Club" / "✓ Joined" toggle.
- **Event Feed**: Filter by category (*Workshop, Competition, Seminar, Cultural, Social, Sports*) and date (*All Upcoming, Next 7 Days, Next 30 Days, Specific Date*).
- **Seat Availability**: Live seat counter badge (e.g. `29 seats left` vs. `Event Full`).
- **Registration Flow (LLD Implemented)**:
  - Atomic capacity checks (stops overbooking when full).
  - Duplicate registration blocking (enforces at most one active registration per student-event pair).
- **My Registrations**: Direct access to view confirmed event passes with Pass ID, cancel registrations, and view past cancellation history.
- **Notification Bell**: Live unread badge count with notifications for registrations and cancellations.

### 2. 🛠️ Club Admin Persona (*e.g., Bob Smith — Robotics Society*)
- **Club Dashboard**: Dedicated header displaying active club status, member count, category, and lead details.
- **Full Event CRUD**:
  - **Create**: Modal form with title, category, date, time, location, capacity, and description.
  - **Edit**: Update event schedule, location, or seat limits anytime.
  - **Delete**: Cascading cancellation to ensure no orphaned registrations.
- **Attendee Roster**: Inspect real-time list of registered students (Student Name, Campus Email, Pass ID, and registration timestamp).

### 3. 🛡️ Platform / University Admin Persona (*e.g., Dr. Carol Vance*)
- **KPI Metrics Dashboard**: Overview of total clubs, pending recognition requests, active events, and open reports.
- **Moderation Reports**:
  - Review student safety/policy reports.
  - Actions: **Resolve** (with administrative note), **Remove Reported Item** (deletes the flagged event or unpublishes the violating club), or **Dismiss**.
- **Club Recognition Applications**:
  - Evaluate pending club applications (*e.g., AI Researchers Guild*).
  - **Approve** (immediately publishes the club to the public directory) or **Reject**.
- **Platform Oversight**: Force-delete violating events or inspect all campus organizations.

---

## 💻 Tech Stack & Design Choices

| Technology | Purpose | Why It Was Chosen |
| :--- | :--- | :--- |
| **TypeScript** | Core Language | Strict static typing, interfaces for all 6 models, eliminating runtime bugs. |
| **Vite** | Build Tool / Bundler | Instant HMR, zero configuration build, lightweight output. |
| **Plain HTML5 / CSS3** | UI & Styling | No React, Vue, or heavy dependencies. 100% understandable DOM manipulation with mobile-first CSS. |
| **`localStorage` + JSON** | Persistence | Seeded from initial JSON files; preserves state across page refreshes without needing a backend server in V1. |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Setup Steps
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/campus-circle.git
   cd campus-circle
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
5. To test production build:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧪 Step-by-Step Testing Guide

1. **Test Student Registration**:
   - Keep active persona as **Alice Chen (Student)**.
   - Go to **"📅 Events"** -> click **"Register Now"** on an open event.
   - Look at the header: The **🔔 Notification Bell** badge lights up immediately with a new alert.
   - Go to **"🎟️ My Registrations"** to see your confirmed pass.
2. **Test Duplicate Prevention & Full Capacity**:
   - Attempt to register for the same event again: The button prevents duplicate registration.
   - Notice *"Improv Comedy Night"* is marked **"Full"** (2/2 registered) and cannot be overbooked.
3. **Test Club Admin Event Management**:
   - Change the header dropdown to **"Bob Smith (Club Admin)"**.
   - Click **"+ Create New Event"** -> Fill out form -> Click **"Save Event"**.
   - Click **"👥 Attendees"** on *"Intro to Autonomous Drones Workshop"* to view Alice Chen on the roster.
4. **Test University Admin Oversight**:
   - Switch persona to **"Dr. Carol Vance (Platform Admin)"**.
   - Under **"Moderation Reports"**, click **"✓ Resolve"** on the pending noise report.
   - Under **"Club Recognition Applications"**, click **"✓ Approve"** on *"AI Researchers Guild"*.
   - Switch back to Student -> Go to **"🏛️ Clubs"** -> Observe *"AI Researchers Guild"* is now live!
5. **Reset Demo Data**:
   - Click **"🔄 Reset Demo Storage Data"** in the footer at any time to restore fresh mock data.

---

## 🔮 Future Improvements (V2 Roadmap)

When expanding CampusCircle from a client-side portfolio application to a full production university system, the following enhancements are planned:

1. **Real Backend Architecture**:
   - **Node.js + NestJS / Express** or **Go/FastAPI** REST API.
   - Relational Database (**PostgreSQL**) with **Prisma** or **Drizzle ORM** for ACID transactional guarantees during high-concurrency ticket drops.
2. **Authentication & Authorization**:
   - University Single Sign-On (**SSO / SAML / OAuth 2.0**) with `.edu` domain verification.
   - Role-Based Access Control (**RBAC**) enforced via secure HTTP-only JWT cookies.
3. **QR Code Attendance Scanner (LLD Attendance Component)**:
   - Dynamic QR codes generated for student passes.
   - Club leaders can scan student QR codes at the door with a phone camera to mark attendance `PRESENT` in real time.
4. **Real-Time Push Notifications**:
   - **WebSockets / Server-Sent Events (SSE)** for immediate alerts when waitlists open or when an event is rescheduled.
5. **Analytics & Engagement Metrics**:
   - University dashboard tracking attendance rates, active student participation, and club budget allocations.

---

## 🌐 Live Deployment Guide

This project is pre-configured with `vercel.json` and `netlify.toml` for zero-config static hosting.

### Option A: Deploy on Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `campus-circle` repository.
4. Framework Preset: **Vite**.
5. Click **"Deploy"** — Vercel will build and provide a live URL!

### Option B: Deploy on Netlify
1. Push your repository to GitHub.
2. Go to [Netlify](https://app.netlify.com) and click **"Add new site"** -> **"Import an existing project"**.
3. Select GitHub and choose `campus-circle`.
4. Build command: `npm run build` | Publish directory: `dist`.
5. Click **"Deploy site"**!
