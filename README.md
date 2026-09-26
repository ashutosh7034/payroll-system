# PAYFLOW — Enterprise Payroll Management System

PAYFLOW is a modern, enterprise-grade payroll management SaaS designed to provide multi-tenant payroll operations, complete financial reconciliation, and an Employee Self Service (ESS) portal.

## Features

- **Multi-Tenant Architecture:** Strong tenant-isolation across the entire database schema utilizing PostgreSQL.
- **Role-Based Access Control (RBAC):** Comprehensive role divisions (Admin, HR, Employee, etc.).
- **Compensation & Formula Engine:** Dynamic AST-driven formula calculations using Decimal.js for precise financial operations.
- **Attendance & Leave Processing:** Overtime processing, timesheet tracking, LOP (Loss of Pay) proration logic, and leave balance deductions.
- **Payroll Processing:** Phase-driven payroll runs (Draft, Calculating, Finalized) with idempotent partial-failure protection.
- **ESS Dashboard & Reports:** PDF Payslip generation, Tax Declarations, Salary Register, and analytics.
- **Accounting & Reconciliations:** GL Mapping, Payment Batch instruction management, and Accounting Journals.

## Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Express, TypeScript, Node.js
- **Database:** PostgreSQL (via Prisma ORM)

## Deployment

The application is structurally configured for production deployment via Render (PostgreSQL database, Express Web Service, React Static site) using a unified render.yaml.
