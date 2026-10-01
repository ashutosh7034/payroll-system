import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac.middleware';
import { getTenants, createTenant, getTenantById, updateTenantStatus, updateTenantProfile, resetSuperAdmin, getPlatformDashboardMetrics } from '../controllers/platform.controller';
import { getTenantConfiguration, updateTenantConfiguration, createStatutoryRule, updateStatutoryRule, updateStatutoryRuleStatus, deleteStatutoryRule } from '../controllers/platformConfig.controller';
import { getPlatformUsers, createPlatformUser, updatePlatformUserStatus, updatePlatformUserRoles } from '../controllers/platformUsers.controller';
import { getPlatformRoles, getPermissions, updateRolePermissions } from '../controllers/platformRoles.controller';
import { getPlatformModules, getTenantModules, updateTenantModules } from '../controllers/platformModules.controller';
import { getSystemHealth } from '../controllers/platformHealth.controller';
import { getPlatformAuditLogs } from '../controllers/platformAudit.controller';
import { getPlatformConfig, updatePlatformConfig } from '../controllers/platformGlobalConfig.controller';

const router = Router();

router.use(requireAuth);

// Dynamic Authorization for Configuration Endpoints
const checkConfigAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const targetTenantId = req.params.tenantId;

  if (!user || !user.roles) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden: No roles found' } });
  }

  const isPlatformAdmin = user.roles.includes('PLATFORM_SUPER_ADMIN');
  const isTenantAdmin = user.roles.includes('TENANT_SUPER_ADMIN');
  
  if (isPlatformAdmin) {
    return next(); // Platform Admin can configure any tenant
  }
  
  if (isTenantAdmin && user.tenantId === targetTenantId) {
    return next(); // Tenant Admin can configure THEIR OWN tenant
  }
  
  return res.status(403).json({ success: false, error: { message: 'Forbidden: You do not have permission to configure this tenant' } });
};

router.get('/tenants/:tenantId/configuration/:module', checkConfigAccess, getTenantConfiguration);
router.put('/tenants/:tenantId/configuration/:module', checkConfigAccess, updateTenantConfiguration);
router.post('/tenants/:tenantId/configuration/tax', checkConfigAccess, createStatutoryRule);
router.put('/tenants/:tenantId/configuration/tax/:ruleId', checkConfigAccess, updateStatutoryRule);
router.put('/tenants/:tenantId/configuration/tax/:ruleId/status', checkConfigAccess, updateStatutoryRuleStatus);
router.delete('/tenants/:tenantId/configuration/tax/:ruleId', checkConfigAccess, deleteStatutoryRule);

// Only PLATFORM_SUPER_ADMIN can access these routes below
router.use(requirePermission('PLATFORM_SUPER_ADMIN'));

router.get('/dashboard', getPlatformDashboardMetrics);
router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.get('/tenants/:tenantId', getTenantById);
router.put('/tenants/:tenantId/status', updateTenantStatus);
router.put('/tenants/:tenantId/profile', updateTenantProfile);
router.post('/tenants/:tenantId/reset-admin', resetSuperAdmin);

// Platform Users & Roles
router.get('/roles', getPlatformRoles);
router.get('/permissions', getPermissions);
router.put('/roles/:roleId/permissions', updateRolePermissions);
router.get('/users', getPlatformUsers);
router.post('/users', createPlatformUser);
router.put('/users/:id/status', updatePlatformUserStatus);
router.put('/users/:id/roles', updatePlatformUserRoles);

// Platform Modules
router.get('/modules', getPlatformModules);
router.get('/tenants/:tenantId/modules', getTenantModules);
router.put('/tenants/:tenantId/modules', updateTenantModules);

// System Health
router.get('/health', getSystemHealth);

// Platform Audit
router.get('/audit', getPlatformAuditLogs);

// Platform Configuration
router.get('/configuration', getPlatformConfig);
router.put('/configuration', updatePlatformConfig);

export default router;
