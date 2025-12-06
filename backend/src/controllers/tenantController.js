import Tenant from '../models/Tenant.js';
import Keyword from '../models/Keyword.js';
import Content from '../models/Content.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import config from '../config.js';
import logger from '../utils/logger.js';
import { slugify } from '../utils/slugify.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  },
});

export const createTenant = async (req, res) => {
  try {
    const { _id, name, domain, logoUrl, adsenseCode, theme, cronFrequency } = req.body;

    if (!_id || !name || !domain) {
      return res.status(400).json({ error: 'Missing required fields: _id, name, domain' });
    }

    // Create tenant directory structure
    const tenantDir = join(config.tenantsDir, _id);
    const dirs = [
      join(tenantDir, 'templates'),
      join(tenantDir, 'public', 'pages'),
      join(tenantDir, 'public', 'assets'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create default config.json
    const configJson = {
      tenantId: _id,
      name,
      domain,
      logoUrl: logoUrl || '',
      adsenseCode: adsenseCode || '',
      theme: theme || { primary: '#3b82f6', mode: 'light' },
      cronFrequency: cronFrequency || 5,
    };
    await fs.writeFile(
      join(tenantDir, 'config.json'),
      JSON.stringify(configJson, null, 2),
      'utf-8'
    );

    // Create default template if it doesn't exist
    const templatePath = join(tenantDir, 'templates', 'page.ejs');
    try {
      await fs.access(templatePath);
    } catch {
      const defaultTemplate = await fs.readFile(
        join(config.templatesDir, 'defaultPage.ejs'),
        'utf-8'
      );
      await fs.writeFile(templatePath, defaultTemplate, 'utf-8');
    }

    // Create tenant in database
    const tenant = new Tenant({
      _id,
      name,
      domain,
      logoUrl: logoUrl || '',
      adsenseCode: adsenseCode || '',
      theme: theme || { primary: '#3b82f6', mode: 'light' },
      cronFrequency: cronFrequency || 5,
    });

    await tenant.save();

    logger.info(`Tenant created: ${_id}`);
    res.status(201).json(tenant);
  } catch (error) {
    logger.error('Error creating tenant:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Tenant ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const { name, domain, logoUrl, adsenseCode, theme, cronFrequency } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(domain && { domain }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(adsenseCode !== undefined && { adsenseCode }),
        ...(theme && { theme }),
        ...(cronFrequency !== undefined && { cronFrequency }),
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update config.json
    const configJson = {
      tenantId: tenant._id,
      name: tenant.name,
      domain: tenant.domain,
      logoUrl: tenant.logoUrl,
      adsenseCode: tenant.adsenseCode,
      theme: tenant.theme,
      cronFrequency: tenant.cronFrequency,
    };
    await fs.writeFile(
      join(config.tenantsDir, tenant._id, 'config.json'),
      JSON.stringify(configJson, null, 2),
      'utf-8'
    );

    logger.info(`Tenant updated: ${req.params.id}`);
    res.json(tenant);
  } catch (error) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Optionally delete tenant directory (commented out for safety)
    // const tenantDir = join(config.tenantsDir, req.params.id);
    // await fs.rm(tenantDir, { recursive: true, force: true });

    logger.info(`Tenant deleted: ${req.params.id}`);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Import tenant from JSON file
 */
export const importTenant = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse JSON from uploaded file
    let tenantData;
    try {
      tenantData = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON file format' });
    }

    // Validate required fields
    if (!tenantData._id || !tenantData.name || !tenantData.domain) {
      return res.status(400).json({ 
        error: 'Missing required fields: _id, name, domain' 
      });
    }

    // Check if tenant already exists
    const existing = await Tenant.findById(tenantData._id);
    if (existing) {
      return res.status(400).json({ error: `Tenant with ID "${tenantData._id}" already exists` });
    }

    // Create tenant directory structure
    const tenantDir = join(config.tenantsDir, tenantData._id);
    const dirs = [
      join(tenantDir, 'templates'),
      join(tenantDir, 'public', 'pages'),
      join(tenantDir, 'public', 'assets'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create config.json
    const configJson = {
      tenantId: tenantData._id,
      name: tenantData.name,
      domain: tenantData.domain,
      logoUrl: tenantData.logoUrl || '',
      adsenseCode: tenantData.adsenseCode || '',
      theme: tenantData.theme || { primary: '#3b82f6', mode: 'light' },
      cronFrequency: tenantData.cronFrequency || 5,
    };
    await fs.writeFile(
      join(tenantDir, 'config.json'),
      JSON.stringify(configJson, null, 2),
      'utf-8'
    );

    // Create template if provided, otherwise use default
    const templatePath = join(tenantDir, 'templates', 'page.ejs');
    if (tenantData.template) {
      await fs.writeFile(templatePath, tenantData.template, 'utf-8');
    } else {
      const defaultTemplate = await fs.readFile(
        join(config.templatesDir, 'defaultPage.ejs'),
        'utf-8'
      );
      await fs.writeFile(templatePath, defaultTemplate, 'utf-8');
    }

    // Create tenant in database
    const tenant = new Tenant({
      _id: tenantData._id,
      name: tenantData.name,
      domain: tenantData.domain,
      logoUrl: tenantData.logoUrl || '',
      adsenseCode: tenantData.adsenseCode || '',
      theme: tenantData.theme || { primary: '#3b82f6', mode: 'light' },
      cronFrequency: tenantData.cronFrequency || 5,
    });

    await tenant.save();

    const importResults = {
      tenant: tenant._id,
      keywords: { created: 0, skipped: 0, errors: [] },
      content: { created: 0, skipped: 0, errors: [] },
    };

    // Import keywords if provided
    if (tenantData.keywords && Array.isArray(tenantData.keywords)) {
      for (const kwData of tenantData.keywords) {
        try {
          const keywordText = kwData.keyword || kwData;
          const keywordType = kwData.type || 'essay';
          const keywordStatus = kwData.status || 'pending';
          const keywordSlug = kwData.slug || slugify(keywordText);

          // Validate type
          if (!['essay', 'speech', 'tenLines'].includes(keywordType)) {
            importResults.keywords.errors.push({
              keyword: keywordText,
              error: `Invalid type: ${keywordType}`,
            });
            continue;
          }

          // Check if keyword already exists
          const existingKeyword = await Keyword.findOne({
            tenantId: tenantData._id,
            slug: keywordSlug,
          });

          if (existingKeyword) {
            importResults.keywords.skipped++;
            continue;
          }

          // Create keyword
          const keyword = new Keyword({
            tenantId: tenantData._id,
            keyword: keywordText,
            type: keywordType,
            slug: keywordSlug,
            status: keywordStatus,
            createdAt: kwData.createdAt ? new Date(kwData.createdAt) : new Date(),
            updatedAt: kwData.updatedAt ? new Date(kwData.updatedAt) : new Date(),
          });

          await keyword.save();
          importResults.keywords.created++;
        } catch (error) {
          importResults.keywords.errors.push({
            keyword: kwData.keyword || kwData,
            error: error.message,
          });
        }
      }
    }

    // Import content if provided
    if (tenantData.content && Array.isArray(tenantData.content)) {
      for (const contentData of tenantData.content) {
        try {
          if (!contentData.slug || !contentData.title || !contentData.content) {
            importResults.content.errors.push({
              slug: contentData.slug || 'unknown',
              error: 'Missing required fields: slug, title, or content',
            });
            continue;
          }

          // Check if content already exists
          const existingContent = await Content.findOne({
            tenantId: tenantData._id,
            slug: contentData.slug,
          });

          if (existingContent) {
            importResults.content.skipped++;
            continue;
          }

          // Create content
          const content = new Content({
            tenantId: tenantData._id,
            type: contentData.type || 'essay',
            slug: contentData.slug,
            title: contentData.title,
            sections: contentData.sections || {},
            content: contentData.content,
            faq: contentData.faq || [],
            meta: contentData.meta || {},
            html: contentData.html || '',
            createdAt: contentData.createdAt ? new Date(contentData.createdAt) : new Date(),
            updatedAt: contentData.updatedAt ? new Date(contentData.updatedAt) : new Date(),
          });

          await content.save();
          importResults.content.created++;
        } catch (error) {
          importResults.content.errors.push({
            slug: contentData.slug || 'unknown',
            error: error.message,
          });
        }
      }
    }

    logger.info(`Tenant imported from JSON: ${tenantData._id}`, importResults);
    res.status(201).json({
      message: 'Tenant imported successfully',
      tenant,
      importResults,
    });
  } catch (error) {
    logger.error('Error importing tenant:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Tenant ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single('tenantFile');

// Multer error handler middleware
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

