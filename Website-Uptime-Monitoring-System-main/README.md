# Uptime Sentinel - Website Uptime Monitoring System

## 1) Project Overview

Uptime Sentinel is a full-stack website monitoring platform built to help individuals and teams track the health, availability, and behavior of web services over time. The platform does not stop at simple UP/DOWN polling. It captures reliability signals, classifies outage behavior, adapts monitoring frequency automatically, and presents operational insights through a clean dashboard.

The system combines:
- A React frontend for user workflows and observability views.
- A Node.js + Express backend API for auth, monitor lifecycle, analytics, and reporting.
- MongoDB persistence for monitors, checks, incidents, and user records.
- Monitoring engines that run continuously and apply classification + adaptive scheduling logic.

This repository is designed for both practical uptime operations and advanced reliability experimentation.

---

## 2) What Problem This Project Solves

Traditional uptime tools usually provide static polling intervals and binary availability output. That approach creates three operational issues:

1. False positives during transient failures.
2. Wasted checks on very stable websites.
3. Limited diagnostic context when downtime happens.

Uptime Sentinel addresses these issues with behavioral reliability logic:
- It inspects failure patterns over time, not one isolated check.
- It adapts future check frequency based on reliability dynamics.
- It tracks incidents and provides clear records + exportable reports.

---

## 3) Key Product Goals

- Make uptime monitoring accurate enough for day-to-day operations.
- Reduce noisy alerts and improve confidence in incident signals.
- Support scalability through adaptive check scheduling.
- Provide explainable insights for non-technical and technical users.
- Preserve auditability with downloadable reports and timeline history.

---

## 4) Final Patent Features (Frozen Naming)

The project includes the following patent-oriented core engines with stable naming.

### Patent Feature 1: Outage Fingerprint Classification Engine

The Outage Fingerprint Classification Engine generates a website-specific outage fingerprint by analyzing behavioral failure signals over recent checks.

It evaluates:
- Failure density in recent check windows.
- Consecutive downtime streaks.
- Retry outcomes during probe validation.
- Response-time volatility and high-latency bursts.
- Status-code behavior.

It classifies service behavior into categories including:
- `transient-flaky-outage`
- `persistent-hard-downtime`
- `partial-service-degradation`
- `stable`
- `observed-variation`

It stores:
- Fingerprint label.
- Human-readable fingerprint details.
- Confidence score.
- Timestamp for last fingerprint update.

Operationally, this helps teams distinguish flaky outages from persistent failures and respond with better precision.

### Patent Feature 2: Adaptive Monitoring Interval Engine

The Adaptive Monitoring Interval Engine changes monitoring cadence automatically per website based on current and recent reliability behavior.

It uses:
- Baseline interval configured by the user.
- Current health state (UP/DOWN).
- Failure density.
- Response-time variance.
- Recent recovery signals.

Adaptive behavior examples:
- Confirmed downtime -> tighter interval (aggressive checks).
- Post-recovery phase -> temporary verification cadence.
- High instability -> increased check frequency.
- Stable low-variance service -> relaxed interval to save resources.

It stores:
- Current adaptive interval seconds.
- Explainable adaptive interval reason.

This creates a continuous feedback loop between monitoring outcomes and future monitoring frequency.

---

## 5) Core Functional Features (Complete List)

1. User signup and login with JWT-based authenticated sessions.
2. Add website monitors with configurable baseline interval.
3. Secure monitor ownership isolation per user.
4. Automated monitor cycle processing with due-check scheduling.
5. Multi-probe verification to reduce single-check false alerts.
6. Check persistence (status, reason, status code, response time, checked time).
7. 30-day uptime percentage computation.
8. Incident creation when status transitions to DOWN.
9. Incident closure when service recovers.
10. Incident timeline messages for outage history.
11. Outage Fingerprint Classification Engine for behavior classification.
12. Fingerprint confidence scoring and detail explanations.
13. Smart risk prioritization using reliability and latency signals.
14. Adaptive Monitoring Interval Engine for dynamic per-monitor cadence.
15. Adaptive interval reason generation for explainability.
16. Dashboard summary (total/up/down/average uptime).
17. My Websites card view with live status chips and insights.
18. Website details page with response-time chart and reliability data.
19. CSV report generation per monitor.
20. PDF report generation per monitor.
21. Email notifications on UP <-> DOWN transitions.
22. Caching for dashboard summary queries.
23. Responsive frontend interface across major pages.

---

## 6) System Architecture (High-Level)

### Frontend (React + Vite)

Responsibilities:
- Authentication flow (signup/login).
- Add Website workflow.
- Monitor listing with status and reliability chips.
- Website details with trend chart and incident history.
- Overview summary.
- Report export triggers.

Key frontend routes:
- `/login`
- `/signup`
- `/app/add-website`
- `/app/websites`
- `/app/websites/:monitorId`
- `/app/overview`

### Backend (Node.js + Express)

Responsibilities:
- Authentication endpoints and token validation.
- Monitor CRUD-like operations (create/list/delete/timeline).
- Monitoring cycle execution.
- Reliability signal computation.
- Incident lifecycle management.
- Report generation.

### Database (MongoDB)

Main collections:
- `users`
- `monitors`
- `checks`
- `incidents`

---

## 7) End-to-End Data Flow

1. User signs in and creates monitor with name, URL, baseline interval.
2. Backend stores monitor with initial scheduling metadata.
3. Monitoring cycle fetches due monitors by `nextCheckAt`.
4. Engine executes probes and resolves final check status.
5. Check document is created and persisted.
6. Reliability metrics are recomputed from recent checks.
7. Outage Fingerprint Classification Engine updates fingerprint output.
8. Smart priority/risk values are recomputed.
9. Adaptive Monitoring Interval Engine computes next interval and reason.
10. Monitor `nextCheckAt` is updated using adaptive interval.
11. If status changed, incident/email workflows are triggered.
12. Frontend dashboard consumes updated monitor summary.

---

## 8) Reliability Logic Details

### 8.1 Multi-Probe Final State

A monitor cycle may run up to three probes.
- Fast path: first probe UP -> stop early.
- Failure path: multiple probes verify whether failure persists.
- Final status is determined from probe vote logic.

### 8.2 Failure Density

Failure density = down checks / recent checks.
This is used by both classification and prioritization.

### 8.3 Response Variance

Response variance is derived from recent response-time sample distribution.
It helps identify unstable performance patterns.

### 8.4 Smart Priority Buckets

Risk score is computed from failure density and response variance.
Priority buckets:
- normal
- medium
- high
- critical

### 8.5 Adaptive Cadence

Adaptive interval is tightened or relaxed while clamped to allowed bounds.
All interval decisions persist a reason message.

---

## 9) API Capabilities (Summary)

- Auth routes for signup/login.
- Protected monitor routes:
  - Create monitor.
  - Dashboard summary listing.
  - Timeline/details by monitor ID.
  - Remove monitor.
  - Export CSV report.
  - Export PDF report.

---

## 10) UI Pages and Purpose

### Add Website
- Adds a new monitor.
- Shows complete platform feature list with clear descriptions.

### My Websites
- Shows monitor cards.
- Displays status, uptime, priority, fingerprint, confidence, adaptive interval.
- Provides detail navigation and report export.

### Overview
- Shows fleet totals for total/up/down.

### Website Details
- Shows detailed monitor reliability fields.
- Displays outage fingerprint + confidence + details.
- Displays adaptive interval and reason.
- Shows response-time chart and incidents.

---

## 11) Tech Stack

Frontend:
- React
- React Router
- Axios
- Recharts
- Vite

Backend:
- Node.js
- Express
- Mongoose
- Axios
- Nodemailer
- PDFKit
- Node Cache
- Node Cron

Database:
- MongoDB

---

## 12) Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally or remote connection string

### Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run backend

```bash
cd backend
npm run dev
```

### Run frontend

```bash
cd frontend
npm run dev
```

---

## 13) Expected Environment Variables (Backend)

Typical values include:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CHECK_BATCH_LIMIT`

Use a `.env` file in `backend/`.

---

## 14) Security and Isolation Notes

- Protected routes require JWT auth middleware.
- Monitor access is restricted by authenticated user ID.
- Timeline and delete operations verify monitor ownership.

---

## 15) Operational Notes

- Monitoring scale can be tuned with `CHECK_BATCH_LIMIT`.
- Adaptive intervals improve check-resource efficiency.
- Cached dashboard summary reduces repeated query load.

---

## 16) Current Status

This repository now includes complete implementation and UI support for:
- Outage Fingerprint Classification Engine.
- Adaptive Monitoring Interval Engine.
- Full feature visibility on Add Website page.
- Updated page text cleanup per product-direction requirements.

