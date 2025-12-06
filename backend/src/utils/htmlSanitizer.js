import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The HTML string to sanitize
 * @param {object} options - DOMPurify options
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (dirty, options = {}) => {
  if (!dirty) return '';
  
  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  };

  return purify.sanitize(dirty, { ...defaultOptions, ...options });
};

export default sanitizeHtml;

