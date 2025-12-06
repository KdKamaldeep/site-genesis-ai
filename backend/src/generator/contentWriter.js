import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';
import Content from '../models/Content.js';
import logger from '../utils/logger.js';
import { sanitizeHtml } from '../utils/htmlSanitizer.js';
import { getAIProviderStatus } from '../controllers/aiProviderController.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

/**
 * Generate content using AI (OpenAI or Gemini)
 * @param {string} keyword - The keyword to generate content for
 * @param {string} type - Content type (essay, speech, tenLines)
 * @param {object} options - Additional options (wordCount, duration, customPrompt, etc.)
 * @returns {Promise<object>} - Generated content object with provider info: { content, provider }
 */
const generateWithAI = async (keyword, type, options = {}) => {
  const prompt = buildPrompt(keyword, type, options, options.customPrompt);
  let lastError = null;
  
  // Get enabled provider status
  const providerStatus = await getAIProviderStatus();
  const openaiEnabled = providerStatus.openai && openai;
  const geminiEnabled = providerStatus.gemini && genAI;
  
  if (!openaiEnabled && !geminiEnabled) {
    throw new Error('No AI providers are enabled or configured');
  }
  
  // Try OpenAI first if enabled, fallback to Gemini
  if (openaiEnabled) {
    try {
      const content = await generateWithOpenAI(prompt, type);
      return { content, provider: 'openai' };
    } catch (error) {
      lastError = error;
      logger.warn('OpenAI generation failed, trying Gemini:', error.message);
    }
  }

  if (geminiEnabled) {
    try {
      const content = await generateWithGemini(prompt, type, keyword);
      return { content, provider: 'gemini' };
    } catch (error) {
      lastError = error;
      logger.error('Gemini generation failed:', error.message);
      // If we tried OpenAI first and it failed, include that in the error
      if (openaiEnabled && lastError) {
        throw new Error(`AI generation failed: OpenAI error - ${lastError.message}, Gemini error - ${error.message}`);
      }
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  throw new Error('No enabled AI providers available');
};

const generateWithOpenAI = async (prompt, type) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert content writer specializing in SEO-optimized, engaging content. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = JSON.parse(response.choices[0].message.content);
  return content;
};

const generateWithGemini = async (prompt, type, keyword = '') => {
  // Try configured model first, then fallback to newer models, then older ones
  const modelNames = [
    config.geminiModel, // Use configured model first
  ].filter((name, index, arr) => name && arr.indexOf(name) === index); // Remove duplicates
  let lastError;
  
  for (const modelName of modelNames) {
    try {
      logger.info(`Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`Successfully used Gemini model: ${modelName}`);
      
      // Try to parse JSON from response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        // Fallback: structure the response manually
        return {
          title: keyword || 'Generated Content',
          content: text,
          sections: {},
          faq: [],
        };
      } catch (parseError) {
        logger.error('Error parsing Gemini response:', parseError);
        return {
          title: keyword || 'Generated Content',
          content: text,
          sections: {},
          faq: [],
        };
      }
    } catch (error) {
      lastError = error;
      logger.warn(`Gemini model ${modelName} failed:`, error.message);
      // Continue to next model
      continue;
    }
  }
  
  // If all models failed, throw error
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

const buildPrompt = (keyword, type, options, customPrompt = null) => {
  let basePrompt = '';

  switch (type) {
    case 'essay':
      const wordCount = options.wordCount || 500;
      basePrompt = `Write a comprehensive, SEO-optimized essay about "${keyword}" with exactly ${wordCount} words. 
      Structure it with an introduction, 3-5 main sections, and a conclusion.
      Return a JSON object with:
      {
        "title": "SEO-friendly title",
        "content": "Full essay content in HTML format with <p>, <h2>, <h3> tags",
        "sections": {
          "introduction": "Introduction paragraph",
          "section1": "First main section",
          "section2": "Second main section",
          "conclusion": "Conclusion paragraph"
        },
        "faq": [
          {"question": "Question 1", "answer": "Answer 1"},
          {"question": "Question 2", "answer": "Answer 2"}
        ],
        "meta": {
          "title": "SEO title (60 chars max)",
          "description": "Meta description (160 chars max)",
          "keywords": ["keyword1", "keyword2", "keyword3"]
        }
      }`;
      break;

    case 'speech':
      const duration = options.duration || 2;
      basePrompt = `Write a ${duration}-minute speech about "${keyword}". 
      The speech should be engaging, well-structured, and suitable for public speaking.
      Return a JSON object with:
      {
        "title": "Speech title",
        "content": "Full speech content in HTML format",
        "sections": {
          "opening": "Opening lines",
          "body": "Main content",
          "closing": "Closing remarks"
        },
        "faq": [],
        "meta": {
          "title": "SEO title",
          "description": "Meta description",
          "keywords": ["keyword1", "keyword2"]
        }
      }`;
      break;

    case 'tenLines':
      basePrompt = `Write a concise, informative 10-line content piece about "${keyword}".
      Each line should be a complete, valuable sentence.
      Return a JSON object with:
      {
        "title": "Content title",
        "content": "10 lines of content, each on a new line",
        "sections": {},
        "faq": [
          {"question": "What is ${keyword}?", "answer": "Brief answer"}
        ],
        "meta": {
          "title": "SEO title",
          "description": "Meta description",
          "keywords": ["keyword1", "keyword2"]
        }
      }`;
      break;

    case 'pageContent':
      // For pageContent, custom prompt is required
      if (!customPrompt || !customPrompt.trim()) {
        throw new Error('Custom prompt is required for pageContent type');
      }
      // Base prompt ensures JSON structure is returned
      basePrompt = `Based on the following instructions, create comprehensive page content about "${keyword}".
      Return a JSON object with:
      {
        "title": "SEO-friendly title",
        "content": "Full page content in HTML format with <p>, <h2>, <h3> tags",
        "sections": {
          "introduction": "Introduction paragraph",
          "section1": "First main section",
          "section2": "Second main section",
          "conclusion": "Conclusion paragraph"
        },
        "faq": [
          {"question": "Question 1", "answer": "Answer 1"},
          {"question": "Question 2", "answer": "Answer 2"}
        ],
        "meta": {
          "title": "SEO title (60 chars max)",
          "description": "Meta description (160 chars max)",
          "keywords": ["keyword1", "keyword2", "keyword3"]
        }
      }`;
      // For pageContent, custom prompt comes first, then base prompt
      return `${customPrompt.trim()}\n\n${basePrompt}`;

    default:
      throw new Error(`Unknown content type: ${type}`);
  }

  // If custom prompt is provided, combine it with the base prompt
  if (customPrompt && customPrompt.trim()) {
    return `${customPrompt.trim()}\n\n${basePrompt}`;
  }

  return basePrompt;
};

/**
 * Generate and save content for a keyword
 * @param {string} tenantId - Tenant ID
 * @param {object} keywordDoc - Keyword document
 * @returns {Promise<object>} - Created content document
 */
export const generateContent = async (tenantId, keywordDoc) => {
  try {
    logger.info(`Generating ${keywordDoc.type} content for keyword: ${keywordDoc.keyword}`);

    const options = {
      wordCount: keywordDoc.type === 'essay' ? 500 : undefined,
      duration: keywordDoc.type === 'speech' ? 2 : undefined,
      customPrompt: keywordDoc.customPrompt || null,
    };

    const aiResult = await generateWithAI(keywordDoc.keyword, keywordDoc.type, options);
    const aiResponse = aiResult.content;
    const aiProvider = aiResult.provider;

    logger.info(`Generated content using ${aiProvider} for keyword: ${keywordDoc.keyword}`);

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(aiResponse.content || '');
    const sanitizedTitle = aiResponse.title || keywordDoc.keyword;

    // Create content document
    const content = new Content({
      tenantId,
      type: keywordDoc.type,
      slug: keywordDoc.slug,
      title: sanitizedTitle,
      sections: aiResponse.sections || {},
      content: sanitizedContent,
      faq: aiResponse.faq || [],
      meta: aiResponse.meta || {
        title: sanitizedTitle,
        description: sanitizedContent.substring(0, 160),
        keywords: [keywordDoc.keyword],
      },
    });

    await content.save();
    logger.info(`Content generated and saved for slug: ${keywordDoc.slug}`);

    // Return both content and provider info
    return { content, provider: aiProvider };
  } catch (error) {
    logger.error('Error generating content:', error);
    throw error;
  }
};

export default {
  generateContent,
};

