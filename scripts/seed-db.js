const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database', 'products.db');

if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found! Please run "npm run init-db" first.');
    process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to database');
    }
});

// Sample products data (from the original XML)
const products = [
    {
        id: '000-01',
        category: 'clothing',
        name: 'bohoo clothes',
        description: "It's time to be the MAN! Discover boohooMAN's logo collection and fill up your wardrobe with these exclusive MAN branded items. Discover the MAN logo hoodies, the t-shirts, the tracksuits, the accessories (and much, much more) and add some attitude to your casual outfit.",
        quantity: 300,
        unit_price: 30.00,
        code: '000-01'
    },
    {
        id: '000-02',
        category: 'footwear',
        name: 'shoes',
        description: "Step into the party season in style with our exclusive selection of men's smart shoes. From the classic real leather cap brogues to the trendy heavy soled tassel loafers, whether it's a special event or a day in the office, this collection will impeccably complement any smart outfit and make you look dapper.",
        quantity: 115,
        unit_price: 118.00,
        code: '000-02'
    },
    {
        id: '000-03',
        category: 'Accessories',
        name: 'rings',
        description: "finish off your outfit with a cool piece of men's jewellery from boohooMAN's collection of jewellery and watches for men. Choose from loads of uber-trendy accessories including men's rings",
        quantity: 218,
        unit_price: 74.00,
        code: '000-03'
    },
    {
        id: '000-04',
        category: 'clothing',
        name: 'shirts',
        description: "Level up your shirt game with our extensive range of shirts in long and short sleeve styles! Whether you're looking for a classic Oxford shirt, or a check shirt, a cool but casual print or a go-to denim, we've got all the staples a man's wardrobe needs",
        quantity: 164,
        unit_price: 69.00,
        code: '000-04'
    },
    {
        id: '000-05',
        category: 'clothing',
        name: 'jackets',
        description: "A good coat is the backbone of any man's wardrobe, and with a huge range of men's puffers, macs, bombers, parkas, and more, we're here to ensure your outerwear is on-point through rain, hail, sleet, or shine.",
        quantity: 97,
        unit_price: 198.00,
        code: '000-05'
    },
    {
        id: '000-06',
        category: 'Clothing',
        name: 'Trousers',
        description: 'neeed some trousers for every season go to boohoomans website and get one.',
        quantity: 59,
        unit_price: 98.00,
        code: '000-06'
    },
    {
        id: '000-07',
        category: 'Clothing',
        name: 'boohoo Hoodie',
        description: "THoodie or sweatshirt? No need to choose: our selection of men's tops includes a variety of hoodies and sweatshirts available in different colours, styles and fits. Both hoodies and sweatshirts are must-haves in every man's casual wardrobe, and very versatile pieces of clothing.",
        quantity: 100,
        unit_price: 60.00,
        code: '000-07'
    },
    {
        id: '000-08',
        category: 'Casual wear',
        name: 'sunglasses',
        description: "Choosing the right pair of men's sunglasses is a must and it needs to be done right. boohooMAN have trendy but affordable sunglasses for men that are only a click away!.",
        quantity: 100,
        unit_price: 45.00,
        code: '000-08'
    },
    {
        id: '000-09',
        category: 'Casual wear',
        name: 'belts',
        description: "Get some serious style skills under your belt with boohooMAN's range of men's belts! Whether you want to complement your everyday look or add the finishing touch to your smart outfit, our selection of real and faux leather belts is just all you need to wear.",
        quantity: 173,
        unit_price: 60.00,
        code: '000-09'
    },
    {
        id: '000-10',
        category: 'Bags',
        name: 'casual wear',
        description: "Too much stuff to carry around? Worry no more...boohooMAN's new range of men's bags and men's wallets is here to give your hands a break! Check out our extensive selection of MAN embroidered men's bags, cross body bags, holdalls and much, much more.",
        quantity: 138,
        unit_price: 40.00,
        code: '000-10'
    }
];

db.serialize(() => {
    const stmt = db.prepare(`
        INSERT INTO products (id, category, name, description, quantity, unit_price, code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    products.forEach((product) => {
        stmt.run(
            product.id,
            product.category,
            product.name,
            product.description,
            product.quantity,
            product.unit_price,
            product.code,
            (err) => {
                if (err) {
                    console.error(`Error inserting product ${product.id}:`, err.message);
                } else {
                    inserted++;
                }
            }
        );
    });

    stmt.finalize((err) => {
        if (err) {
            console.error('Error finalizing statement:', err.message);
        } else {
            console.log(`Successfully seeded ${inserted} products into database`);
        }
        
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                process.exit(1);
            } else {
                console.log('Database seeding complete!');
            }
        });
    });
});

