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
      url: `/${c.slug}.html`,
    }));
  } catch (error) {
    logger.error('Error getting related links:', error);
    return [];
  }
};

export default {
  getOrCreateLinkDoc,
  assignRelatedLinks,
  getRelatedLinks,
};

