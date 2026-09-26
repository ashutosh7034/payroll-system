import { Router } from 'express';
import { getPayrollInputs, createPayrollInput, createOvertime, createReimbursement, createLoan } from '../controllers/payroll-input.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(requireAuth);

// Payroll Inputs
router.get('/', requirePermission('payroll.view'), getPayrollInputs);
router.post('/', requirePermission('payroll.manage'), createPayrollInput);

// Overtime
router.post('/overtime', requirePermission('overtime.manage'), createOvertime);

// Reimbursements
router.post('/reimbursement', requirePermission('reimbursement.manage'), createReimbursement);

// Loans
router.post('/loan', requirePermission('loan.manage'), createLoan);

export default router;
