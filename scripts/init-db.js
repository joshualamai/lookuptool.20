const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database', 'products.db');
const DB_DIR = path.dirname(DB_PATH);

// Create database directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Remove existing database if it exists (for fresh start)
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing database');
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    } else {
        console.log('Database created successfully');
    }
});

// Create products table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
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
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Products table created successfully');
        }
    });

    // Create indexes for better query performance
    db.run('CREATE INDEX IF NOT EXISTS idx_category ON products(category)', (err) => {
        if (err) {
            console.error('Error creating category index:', err.message);
        } else {
            console.log('Category index created');
        }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_name ON products(name)', (err) => {
        if (err) {
            console.error('Error creating name index:', err.message);
        } else {
            console.log('Name index created');
        }
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_code ON products(code)', (err) => {
        if (err) {
            console.error('Error creating code index:', err.message);
        } else {
            console.log('Code index created');
        }
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            process.exit(1);
        } else {
            console.log('Database initialization complete!');
            console.log('Run "npm run seed" to populate with sample data');
        }
    });
});

