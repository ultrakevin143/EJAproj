# 🏋️ FitQuality DQM — Gym Member Health Screening Quality Detective

A full-stack, enterprise-grade **Data Quality Management (DQM)**, **Data Integration**, and **Data Governance** system built with **Next.js 14**, **Express.js**, and **PostgreSQL (with seamless Neon Cloud support)**.

---

## 🎯 Industry Chosen: Fitness & Gym Member Health Screening

### Domain Context
Fitness clubs and athletic gyms require new members to undergo a **Physical Activity Readiness Questionnaire (PAR-Q)** prior to workout facility access. Missing dates of birth, malformed contact emails, ambiguous clearance statuses (e.g., `Clrd`, `Fla`, `Unknown`), or impossible calendar dates jeopardize member cardiovascular safety, create legal liability, and corrupt fitness analytics.

### The 5 Core Dataset Fields
1. **`Name`** — Member full legal name (*First & Last name required*).
2. **`DOB`** — Date of birth (*ISO 8601 standard: `YYYY-MM-DD`*).
3. **`Email`** — RFC-compliant contact email address.
4. **`Screening Result`** — Controlled PAR-Q clinical outcome: `Cleared`, `Flagged`, or `Pending`.
5. **`Date Recorded`** — Chronologically valid session timestamp.

---

## 🏛️ The 6 DQM Principles in Fitness Health Screening

| Principle | Meaning in Gym Context | Detected Classroom Anomalies | Governance Prevention Strategy |
| :--- | :--- | :--- | :--- |
| **Accuracy** | Screening records reflect true member health status and valid syntax. | Malformed emails (`john.doe.com`), impossible dates (`2025-13-01`), unknown results. | Regex input masks, calendar date picker controls, RFC syntax gates. |
| **Consistency** | Uniform formatting across all gym locations. | Mixed date formats (`MM/DD/YYYY` vs `YYYY-MM-DD`), non-standard abbreviations (`Clrd`, `Fla`, `Pnd`). | Controlled vocabulary dropdowns, ISO-8601 storage enforcement. |
| **Completeness** | Mandatory health fields are present before member activation. | Missing Date of Birth, blank screening results, single-token names (`Alex`). | `NOT NULL` database constraints, intake validation guards. |
| **Timeliness** | Screenings recorded in realistic chronological order. | Future/impossible recording timestamps, expired screenings. | Automated NTP server timestamps, chronological range triggers. |
| **Reliability** | Results can be trusted by fitness trainers and cardiologists. | Ambiguous screening results (`Unknown`, `?`, `N/A`), blank outcomes. | Digital intake form validation, PAR-Q signature verification. |
| **Relevance** | Member data is actionable and sufficient for emergency identity matching. | Incomplete names unusable for ID checks, unusable contact emails. | Member identity proofing, Master Member Index (MMI) matching. |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User["👤 Data Steward / Analyst"] --> NextJS["💻 Next.js 14 App (Port 3001)\nTailwind CSS • Recharts • 7 Workflow Views"]
    NextJS --> Express["⚡ Express.js REST API (Port 3000)\nIngestion • DQM Classifier • Clean Engine"]
    Express --> DB[("🗄️ PostgreSQL Database\n(Local testing & Neon Cloud Serverless)")]
    
    subgraph PostgreSQL Tables
        T1[("audit_sessions")]
        T2[("audit_records")]
        T3[("audit_errors")]
        T4[("review_queue")]
        T5[("governance_rules")]
        T6[("cleaned_records")]
    end
    DB --- T1
    DB --- T2
    DB --- T3
    DB --- T4
    DB --- T5
    DB --- T6
```

---

## 📑 7 Interactive Workflow Views

1. **Ingestion & Audit (Tab 1):** Drag & drop multi-format CSV files or click **"⚡ Load Synthetic Dataset (500 records)"**.
2. **Executive Dashboard (Tab 2):** 6 summary KPI cards, live audit vs classroom baseline comparison table, and DQM principle distribution graphs.
3. **DQM Error Log (Tab 3):** Searchable, filterable table classifying all detected issues by category, principle, severity, and auto-fix route.
4. **Safe Cleaning & Re-Audit (Tab 4):** Deterministic safe transformations (abbreviation expansion, valid date ISO standardization, whitespace trimming) under the **Zero Hallucination Rule**.
5. **Human Review Queue (Tab 5):** Data steward workflow interface to review, approve, reject, or manually adjust ambiguous records with full audit trail.
6. **Governance Rules (Tab 6):** Active organizational prevention policies persisted in PostgreSQL with live toggle controls and custom policy definition.
7. **Export Hub (Tab 7):** One-click downloads for Cleaned CSV, Error Log CSV, Review Queue CSV, Audit JSON Summary, and Raw CSV.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Backend API (Port 3000)
```bash
cd backend
npm run dev
```
*Note: The backend automatically operates in embedded PostgreSQL mode for zero-config local testing if a live database is not configured.*

### 3. Start the Next.js Frontend (Port 3001)
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

---

## ☁️ Migrating from Local Testing to Neon Cloud PostgreSQL

1. Create a free account at **[neon.tech](https://neon.tech)** and create a new project.
2. Copy your connection string:
   ```text
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Open `backend/.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Run the database migration script:
   ```bash
   cd backend
   npm run migrate
   ```
5. Restart the server (`npm run dev`). Your system is now running on **Neon Cloud PostgreSQL**!

---

## 👥 Group Members (Group 5)
- Kevin Mercado
- Christian Glenn Pacaldo
- Mae Ann Amparado
- Dheyan Pino
- Benedict Mequiabas
- Clarence Maglinao
- John Lloyd Racal

