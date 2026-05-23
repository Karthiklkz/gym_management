import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gym Management API',
      version: '1.0.0',
      description: 'API documentation for the Gym Management System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      '/api/auth/signup': {
        post: {
          summary: 'Create a new user',
          description: 'Registers a new user (use role: "SUPER_ADMIN" for full access).',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'role', 'firstName'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    role: { type: 'string', enum: ['SUPER_ADMIN', 'GYM_ADMIN', 'TRAINER', 'MEMBER'] },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 
            201: { description: 'User created successfully' },
            400: { description: 'Validation error' }
          }
        }
      },
      '/api/super-admin/gyms': {
        post: {
          summary: 'Create a new gym with admin',
          tags: ['Super Admin'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'ownerName', 'email', 'phone', 'subscriptionPlanId', 'adminFirstName', 'adminEmail', 'adminPassword'],
                  properties: {
                    name: { type: 'string' },
                    ownerName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    subscriptionPlanId: { type: 'string', format: 'uuid' },
                    adminFirstName: { type: 'string' },
                    adminEmail: { type: 'string' },
                    adminPassword: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Created' } }
        }
      }
    }
  },
  apis: ['./app/api/**/*.ts', './api/models/**/*.ts'],
};

export const spec = swaggerJsdoc(options);
