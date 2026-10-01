import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import * as loanCtrl from '../controllers/loan.controller';

const router = Router();

router.use(requireAuth);

// Loan Types
router.post('/types', requirePermission('MANAGE_PAYROLL'), loanCtrl.createLoanType);
router.get('/types', loanCtrl.getLoanTypes);

// Employee ESS Loans
router.post('/my-loans', requirePermission('VIEW_ESS'), loanCtrl.requestLoan);
router.get('/my-loans', requirePermission('VIEW_ESS'), loanCtrl.getMyLoans);

// Admin / HR / Finance Loan Management
router.get('/', requirePermission('VIEW_PAYROLL'), loanCtrl.getLoans);
router.post('/', requirePermission('MANAGE_PAYROLL'), loanCtrl.requestLoan); // Admin can create loan for employee
router.post('/:id/approve', requirePermission('MANAGE_PAYROLL'), loanCtrl.approveLoan);
router.post('/:id/reject', requirePermission('MANAGE_PAYROLL'), loanCtrl.rejectLoan);

export default router;
