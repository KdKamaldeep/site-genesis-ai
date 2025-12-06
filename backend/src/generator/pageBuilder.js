import ejs from 'ejs';
import { promises as fs } from 'fs';
import { join } from 'path';
import config from '../config.js';
import Content from '../models/Content.js';
import Tenant from '../models/Tenant.js';
import { getRelatedLinks } from './linkManager.js';
import logger from '../utils/logger.js';

/**
 * Build HTML page for a content item
 * @param {string} tenantId - Tenant ID
 * @param {string} slug - Content slug
 * @returns {Promise<string>} - Generated HTML file path
 */
export const buildPage = async (tenantId, slug) => {
  try {
    // Load content and tenant
    const content = await Content.findOne({ tenantId, slug });
    if (!content) {
      throw new Error(`Content not found: ${slug}`);
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Get related links
    const relatedLinks = await getRelatedLinks(tenantId, slug);

    // Get all content pages for navigation bar
    const allContent = await Content.find({ tenantId })
      .select('slug title')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent for navigation
    
    const navigationLinks = allContent.map(c => ({
      slug: c.slug,
      title: c.title,
      url: `/${c.slug}.html`,
    }));

    // Load template
    const templatePath = join(
      config.tenantsDir,
      tenantId,
      'templates',
      'page.ejs'
    );

    let template;
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      // Fallback to default template
      const defaultTemplatePath = join(config.templatesDir, 'defaultPage.ejs');
      template = await fs.readFile(defaultTemplatePath, 'utf-8');
      logger.warn(`Using default template for tenant ${tenantId}`);
    }

    // Prepare template data
    const templateData = {
      slug: content.slug,
      title: content.title,
      content: content.content,
      sections: content.sections,
      faq: content.faq,
      internalLinks: relatedLinks,
      navigationLinks: navigationLinks, // All content pages for navigation bar
      adsense: tenant.adsenseCode,
      meta: content.meta || {
        title: content.title,
        description: content.content.substring(0, 160),
        keywords: [content.title],
      },
      tenant: {
        name: tenant.name,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        theme: tenant.theme,
      },
    };

    // Render HTML
    const html = ejs.render(template, templateData);

    // Save HTML file
    const pagesDir = join(config.tenantsDir, tenantId, 'public', 'pages');
    await fs.mkdir(pagesDir, { recursive: true });
    
    const htmlPath = join(pagesDir, `${slug}.html`);
    await fs.writeFile(htmlPath, html, 'utf-8');

    // Update content document with HTML
    content.html = html;
    await content.save();

    logger.info(`Page built: ${htmlPath}`);
    return htmlPath;
  } catch (error) {
    logger.error('Error building page:', error);
    throw error;
  }
};

/**
 * Generate sitemap.xml for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} - Sitemap file path
 */
export const generateSitemap = async (tenantId) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const contents = await Content.find({ tenantId }).select('slug updatedAt');
    
    // Get the most recent content update date for index.html
    const mostRecentUpdate = contents.length > 0 
      ? contents.reduce((latest, content) => 
          content.updatedAt > latest ? content.updatedAt : latest, 
          contents[0].updatedAt
        )
      : new Date();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${tenant.domain}/</loc>
    <lastmod>${mostRecentUpdate.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${contents.map(content => `  <url>
    <loc>https://${tenant.domain}/${content.slug}.html</loc>
    <lastmod>${content.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    const publicDir = join(config.tenantsDir, tenantId, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    const sitemapPath = join(publicDir, 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemap, 'utf-8');

    logger.info(`Sitemap generated: ${sitemapPath}`);
    return sitemapPath;
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    throw error;
  }
};

/**
 * Generate robots.txt for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} - Robots.txt file path
 */
export const generateRobotsTxt = async (tenantId) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://${tenant.domain}/sitemap.xml`;

    const publicDir = join(config.tenantsDir, tenantId, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    const robotsPath = join(publicDir, 'robots.txt');
    await fs.writeFile(robotsPath, robotsTxt, 'utf-8');

    logger.info(`Robots.txt generated: ${robotsPath}`);
    return robotsPath;
  } catch (error) {
    logger.error('Error generating robots.txt:', error);
    throw error;
  }
};

/**
 * Generate index.html for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} - Generated index.html file path
 */
export const generateIndexPage = async (tenantId) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Get all content pages
    const allContent = await Content.find({ tenantId })
      .select('slug title createdAt')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 most recent

    // Load template
    const templatePath = join(
      config.tenantsDir,
      tenantId,
      'templates',
      'index.ejs'
    );

    let template;
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      // Fallback to default template
      const defaultTemplatePath = join(config.templatesDir, 'defaultIndex.ejs');
      try {
        template = await fs.readFile(defaultTemplatePath, 'utf-8');
      } catch (defaultError) {
        // Create a simple default index template
        template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= tenant.name %></title>
  <meta name="description" content="Welcome to <%= tenant.name %>">
</head>
<body>
  <h1><%= tenant.name %></h1>
  <nav>
    <ul>
      <% navigationLinks.forEach(link => { %>
        <li><a href="<%= link.url %>"><%= link.title %></a></li>
      <% }); %>
    </ul>
  </nav>
  <main>
    <h2>All Content</h2>
    <ul>
      <% navigationLinks.forEach(link => { %>
        <li><a href="<%= link.url %>"><%= link.title %></a></li>
      <% }); %>
    </ul>
  </main>
</body>
</html>`;
        logger.warn(`Using generated default index template for tenant ${tenantId}`);
      }
    }

    const navigationLinks = allContent.map(c => ({
      slug: c.slug,
      title: c.title,
      url: `/pages/${c.slug}.html`,
    }));

    // Prepare template data
    const templateData = {
      tenant: {
        name: tenant.name,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        theme: tenant.theme,
      },
      navigationLinks: navigationLinks,
      contentCount: allContent.length,
    };

    // Render HTML
    const html = ejs.render(template, templateData);

    // Save HTML file
    const publicDir = join(config.tenantsDir, tenantId, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    const indexPath = join(publicDir, 'index.html');
    await fs.writeFile(indexPath, html, 'utf-8');

    logger.info(`Index page built: ${indexPath}`);
    return indexPath;
  } catch (error) {
    logger.error('Error generating index page:', error);
    throw error;
  }
};

/**
 * Generate nginx.conf for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} - Generated nginx.conf file path
 */
export const generateNginxConfig = async (tenantId) => {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const nginxConfig = `# Nginx configuration for ${tenant.name} (${tenant.domain})
# Generated automatically - do not edit manually
# 
# To use this configuration:
# 1. Copy this file to /etc/nginx/sites-available/${tenant.domain}
# 2. Update the 'root' directive with the actual path to the tenant's public directory
# 3. Create symlink: ln -s /etc/nginx/sites-available/${tenant.domain} /etc/nginx/sites-enabled/
# 4. Test: nginx -t
# 5. Reload: systemctl reload nginx

server {
    listen 80;
    listen [::]:80;
    server_name ${tenant.domain} www.${tenant.domain};

    # Public root of your tenant
    root /;

    # Default index inside /pages
    index /pages/index.html;

    # Logging
    access_log /var/log/nginx/${tenantId}-access.log;
    error_log /var/log/nginx/${tenantId}-error.log;

    # Serve homepage
    location = / {
        try_files /pages/index.html =404;
    }

    # Serve any page as /slug → /pages/slug.html
    location / {
        try_files $uri $uri/ /pages/$uri.html =404;
    }

    # Static assets (css, js, images)
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # robots.txt at root
    location = /robots.txt {
        try_files /robots.txt =404;
        add_header Content-Type "text/plain";
    }

    # sitemap.xml at root
    location = /sitemap.xml {
        try_files /sitemap.xml =404;
        add_header Content-Type "application/xml";
    }

    # Prevent access to hidden files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
`;

    // Save nginx config file in tenant's public directory (same location as sitemap.xml)
    const publicDir = join(config.tenantsDir, tenantId, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    const nginxConfigPath = join(publicDir, 'nginx.conf');
    await fs.writeFile(nginxConfigPath, nginxConfig, 'utf-8');

    logger.info(`Nginx config generated: ${nginxConfigPath}`);
    return nginxConfigPath;
  } catch (error) {
    logger.error('Error generating nginx config:', error);
    throw error;
  }
};

export default {
  buildPage,
  generateSitemap,
  generateRobotsTxt,
  generateIndexPage,
  generateNginxConfig,
};

