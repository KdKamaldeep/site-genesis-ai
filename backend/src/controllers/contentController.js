import Content from '../models/Content.js';
import { generateContent } from '../generator/contentWriter.js';
import { buildPage, generateSitemap, generateRobotsTxt, generateIndexPage } from '../generator/pageBuilder.js';
import { assignRelatedLinks } from '../generator/linkManager.js';
import { loadPendingKeywords, updateKeywordStatus } from '../generator/keywordLoader.js';
import Keyword from '../models/Keyword.js';
import logger from '../utils/logger.js';

export const getContent = async (req, res) => {
  try {
    const { tenantId, type, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Content.countDocuments(query),
    ]);

    res.json({
      contents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching content:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    logger.error('Error fetching content:', error);
    res.status(500).json({ error: error.message });
  }
};

export const generateContentForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { count = 5 } = req.body;

    // Load pending keywords
    const keywords = await loadPendingKeywords(tenantId, parseInt(count));
    
    if (keywords.length === 0) {
      return res.json({ message: 'No pending keywords found', generated: 0 });
    }

    const results = [];

    for (const keyword of keywords) {
      try {
        const isRetry = keyword.status === 'failed';
        if (isRetry) {
          logger.info(`Retrying failed keyword: ${keyword.keyword} (attempt ${(keyword.retryCount || 0) + 1}/2)`);
        }

        // Update status to generating
        await updateKeywordStatus(keyword._id, 'generating');

        // Generate content and get provider info
        const result = await generateContent(tenantId, keyword);
        const content = result.content;
        const aiProvider = result.provider;

        // Assign related links
        await assignRelatedLinks(tenantId, keyword.slug, 7);

        // Build HTML page
        await buildPage(tenantId, keyword.slug);

        // Reset retry count on success and mark as completed, store AI provider
        await Keyword.findByIdAndUpdate(keyword._id, {
          status: 'completed',
          retryCount: 0,
          error: null,
          aiProvider: aiProvider,
          updatedAt: new Date(),
        });

        results.push({ keyword: keyword.keyword, slug: keyword.slug, status: 'success' });
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
        
        const keywordDoc = await Keyword.findById(keyword._id);
        const finalStatus = keywordDoc?.status === 'failed_permanent' ? 'failed_permanent' : 'failed';
        results.push({ 
          keyword: keyword.keyword, 
          status: finalStatus, 
          retryCount: keywordDoc?.retryCount || 0,
          error: errorMessage,
          aiProvider: keywordDoc?.aiProvider || provider,
        });
      }
    }

    // Regenerate sitemap, robots.txt, and index page
    await generateSitemap(tenantId);
    await generateRobotsTxt(tenantId);
    await generateIndexPage(tenantId);

    logger.info(`Generated ${results.filter(r => r.status === 'success').length} content items for tenant ${tenantId}`);
    res.json({
      message: 'Content generation completed',
      results,
      generated: results.filter(r => r.status === 'success').length,
    });
  } catch (error) {
    logger.error('Error generating content:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { title, content, sections, faq, meta } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (sections) updateData.sections = sections;
    if (faq) updateData.faq = faq;
    if (meta) updateData.meta = meta;

    const contentDoc = await Content.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contentDoc) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Rebuild page if HTML exists
    if (contentDoc.html) {
      await buildPage(contentDoc.tenantId, contentDoc.slug);
    }

    logger.info(`Content updated: ${req.params.id}`);
    res.json(contentDoc);
  } catch (error) {
    logger.error('Error updating content:', error);
    res.status(500).json({ error: error.message });
  }
};

export const regenerateContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Find or create keyword document
    let keyword = await Keyword.findOne({ tenantId: content.tenantId, slug: content.slug });
    if (!keyword) {
      keyword = new Keyword({
        tenantId: content.tenantId,
        keyword: content.title,
        type: content.type,
        slug: content.slug,
        status: 'generating',
      });
      await keyword.save();
    }

    // Regenerate content
    const result = await generateContent(content.tenantId, keyword);
    const newContent = result.content;
    const aiProvider = result.provider;
    
    // Update keyword with AI provider and clear error
    await Keyword.findByIdAndUpdate(keyword._id, {
      status: 'completed',
      aiProvider: aiProvider,
      error: null,
      updatedAt: new Date(),
    });
    
    // Rebuild page and index
    await buildPage(content.tenantId, content.slug);
    await generateIndexPage(content.tenantId);

    logger.info(`Content regenerated: ${req.params.id} using ${aiProvider}`);
    res.json(newContent);
  } catch (error) {
    logger.error('Error regenerating content:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    logger.info(`Content deleted: ${req.params.id}`);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    logger.error('Error deleting content:', error);
    res.status(500).json({ error: error.message });
  }
};

