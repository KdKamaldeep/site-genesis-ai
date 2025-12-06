import cron from 'node-cron';
import Tenant from '../models/Tenant.js';
import Keyword from '../models/Keyword.js';
import { loadPendingKeywords } from '../generator/keywordLoader.js';
import { generateContent } from '../generator/contentWriter.js';
import { assignRelatedLinks } from '../generator/linkManager.js';
import { buildPage, generateSitemap, generateRobotsTxt, generateIndexPage } from '../generator/pageBuilder.js';
import { updateKeywordStatus } from '../generator/keywordLoader.js';
import logger from '../utils/logger.js';

/**
 * Run content generation for a single tenant
 */
const runTenantCron = async (tenantId) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      logger.warn(`Tenant not found: ${tenantId}`);
      return;
    }

    logger.info(`Running cron for tenant: ${tenantId} (${tenant.cronFrequency} posts/day)`);

    // Load pending keywords
    const keywords = await loadPendingKeywords(tenantId, tenant.cronFrequency);
    
    if (keywords.length === 0) {
      logger.info(`No pending keywords found for tenant ${tenantId}. Skipping content generation.`);
      return;
    }
    
    logger.info(`Processing ${keywords.length} pending keywords for tenant ${tenantId}`);

    // Generate content for each keyword
    for (const keyword of keywords) {
      let aiProvider = null;
      try {
        const isRetry = keyword.status === 'failed';
        if (isRetry) {
          logger.info(`Retrying failed keyword: ${keyword.keyword} (attempt ${(keyword.retryCount || 0) + 1}/2)`);
        }
        
        await updateKeywordStatus(keyword._id, 'generating');
        
        // Generate content and track which AI provider was used
        const result = await generateContent(tenantId, keyword);
        const content = result.content;
        const aiProvider = result.provider;
        
        await assignRelatedLinks(tenantId, keyword.slug, 7);
        await buildPage(tenantId, keyword.slug);
        
        // Reset retry count and clear error on success, store AI provider
        await Keyword.findByIdAndUpdate(keyword._id, {
          status: 'completed',
          retryCount: 0,
          error: null,
          aiProvider: aiProvider,
          updatedAt: new Date(),
        });
        
        logger.info(`Generated content for ${keyword.keyword} (${keyword.slug})`);
      } catch (error) {
        logger.error(`Error generating content for keyword ${keyword.keyword}:`, error);
        
        // Try to extract AI provider from error message
        let provider = null;
        const errorMessage = error.message || 'Unknown error';
        if (errorMessage.includes('OpenAI') || errorMessage.toLowerCase().includes('openai')) {
          provider = 'openai';
        } else if (errorMessage.includes('Gemini') || errorMessage.toLowerCase().includes('gemini')) {
          provider = 'gemini';
        }
        
        // Increment retry count and update status with error and provider
        await updateKeywordStatus(keyword._id, 'failed', { 
          incrementRetry: true,
          error: errorMessage,
          aiProvider: provider,
        });
      }
    }

    // Regenerate sitemap, robots.txt, and index page
    await generateSitemap(tenantId);
    await generateRobotsTxt(tenantId);
    await generateIndexPage(tenantId);

    logger.info(`Cron completed for tenant: ${tenantId}`);
  } catch (error) {
    logger.error(`Error in cron for tenant ${tenantId}:`, error);
  }
};

/**
 * Schedule cron jobs for all tenants
 * Runs every hour and distributes posts throughout the day
 */
const scheduleTenantCrons = async () => {
  try {
    const tenants = await Tenant.find();
    
    // Run immediately for all tenants (for initial setup)
    for (const tenant of tenants) {
      await runTenantCron(tenant._id);
    }

    // Schedule hourly cron (distributes posts throughout the day)
    // Each tenant's cronFrequency determines how many posts per day
    // We run every hour and generate posts proportionally
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled cron jobs for all tenants');
      const tenants = await Tenant.find();
      
      for (const tenant of tenants) {
        // Calculate posts per hour based on daily frequency
        // If tenant wants 5 posts/day, that's ~0.2 posts/hour, so we generate 1 post every 5 hours
        const postsPerHour = tenant.cronFrequency / 24;
        if (Math.random() < postsPerHour) {
          await runTenantCron(tenant._id);
        }
      }
    });

    logger.info('Cron jobs scheduled successfully');
  } catch (error) {
    logger.error('Error scheduling cron jobs:', error);
  }
};

// Start cron scheduling
scheduleTenantCrons();

export { runTenantCron, scheduleTenantCrons };

