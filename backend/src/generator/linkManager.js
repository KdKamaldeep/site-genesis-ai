import InternalLink from '../models/InternalLink.js';
import Content from '../models/Content.js';
import logger from '../utils/logger.js';

/**
 * Get or create internal link document for a slug
 * @param {string} tenantId - Tenant ID
 * @param {string} slug - Content slug
 * @returns {Promise<object>} - InternalLink document
 */
export const getOrCreateLinkDoc = async (tenantId, slug) => {
  let linkDoc = await InternalLink.findOne({ tenantId, slug });

  if (!linkDoc) {
    linkDoc = new InternalLink({
      tenantId,
      slug,
      related: [],
    });
    await linkDoc.save();
  }

  return linkDoc;
};

/**
 * Assign related links to a content item
 * @param {string} tenantId - Tenant ID
 * @param {string} slug - Current content slug
 * @param {number} count - Number of related links to assign (default: 7)
 * @returns {Promise<Array>} - Array of related slugs
 */
export const assignRelatedLinks = async (tenantId, slug, count = 7) => {
  try {
    // Get other content from the same tenant
    const otherContent = await Content.find({
      tenantId,
      slug: { $ne: slug },
    })
      .select('slug title')
      .limit(count * 2)
      .sort({ createdAt: -1 });

    if (otherContent.length === 0) {
      logger.info(`No other content found for tenant ${tenantId} to link to`);
      return [];
    }

    // Randomly select related links
    const shuffled = otherContent.sort(() => 0.5 - Math.random());
    const related = shuffled.slice(0, Math.min(count, shuffled.length)).map(c => c.slug);

    // Update or create internal link document
    await InternalLink.findOneAndUpdate(
      { tenantId, slug },
      {
        $set: { related },
        $setOnInsert: { tenantId, slug },
      },
      { upsert: true, new: true }
    );

    logger.info(`Assigned ${related.length} related links to ${slug}`);
    return related;
  } catch (error) {
    logger.error('Error assigning related links:', error);
    throw error;
  }
};

/**
 * Get related links for a slug
 * @param {string} tenantId - Tenant ID
 * @param {string} slug - Content slug
 * @returns {Promise<Array>} - Array of related content objects
 */
export const getRelatedLinks = async (tenantId, slug) => {
  try {
    const linkDoc = await InternalLink.findOne({ tenantId, slug });
    if (!linkDoc || linkDoc.related.length === 0) {
      return [];
    }

    const relatedContent = await Content.find({
      tenantId,
      slug: { $in: linkDoc.related },
    }).select('slug title');

    return relatedContent.map(c => ({
      slug: c.slug,
      title: c.title,
      url: `/pages/${c.slug}.html`,
    }));
  } catch (error) {
    logger.error('Error getting related links:', error);
    return [];
  }
};

/**
 * Refresh internal links for all existing content when new content is added
 * This ensures existing pages can link to newly created content
 * @param {string} tenantId - Tenant ID
 * @param {number} count - Number of links to assign per page (default: 7)
 * @returns {Promise<void>}
 */
export const refreshAllInternalLinks = async (tenantId, count = 7) => {
  try {
    const allContent = await Content.find({ tenantId }).select('slug');
    
    if (allContent.length < 2) {
      logger.info(`Not enough content to create internal links for tenant ${tenantId}`);
      return;
    }

    logger.info(`Refreshing internal links for ${allContent.length} content items in tenant ${tenantId}`);

    // Refresh links for all content
    for (const content of allContent) {
      try {
        await assignRelatedLinks(tenantId, content.slug, count);
      } catch (error) {
        logger.error(`Error refreshing links for ${content.slug}:`, error);
      }
    }

    logger.info(`Finished refreshing internal links for tenant ${tenantId}`);
  } catch (error) {
    logger.error('Error refreshing all internal links:', error);
    throw error;
  }
};

export default {
  getOrCreateLinkDoc,
  assignRelatedLinks,
  getRelatedLinks,
  refreshAllInternalLinks,
};

