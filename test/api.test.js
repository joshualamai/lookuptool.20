const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create a test database
const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test-products.db');
const DB_DIR = path.dirname(TEST_DB_PATH);

// Ensure test database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Remove test database if it exists
if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
}

// Initialize test database
const db = new sqlite3.Database(TEST_DB_PATH);
db.serialize(() => {
    db.run(`
        CREATE TABLE products (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            code TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Insert test data
    db.run(`
        INSERT INTO products (id, category, name, description, quantity, unit_price, code)
        VALUES ('000-01', 'clothing', 'Test Product', 'Test Description', 100, 50.00, '000-01')
    `);
});

db.close();

// Set test database path
process.env.DB_PATH = TEST_DB_PATH;

// Import server after setting env
const app = require('../server');

describe('API Endpoints', () => {
    beforeAll(() => {
        // Wait for database to be ready
        return new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(() => {
        // Clean up test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    });

    describe('GET /api/health', () => {
        test('should return health status', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('GET /api/products', () => {
        test('should return all products', async () => {
            const response = await request(app).get('/api/products');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should filter by category', async () => {
            const response = await request(app).get('/api/products?category=clothing');
            expect(response.status).toBe(200);
            if (response.body.length > 0) {
                expect(response.body[0].category.toLowerCase()).toContain('clothing');
            }
        });

        test('should search products', async () => {
            const response = await request(app).get('/api/products?search=Test');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/products/:id', () => {
        test('should return a product by ID', async () => {
            const response = await request(app).get('/api/products/000-01');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', '000-01');
        });

        test('should return 404 for non-existent product', async () => {
            const response = await request(app).get('/api/products/999-99');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/products', () => {
        test('should create a new product', async () => {
            const newProduct = {
                id: '000-99',
                category: 'test',
                name: 'New Test Product',
                description: 'Test Description',
                quantity: 50,
                unit_price: 25.00,
                code: '000-99'
            };

            const response = await request(app)
                .post('/api/products')
                .send(newProduct);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id', '000-99');
        });

        test('should reject invalid product data', async () => {
            const invalidProduct = {
                id: 'invalid',
                category: 'test'
            };

            const response = await request(app)
                .post('/api/products')
                .send(invalidProduct);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/categories', () => {
        test('should return all categories', async () => {
            const response = await request(app).get('/api/categories');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/statistics', () => {
        test('should return statistics', async () => {
            const response = await request(app).get('/api/statistics');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalProducts');
            expect(response.body).toHaveProperty('totalQuantity');
            expect(response.body).toHaveProperty('averagePrice');
        });
    });
});

