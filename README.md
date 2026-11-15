# FitQuality

FitQuality is a classroom demonstration of data integration, data quality management (DQM), and data governance for gym member health-screening records. It uses a Next.js frontend, an Express API, and PostgreSQL. Neon can be used when its connection details are kept in a local environment file.

## How the data moves

```text
CSV upload or seeded source tables
  -> Express API and audit checks
  -> staging/session records
  -> cleaning rules and steward review
  -> ETL run with saved issues and field lineage
  -> integrated warehouse
  -> role-limited screens and audit history
```

Uploaded CSV checks and the multi-source ETL pipeline are separate workflows. CSV uploads are checked and reviewed through audit sessions. The ETL workflow combines the seeded member, screening, and access sources into the warehouse and stores run counts, issues, and lineage.

## Roles

| Role | Main access |
| --- | --- |
| Front desk | Enroll members and check safety clearance |
| Clinic | View and record health screenings |
| Turnstile | Check access and review recent scans |
| Manager | View a limited operations summary and clearance status |
| Data steward | Upload and audit data, clean and review records, run ETL, and view governance and audit tools |
| Administrator | Manage the system and use the protected role features |

The API enforces these permissions. Hiding a tab in the frontend is not the security control. The project includes demo account identities, but passwords are configured locally and are not stored in this repository.

## Local setup

Use two VS Code terminals, one for each application.

1. Install backend packages:

   ```powershell
   cd backend
   npm install
   ```

2. Copy `backend/.env.local.example` to `backend/.env.local`. Keep `.env.local` in the backend folder; do not place backend secrets in the frontend. Add a `DATABASE_URL` for a database you control, or explicitly enable the in-memory development database if you only need temporary local data.

3. Set six unique local account passwords. From the `backend` folder, run:

   ```powershell
   npm run setup:demo-passwords
   ```

   Enter each password privately when prompted. Use at least 12 characters. The helper saves password hashes in `backend/.env.local`; it does not display or save the original passwords. Keep this file private.

4. If using PostgreSQL, inspect `backend/db/schema.sql`, back up any existing data you need, and then apply the schema to the intended database:

   ```powershell
   npm run migrate
   ```

   This command connects to the `DATABASE_URL` in `backend/.env.local`. Do not run it against a database unless you intend to apply this project's schema there.

5. Start the API in a terminal. For a preview that does not contact Neon and resets its data when stopped, use `npm run dev:memory`. Use `npm run dev` only when you want the configured PostgreSQL database:

   ```powershell
   npm run dev:memory
   ```

6. In the second terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001). The frontend uses the API at `http://localhost:3000/api` by default. If you use another address, configure `NEXT_PUBLIC_API_URL` for the frontend and set the matching `FRONTEND_URL` for the backend.

## Local configuration files

- Backend secrets and account password hashes: `backend/.env.local`
- Backend template: `backend/.env.local.example`
- Optional frontend API address: `frontend/.env.local`

Environment files and `FitQuality_Account_Credentials.txt` are excluded from Git. Do not paste a database connection string or real account password into source code, screenshots, or a public repository.

## Useful backend commands

Run these from `backend`:

- `npm run dev` — start the API
- `npm run dev:memory` — start a local preview without contacting Neon; data resets when the API stops
- `npm run migrate` — apply `backend/db/schema.sql` to the configured database
- `npm run setup:demo-passwords` — create local password hashes without displaying passwords
- `npm test` — run the existing audit test file

The server-side session store is in memory, so restarting the API signs users out. This is suitable for a single-instance class demo; production use needs a persistent shared session store and deployment-specific security review.
