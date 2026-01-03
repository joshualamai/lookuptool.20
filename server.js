const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param } = require('express-validator');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'products.db');

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // stricter limit for write operations
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public_html'));
app.use('/api/', limiter); // Apply rate limiting to all API routes

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { ip: req.ip });
    next();
});

// Validation middleware
const validateProduct = [
    body('id').trim().matches(/^\d{3}-\d{2}$/).withMessage('ID must be in format XXX-XX'),
    body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category is required and must be less than 100 characters'),
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required and must be less than 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
    body('code').trim().isLength({ min: 1, max: 50 }).withMessage('Code is required and must be less than 50 characters')
];

const validateId = [
    param('id').matches(/^\d{3}-\d{2}$/).withMessage('Invalid ID format')
];

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        logger.error('Error opening database:', err.message);
    } else {
        logger.info('Connected to SQLite database', { path: DB_PATH });
    }
});

// API Routes

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with optional filtering and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, or code
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, category, quantity, unit_price, code]
 *         description: Sort column
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
app.get('/api/products', (req, res) => {
    const { category, search, minPrice, maxPrice, sortBy = 'id', order = 'ASC', page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];
    
    if (category) {
        query += ' AND category LIKE ?';
        countQuery += ' AND category LIKE ?';
        params.push(`%${category}%`);
    }
    
    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR code LIKE ?)';
        countQuery += ' AND (name LIKE ? OR description LIKE ? OR code LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (minPrice) {
        query += ' AND unit_price >= ?';
        countQuery += ' AND unit_price >= ?';
        params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
        query += ' AND unit_price <= ?';
        countQuery += ' AND unit_price <= ?';
        params.push(parseFloat(maxPrice));
    }
    
    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['id', 'name', 'category', 'quantity', 'unit_price', 'code'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'id';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
    
    // Get total count
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            logger.error('Error counting products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        // Get products
        db.all(query, [...params, limitNum, offset], (err, rows) => {
            if (err) {
                logger.error('Error fetching products:', err);
                return res.status(500).json({ error: 'Failed to fetch products' });
            }
            
            res.json({
                products: rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: total,
                    totalPages: totalPages
                }
            });
        });
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
app.get('/api/products/:id', validateId, handleValidationErrors, (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            logger.error('Error fetching product:', err);
            return res.status(500).json({ error: 'Failed to fetch product' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(row);
    });
});

// GET products by category
app.get('/api/products/category/:category', (req, res) => {
    const { category } = req.params;
    
    db.all('SELECT * FROM products WHERE category LIKE ? ORDER BY name', [`%${category}%`], (err, rows) => {
        if (err) {
            logger.error('Error fetching products by category:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(rows);
    });
});

// GET all unique categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT DISTINCT category FROM products ORDER BY category', [], (err, rows) => {
        if (err) {
            logger.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.json(rows.map(row => row.category));
    });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
app.post('/api/products', strictLimiter, validateProduct, handleValidationErrors, (req, res) => {
    const { id, category, name, description, quantity, unit_price, code } = req.body;
    
    if (!id || !category || !name || !description || quantity === undefined || !unit_price || !code) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    db.run(
        'INSERT INTO products (id, category, name, description, quantity, unit_price, code) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, category, name, description, quantity, parseFloat(unit_price), code],
        function(err) {
            if (err) {
                logger.error('Error creating product:', err);
                return res.status(500).json({ error: 'Failed to create product' });
            }
            logger.info('Product created', { id });
            res.status(201).json({ id, message: 'Product created successfully' });
        }
    );
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
app.put('/api/products/:id', strictLimiter, validateId, validateProduct, handleValidationErrors, (req, res) => {
    const { id } = req.params;
    const { category, name, description, quantity, unit_price, code } = req.body;
    
    db.run(
        'UPDATE products SET category = ?, name = ?, description = ?, quantity = ?, unit_price = ?, code = ? WHERE id = ?',
        [category, name, description, quantity, parseFloat(unit_price), code, id],
        function(err) {
            if (err) {
                logger.error('Error updating product:', err);
                return res.status(500).json({ error: 'Failed to update product' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            logger.info('Product updated', { id });
            res.json({ id, message: 'Product updated successfully' });
        }
    );
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
app.delete('/api/products/:id', strictLimiter, validateId, handleValidationErrors, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) {
            logger.error('Error deleting product:', err);
            return res.status(500).json({ error: 'Failed to delete product' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        logger.info('Product deleted', { id });
        res.json({ message: 'Product deleted successfully' });
    });
});

// Statistics endpoint
app.get('/api/statistics', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM products',
        'SELECT SUM(quantity) as totalQuantity FROM products',
        'SELECT AVG(unit_price) as avgPrice FROM products',
        'SELECT MIN(unit_price) as minPrice FROM products',
        'SELECT MAX(unit_price) as maxPrice FROM products',
        'SELECT COUNT(DISTINCT category) as categoryCount FROM products'
    ];

    Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    })).then(results => {
        // Get category breakdown
        db.all('SELECT category, COUNT(*) as count, SUM(quantity) as totalQuantity FROM products GROUP BY category', [], (err, categoryBreakdown) => {
            if (err) {
                logger.error('Error fetching category breakdown:', err);
                return res.status(500).json({ error: 'Failed to fetch statistics' });
            }

            res.json({
                totalProducts: results[0].total,
                totalQuantity: results[1].totalQuantity || 0,
                averagePrice: parseFloat(results[2].avgPrice || 0).toFixed(2),
                minPrice: parseFloat(results[3].minPrice || 0).toFixed(2),
                maxPrice: parseFloat(results[4].maxPrice || 0).toFixed(2),
                categoryCount: results[5].categoryCount,
                categoryBreakdown: categoryBreakdown,
                timestamp: new Date().toISOString()
            });
        });
    }).catch(err => {
        logger.error('Error fetching statistics:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    });
});

// Export products to CSV
app.get('/api/products/export/csv', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id', [], (err, rows) => {
        if (err) {
            logger.error('Error exporting products:', err);
            return res.status(500).json({ error: 'Failed to export products' });
        }

        // Convert to CSV
        const headers = ['ID', 'Category', 'Name', 'Description', 'Quantity', 'Unit Price', 'Code'];
        const csvRows = [headers.join(',')];

        rows.forEach(row => {
            const values = [
                row.id,
                `"${row.category}"`,
                `"${row.name}"`,
                `"${(row.description || '').replace(/"/g, '""')}"`,
                row.quantity,
                row.unit_price,
                row.code
            ];
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
        res.send(csv);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            logger.error('Error closing database:', err);
        } else {
            logger.info('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = app;
