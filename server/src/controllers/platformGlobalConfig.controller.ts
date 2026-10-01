import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const configPath = path.join(__dirname, '../../platform-config.json');

const getDefaultConfig = () => ({
  systemDefaults: {
    language: 'en',
    timezone: 'UTC'
  },
  supportedCurrencies: ['USD', 'INR', 'EUR', 'GBP'],
  supportedCountries: ['US', 'IN', 'UK'],
  financialYearDefaults: {
    startMonth: 4, // April
    endMonth: 3   // March
  },
  security: {
    passwordMinLength: 12,
    requireSpecialChar: true,
    requireNumber: true,
    requireUppercase: true,
    mfaEnabled: false
  },
  featureFlags: {
    enableBetaFeatures: false,
    enableAI: true,
    maintenanceMode: false
  }
});

const loadConfig = () => {
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read platform config', err);
    }
  }
  return getDefaultConfig();
};

const saveConfig = (config: any) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
};

export const getPlatformConfig = (req: Request, res: Response) => {
  try {
    const config = loadConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};

export const updatePlatformConfig = (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    saveConfig(newConfig);
    res.json({ success: true, message: 'Platform configuration updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
