import { promises as fs } from 'fs';
import { join } from 'path';
import config from '../config.js';
import Tenant from '../models/Tenant.js';
import logger from '../utils/logger.js';

export const getTemplate = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const templatePath = join(config.tenantsDir, tenantId, 'templates', 'page.ejs');
    
    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      res.json({ tenantId, template });
    } catch (error) {
      // Return default template if tenant template doesn't exist
      const defaultTemplate = await fs.readFile(
        join(config.templatesDir, 'defaultPage.ejs'),
        'utf-8'
      );
      res.json({ tenantId, template: defaultTemplate, isDefault: true });
    }
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Template content is required' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const templateDir = join(config.tenantsDir, tenantId, 'templates');
    await fs.mkdir(templateDir, { recursive: true });

    const templatePath = join(templateDir, 'page.ejs');
    await fs.writeFile(templatePath, template, 'utf-8');

    logger.info(`Template updated for tenant: ${tenantId}`);
    res.json({ message: 'Template updated successfully', tenantId });
  } catch (error) {
    logger.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
};

export const previewTemplate = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Template content is required' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Use sample data for preview
    const sampleData = {
      title: 'Sample Article Title',
      content: '<p>This is a sample content paragraph for preview purposes.</p>',
      sections: {
        introduction: 'Sample introduction',
        section1: 'Sample section 1',
        conclusion: 'Sample conclusion',
      },
      faq: [
        { question: 'Sample Question 1?', answer: 'Sample Answer 1' },
        { question: 'Sample Question 2?', answer: 'Sample Answer 2' },
      ],
      internalLinks: [
        { slug: 'sample-article-1', title: 'Sample Article 1', url: '/sample-article-1.html' },
        { slug: 'sample-article-2', title: 'Sample Article 2', url: '/sample-article-2.html' },
      ],
      adsense: tenant.adsenseCode,
      meta: {
        title: 'Sample Article Title',
        description: 'This is a sample meta description for preview.',
        keywords: ['sample', 'preview'],
      },
      tenant: {
        name: tenant.name,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        theme: tenant.theme,
      },
    };

    const ejs = (await import('ejs')).default;
    const html = ejs.render(template, sampleData);

    res.json({ html });
  } catch (error) {
    logger.error('Error previewing template:', error);
    res.status(500).json({ error: error.message });
  }
};

