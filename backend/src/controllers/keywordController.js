import Keyword from '../models/Keyword.js';
import Content from '../models/Content.js';
import { slugify } from '../utils/slugify.js';
import logger from '../utils/logger.js';
import { generateContent } from '../generator/contentWriter.js';
import { assignRelatedLinks } from '../generator/linkManager.js';
import { buildPage } from '../generator/pageBuilder.js';

export const createKeyword = async (req, res) => {
  try {
    const { tenantId, keyword, type, slug: customSlug, customPrompt } = req.body;

    if (!tenantId || !keyword || !type) {
      return res.status(400).json({ error: 'Missing required fields: tenantId, keyword, type' });
    }

    if (!['essay', 'speech', 'tenLines', 'pageContent'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: essay, speech, tenLines, or pageContent' });
    }

    // For pageContent type, custom prompt is required
    if (type === 'pageContent' && (!customPrompt || !customPrompt.trim())) {
      return res.status(400).json({ error: 'Custom prompt is required for pageContent type' });
    }

    // Use custom slug if provided, otherwise generate from keyword
    const slug = customSlug ? slugify(customSlug) : slugify(keyword);

    // Check if keyword with same slug already exists
    const existing = await Keyword.findOne({ tenantId, slug });
    if (existing) {
      return res.status(400).json({ error: 'Keyword with this slug already exists' });
    }

    const keywordDoc = new Keyword({
      tenantId,
      keyword,
      type,
      slug,
      customPrompt: customPrompt || null,
      status: 'pending',
    });

    await keywordDoc.save();

    logger.info(`Keyword created: ${keyword} for tenant ${tenantId} with slug: ${slug}`);
    res.status(201).json(keywordDoc);
  } catch (error) {
    logger.error('Error creating keyword:', error);
    res.status(500).json({ error: error.message });
  }
};

export const bulkCreateKeywords = async (req, res) => {
  try {
    const { tenantId, keywords, type } = req.body;

    if (!tenantId || !keywords || !Array.isArray(keywords) || !type) {
      return res.status(400).json({ error: 'Missing required fields: tenantId, keywords (array), type' });
    }

    const keywordDocs = [];
    const errors = [];

    for (const keyword of keywords) {
      try {
        const slug = slugify(keyword);
        const existing = await Keyword.findOne({ tenantId, slug });
        
        if (!existing) {
          keywordDocs.push({
            tenantId,
            keyword: keyword.trim(),
            type,
            slug,
            status: 'pending',
          });
        }
      } catch (error) {
        errors.push({ keyword, error: error.message });
      }
    }

    if (keywordDocs.length > 0) {
      await Keyword.insertMany(keywordDocs);
    }

    logger.info(`Bulk created ${keywordDocs.length} keywords for tenant ${tenantId}`);
    res.status(201).json({
      created: keywordDocs.length,
      errors: errors.length,
      errorDetails: errors,
    });
  } catch (error) {
    logger.error('Error bulk creating keywords:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getKeywords = async (req, res) => {
  try {
    const { tenantId, status, type, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [keywords, total] = await Promise.all([
      Keyword.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Keyword.countDocuments(query),
    ]);

    res.json({
      keywords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching keywords:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getKeyword = async (req, res) => {
  try {
    const keyword = await Keyword.findById(req.params.id);
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }
    res.json(keyword);
  } catch (error) {
    logger.error('Error fetching keyword:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateKeyword = async (req, res) => {
  try {
    const { keyword, type, status, slug: customSlug, customPrompt } = req.body;
    
    const keywordDoc = await Keyword.findById(req.params.id);
    if (!keywordDoc) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const updateData = { updatedAt: new Date() };
    
    if (keyword !== undefined) {
      updateData.keyword = keyword;
      // Only update slug if custom slug is not provided, or if keyword changed
      if (!customSlug) {
        updateData.slug = slugify(keyword);
      }
    }
    
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    
    // Handle custom slug - if provided, use it; if empty string, regenerate from keyword
    if (customSlug !== undefined) {
      if (customSlug && customSlug.trim()) {
        updateData.slug = slugify(customSlug);
      } else if (keyword !== undefined) {
        // If slug is cleared, regenerate from keyword
        updateData.slug = slugify(keyword);
      }
    }
    
    // Handle custom prompt - can be set or cleared
    if (customPrompt !== undefined) {
      updateData.customPrompt = customPrompt && customPrompt.trim() ? customPrompt.trim() : null;
    }

    // Check if slug conflicts with another keyword (excluding current one)
    if (updateData.slug) {
      const existing = await Keyword.findOne({ 
        tenantId: keywordDoc.tenantId, 
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ error: 'Keyword with this slug already exists' });
      }
    }

    const updatedKeyword = await Keyword.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Keyword updated: ${req.params.id}`);
    res.json(updatedKeyword);
  } catch (error) {
    logger.error('Error updating keyword:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteKeyword = async (req, res) => {
  try {
    const keyword = await Keyword.findByIdAndDelete(req.params.id);
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    logger.info(`Keyword deleted: ${req.params.id}`);
    res.json({ message: 'Keyword deleted successfully' });
  } catch (error) {
    logger.error('Error deleting keyword:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retry generating content for a keyword
 * Resets status to pending and triggers content generation
 */
export const retryKeyword = async (req, res) => {
  try {
    const keyword = await Keyword.findById(req.params.id);
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    // Reset keyword status and clear error/retry count
    keyword.status = 'pending';
    keyword.retryCount = 0;
    keyword.error = null;
    await keyword.save();

    logger.info(`Retrying keyword: ${keyword.keyword} (${keyword.slug})`);

    // Delete existing content if it exists (to allow regeneration)
    const existingContent = await Content.findOne({ 
      tenantId: keyword.tenantId, 
      slug: keyword.slug 
    });
    if (existingContent) {
      await Content.findByIdAndDelete(existingContent._id);
      logger.info(`Deleted existing content for slug: ${keyword.slug}`);
    }

    // Generate content immediately
    try {
      // Update status to generating
      keyword.status = 'generating';
      await keyword.save();

      // Generate content
      const result = await generateContent(keyword.tenantId, keyword);
      const content = result.content;
      const aiProvider = result.provider;

      // Assign related links
      await assignRelatedLinks(keyword.tenantId, keyword.slug, 7);

      // Build HTML page
      await buildPage(keyword.tenantId, keyword.slug);

      // Mark as completed
      keyword.status = 'completed';
      keyword.retryCount = 0;
      keyword.error = null;
      keyword.aiProvider = aiProvider;
      await keyword.save();

      logger.info(`Successfully regenerated content for keyword: ${keyword.keyword}`);
      res.json({
        message: 'Content generated successfully',
        keyword,
      });
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

      // Mark as failed
      keyword.status = 'failed';
      keyword.error = errorMessage;
      keyword.aiProvider = provider;
      await keyword.save();

      res.status(500).json({
        error: 'Failed to generate content',
        message: errorMessage,
        keyword,
      });
    }
  } catch (error) {
    logger.error('Error retrying keyword:', error);
    res.status(500).json({ error: error.message });
  }
};

