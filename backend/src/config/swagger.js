import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SiteGenesis AI API',
      version: '1.0.0',
      description: 'Multi-Tenant AI Content Generation Platform API Documentation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        Tenant: {
          type: 'object',
          required: ['_id', 'name', 'domain'],
          properties: {
            _id: {
              type: 'string',
              description: 'Tenant identifier',
              example: 'site1',
            },
            name: {
              type: 'string',
              description: 'Tenant display name',
              example: 'My Site',
            },
            domain: {
              type: 'string',
              description: 'Website domain',
              example: 'example.com',
            },
            logoUrl: {
              type: 'string',
              description: 'Logo image URL',
              example: 'https://example.com/logo.png',
            },
            adsenseCode: {
              type: 'string',
              description: 'Google AdSense code',
            },
            theme: {
              type: 'object',
              properties: {
                primary: {
                  type: 'string',
                  example: '#3b82f6',
                },
                mode: {
                  type: 'string',
                  enum: ['light', 'dark', 'auto'],
                  example: 'light',
                },
              },
            },
            cronFrequency: {
              type: 'number',
              description: 'Posts per day',
              minimum: 1,
              maximum: 50,
              example: 5,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Keyword: {
          type: 'object',
          required: ['tenantId', 'keyword', 'type'],
          properties: {
            tenantId: {
              type: 'string',
              example: 'site1',
            },
            keyword: {
              type: 'string',
              example: 'artificial intelligence',
            },
            type: {
              type: 'string',
              enum: ['essay', 'speech', 'tenLines'],
              example: 'essay',
            },
            status: {
              type: 'string',
              enum: ['pending', 'generating', 'completed', 'failed'],
              example: 'pending',
            },
            slug: {
              type: 'string',
              example: 'artificial-intelligence',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Content: {
          type: 'object',
          properties: {
            tenantId: {
              type: 'string',
              example: 'site1',
            },
            type: {
              type: 'string',
              enum: ['essay', 'speech', 'tenLines'],
            },
            slug: {
              type: 'string',
              example: 'artificial-intelligence',
            },
            title: {
              type: 'string',
              example: 'Understanding Artificial Intelligence',
            },
            content: {
              type: 'string',
              description: 'HTML content',
            },
            sections: {
              type: 'object',
              description: 'Structured content sections',
            },
            faq: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
              },
            },
            html: {
              type: 'string',
              description: 'Generated HTML page',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager'],
              example: 'admin',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

