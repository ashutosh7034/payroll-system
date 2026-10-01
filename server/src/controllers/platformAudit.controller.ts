import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlatformAuditLogs = async (req: Request, res: Response) => {
  try {
    const { tenantId, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (tenantId) where.tenantId = String(tenantId);
    if (action) where.action = String(action);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
          user: { select: { email: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
