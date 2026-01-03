const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LookupProtocol API',
            version: '2.0.0',
            description: 'A modern product lookup system with REST API',
            contact: {
                name: 'API Support',
                email: 'support@lookupprotocol.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    required: ['id', 'category', 'name', 'quantity', 'unit_price', 'code'],
                    properties: {
                        id: {
                            type: 'string',
                            pattern: '^\\d{3}-\\d{2}$',
                            example: '000-01',
                            description: 'Product ID in format XXX-XX'
                        },
                        category: {
                            type: 'string',
                            example: 'clothing',
                            description: 'Product category'
                        },
                        name: {
                            type: 'string',
                            example: 'Product Name',
                            description: 'Product name'
                        },
                        description: {
                            type: 'string',
                            example: 'Product description',
                            description: 'Product description'
                        },
                        quantity: {
                            type: 'integer',
                            minimum: 0,
                            example: 100,
                            description: 'Product quantity in stock'
                        },
                        unit_price: {
                            type: 'number',
                            minimum: 0,
                            example: 50.00,
                            description: 'Product unit price'
                        },
                        code: {
                            type: 'string',
                            example: '000-01',
                            description: 'Product code'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                }
            }
        }
    },
    apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

