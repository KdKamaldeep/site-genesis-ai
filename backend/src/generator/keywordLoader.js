import Keyword from '../models/Keyword.js';
import logger from '../utils/logger.js';

/**
 * Fetch pending keywords and retryable failed keywords for a tenant
 * @param {string} tenantId - The tenant ID
 * @param {number} limit - Maximum number of keywords to fetch
 * @returns {Promise<Array>} - Array of keyword documents
 */
export const loadPendingKeywords = async (tenantId, limit = 10) => {
  try {
    // First, check total keywords for this tenant
    const totalKeywords = await Keyword.countDocuments({ tenantId });
    const pendingCount = await Keyword.countDocuments({ tenantId, status: 'pending' });
    const retryableFailedCount = await Keyword.countDocuments({ 
      tenantId, 
      status: 'failed',
      retryCount: { $lt: 2 }
    });
    
    logger.info(`Tenant ${tenantId}: Total keywords: ${totalKeywords}, Pending: ${pendingCount}, Retryable failed: ${retryableFailedCount}`);
    
    if (totalKeywords > 0 && pendingCount === 0 && retryableFailedCount === 0) {
      // Log status breakdown for debugging
      const statusBreakdown = await Keyword.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      logger.info(`Status breakdown for tenant ${tenantId}:`, statusBreakdown);
    }

    // Load pending keywords first, then retryable failed keywords
    const pendingKeywords = await Keyword.find({
      tenantId,
      status: 'pending',
    })
      .limit(limit)
      .sort({ createdAt: 1 });

    const remainingSlots = limit - pendingKeywords.length;
    let retryableKeywords = [];
    
    if (remainingSlots > 0) {
      retryableKeywords = await Keyword.find({
        tenantId,
        status: 'failed',
        retryCount: { $lt: 2 }, // Only retry keywords that have failed less than 2 times
      })
        .limit(remainingSlots)
        .sort({ updatedAt: 1 }); // Retry oldest failed keywords first
    }

    const keywords = [...pendingKeywords, ...retryableKeywords];
    logger.info(`Loaded ${keywords.length} keywords for tenant ${tenantId} (${pendingKeywords.length} pending, ${retryableKeywords.length} retryable failed) while running cron`);
    return keywords;
  } catch (error) {
    logger.error('Error loading pending keywords:', error);
    throw error;
  }
};

/**
 * Update keyword status
 * @param {string} keywordId - The keyword ID
 * @param {string} status - New status
 * @param {object} options - Additional options (incrementRetry, error, aiProvider, etc.)
 */
export const updateKeywordStatus = async (keywordId, status, options = {}) => {
  try {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    // Store error message if provided
    if (options.error !== undefined) {
      updateData.error = options.error;
    }

    // Store AI provider if provided
    if (options.aiProvider !== undefined) {
      updateData.aiProvider = options.aiProvider;
    }

    // If incrementing retry count, fetch current keyword first
    if (options.incrementRetry) {
      const keyword = await Keyword.findById(keywordId);
      if (keyword) {
        const newRetryCount = (keyword.retryCount || 0) + 1;
        updateData.retryCount = newRetryCount;
        
        // If retry count reaches 2, mark as permanently failed
        if (newRetryCount >= 2) {
          updateData.status = 'failed_permanent';
          logger.warn(`Keyword ${keywordId} has failed ${newRetryCount} times. Marking as permanently failed.`);
        }
      }
    }

    await Keyword.findByIdAndUpdate(keywordId, updateData);
  } catch (error) {
    logger.error('Error updating keyword status:', error);
    throw error;
  }
};

export default {
  loadPendingKeywords,
  updateKeywordStatus,
};

