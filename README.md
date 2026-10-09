# Glassmorphism Auth & Full-Stack Dashboard

A production-grade, reference-matched 3D Glassmorphism Authentication and Dashboard application with a NestJS backend, MySQL database, Redis queue worker, and Gmail SMTP OTP verification.

---

## 📁 Project Structure

```
D:\UI Project\
├── MY Dashborad Glass morfisam/        # Frontend: React 19, Vite 8, Tailwind CSS, 3D Isometric Components
├── MY Dashborad Glass morfisam api/    # Backend: NestJS 12, Prisma 6, MySQL 8.4, Redis, BullMQ, Nodemailer
├── startdashboard.bat                  # One-Click Full-Stack Launcher (Runs all services & opens browser)
├── stopdashboard.bat                   # One-Click Graceful Shutdown (Stops all services)
├── start-all.cjs                       # Cross-platform Node.js launcher process manager
└── .gitignore                          # Root ignore rules for node_modules, .env, and local binaries
```

---

## 🚀 Quick Start (One-Click)

Simply double-click:
```
startdashboard.bat
```
This will automatically:
1. Verify and start local **MySQL 8.4** (Port 3307) and **Redis** (Port 6380).
2. Start the **Backend API** (Port 3000).
3. Start the **Email Queue Worker** (Gmail SMTP).
4. Start the **Frontend Dev Server** (Port 5173).
5. Open your default browser to `http://127.0.0.1:5173`.

To stop all services, double-click:
```
stopdashboard.bat
```

---

## ⚙️ Manual Setup & Requirements

### Frontend (`MY Dashborad Glass morfisam`)
- Node.js >= 22.20.0
- Run `npm install`
- Run `npm run dev` (Access at `http://127.0.0.1:5173`)
- Run `npm run check` (Lint, TypeScript, Playwright tests)

### Backend API (`MY Dashborad Glass morfisam api`)
- Node.js >= 22.20.0
- MySQL 8.4+ and Redis 8+
- Run `npm install`
- Copy `.env.example` to `.env` and configure your database and SMTP credentials.
- Run `npm run prisma:generate && npm run db:migrate`
- Run `npm run dev` (API at `http://127.0.0.1:3000`)
- Run `npm run dev:worker` (Outbox worker)

---

## 🔒 Security & Privacy
All secrets, passwords, `.env` files, and local binaries (`.local`) are strictly excluded from version control via `.gitignore`.
