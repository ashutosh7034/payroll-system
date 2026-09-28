# Payflow - Enterprise Payroll & HRMS Platform

Payflow is a modern, enterprise-grade payroll and HR management system built for scalability, security, and multi-tenant isolation. It is designed to handle complex payroll calculations, statutory compliance, reporting, and organizational management across diverse business structures.

## 🚀 Features

- **Multi-Tenant Architecture**: Complete logical isolation of data between different companies/organizations.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across 8+ standard roles (Platform Admin, Tenant Super Admin, HR, Payroll, Finance, Compliance, Manager, Auditor, Employee).
- **Payroll Control Tower**: Advanced payroll processing engine with stages for Draft, Calculating, Pending Approval, and Finalized runs.
- **Salary Structure Builder**: Dynamic formula-based compensation engine for automated gross and net pay calculations.
- **Statutory & Compliance Engine**: Configurable PF, ESI, TDS, and PT rules.
- **Time & Attendance**: Calendar, shifts, and leave integration.
- **Enterprise Reporting**: Finance, payroll cost, exceptions, and bank transfer advice reports with CSV/PDF exports.

## 🛠 Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React (Icons)
- React Router DOM
- Recharts (Data Visualization)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (or SQLite for development)
- JSON Web Tokens (JWT) for Authentication

---

## 🚦 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (or use the configured SQLite for quick local dev)
- Git

### 1. Backend Setup
1. Open terminal and navigate to the backend directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `server` directory (copy from `.env.example` if available) and set your database URL and JWT secret:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/payflow"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   ```
4. Run Prisma Migrations & Seed the Database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the root directory:
   ```bash
   cd "kanvtech Payroll system"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend application:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`

---

## 🔐 Test/Demo Credentials

The database seed provides the following pre-configured accounts for testing RBAC and workflows. 

> **IMPORTANT:** These are LOCAL/TEST credentials. They should never be used in a production environment.

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Platform Admin** | `platform.admin@payflow.local` | `Platform@Admin2026!` | Cross-tenant platform management |
| **Tenant Super Admin** | `superadmin@demo.local` | `Payflow@Company2026!` | Full access to Demo Company |
| **HR Manager** | `hr@demo.local` | `Payflow@HR2026!` | Employee, Leave & Attendance |
| **Payroll Manager** | `payroll@demo.local` | `Payflow@Payroll2026!` | Payroll runs & Salary structures |
| **Finance Manager** | `finance@demo.local` | `Payflow@Finance2026!` | Analytics & Accounting journals |
| **Compliance Officer** | `compliance@demo.local` | `Payflow@Compliance2026!` | Statutory configurations & reports |
| **Manager** | `manager@demo.local` | `Payflow@Manager2026!` | Team approvals & ESS |
| **System Auditor** | `auditor@demo.local` | `Payflow@Auditor2026!` | Read-only access across modules |
| **Standard Employee** | `employee@demo.local` | `Payflow@Employee2026!` | Personal ESS & Payslips |

---

## 📦 Production Deployment

To build the application for production:

1. **Build the Backend:**
   ```bash
   cd server
   npm run build
   ```
2. **Build the Frontend:**
   ```bash
   cd ..
   npm run build
   ```
3. The frontend production assets will be located in the `/dist` directory. Serve them using Nginx, Apache, or any static file host.
4. Run the backend using `node dist/index.js` or via a process manager like PM2.

## 🧪 Testing
The backend features an extensive suite of integration and E2E tests validating payroll mathematics, formula calculations, RBAC, and tenant isolation.

Run tests:
```bash
cd server
npm run test
```

## 🛠 Troubleshooting
- **Prisma Schema Errors:** If the database schema changes, ensure you run `npx prisma generate` and `npx prisma migrate dev` in the `server` directory.
- **Port Conflicts:** The backend defaults to `3000` and frontend to `5173`. Ensure these ports are available.
- **403 Forbidden Errors:** Check that the logged-in test user has the appropriate role for the resource they are trying to access. Verify permissions in `src/utils/permissions.ts`.
