import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from '../src/config.js';
import connectDB from '../src/db.js';
import { loadPendingKeywords } from '../src/generator/keywordLoader.js';
import { generateContent } from '../src/generator/contentWriter.js';
import { assignRelatedLinks } from '../src/generator/linkManager.js';
import { buildPage, generateSitemap, generateRobotsTxt } from '../src/generator/pageBuilder.js';
import { updateKeywordStatus } from '../src/generator/keywordLoader.js';
import logger from '../src/utils/logger.js';

dotenv.config();

const generateForTenant = async (tenantId, count = 5) => {
  try {
    await connectDB();
    logger.info(`Starting content generation for tenant: ${tenantId}`);

    const keywords = await loadPendingKeywords(tenantId, count);
    
    if (keywords.length === 0) {
      logger.info('No pending keywords found');
      process.exit(0);
    }

    for (const keyword of keywords) {
      try {
        await updateKeywordStatus(keyword._id, 'generating');
        const content = await generateContent(tenantId, keyword);
        await assignRelatedLinks(tenantId, keyword.slug, 7);
        await buildPage(tenantId, keyword.slug);
        await updateKeywordStatus(keyword._id, 'completed');
        logger.info(`Generated: ${keyword.keyword}`);
      } catch (error) {
        logger.error(`Error for ${keyword.keyword}:`, error);
        await updateKeywordStatus(keyword._id, 'failed');
      }
    }

    await generateSitemap(tenantId);
    await generateRobotsTxt(tenantId);

    logger.info('Content generation completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
};

const tenantId = process.argv[2];
const count = parseInt(process.argv[3]) || 5;

if (!tenantId) {
  console.error('Usage: node scripts/generateForTenant.js <tenantId> [count]');
  process.exit(1);
}

generateForTenant(tenantId, count);

