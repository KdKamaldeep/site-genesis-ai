import Tenant from '../models/Tenant.js';
import { generateContentForTenant } from './contentController.js';
import { loadPendingKeywords } from '../generator/keywordLoader.js';
import logger from '../utils/logger.js';

export const runCronForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Load pending keywords based on cron frequency
    const keywords = await loadPendingKeywords(tenantId, tenant.cronFrequency);
    
    if (keywords.length === 0) {
      return res.json({ message: 'No pending keywords found', generated: 0 });
    }

    // Generate content
    req.params.tenantId = tenantId;
    req.body.count = tenant.cronFrequency;
    
    const result = await generateContentForTenant(req, res);
    return result;
  } catch (error) {
    logger.error('Error running cron for tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateCronFrequency = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { cronFrequency } = req.body;

    if (!cronFrequency || cronFrequency < 1 || cronFrequency > 50) {
      return res.status(400).json({ error: 'Cron frequency must be between 1 and 50' });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { cronFrequency },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    logger.info(`Cron frequency updated for tenant ${tenantId}: ${cronFrequency}`);
    res.json(tenant);
  } catch (error) {
    logger.error('Error updating cron frequency:', error);
    res.status(500).json({ error: error.message });
  }
};

