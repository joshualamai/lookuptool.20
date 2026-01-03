# 🔍 LookupProtocol

A modern, full-stack product lookup system with REST API, database integration, and a beautiful responsive UI. Built with Node.js, Express.js, SQLite, and vanilla JavaScript.

## ✨ Features

### Core Features
- **RESTful API** - Complete CRUD operations for products with validation
- **Database Integration** - SQLite database with proper schema, indexes, and migrations
- **Advanced Search** - Search by ID, name, description, or code with real-time filtering
- **Filtering & Sorting** - Filter by category, price range, and sort by various fields
- **Modern UI/UX** - Responsive design with smooth animations and loading states
- **Error Handling** - Comprehensive error handling and user feedback
- **Performance Optimized** - Database indexes for fast queries

### Advanced Features
- **Admin Panel** - Full product management interface (Create, Read, Update, Delete)
- **Statistics Dashboard** - Real-time analytics and category breakdowns
- **Input Validation** - Server-side validation using express-validator
- **Rate Limiting** - API protection against abuse (100 req/15min for reads, 20 req/15min for writes)
- **Security** - SQL injection prevention, input sanitization, CORS configuration
- **Docker Support** - Containerized deployment with Docker and Docker Compose
- **API Documentation** - Interactive Swagger/OpenAPI documentation at `/api-docs`
- **Logging System** - Winston-based logging with file and console outputs
- **Pagination** - Efficient pagination for large product datasets
- **CSV Export** - Export products to CSV format
- **Search History** - LocalStorage-based search history
- **Unit Tests** - Jest-based test suite with coverage reports
- **CI/CD Pipeline** - GitHub Actions workflow for automated testing

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd LookupProtocol
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run init-db
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

7. Access API documentation at:
```
http://localhost:3000/api-docs
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Or build and run manually:
```bash
docker build -t lookupprotocol .
docker run -p 3000:3000 lookupprotocol
```

The Docker setup automatically initializes and seeds the database on first run.

## 📁 Project Structure

```
LookupProtocol/
├── server.js              # Express server and API routes
├── database/               # SQLite database files
│   └── products.db        # Database file (created after init)
├── scripts/
│   ├── init-db.js         # Database initialization script
│   └── seed-db.js         # Database seeding script
├── public_html/           # Frontend files
│   ├── index.html         # Main search application
│   ├── admin.html         # Admin panel for product management
│   ├── dashboard.html     # Statistics and analytics dashboard
│   ├── home.html          # About page
│   ├── app.js             # Frontend JavaScript
│   └── css.css            # Modern styling
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker Compose configuration
├── .gitignore            # Git ignore rules
└── package.json          # Dependencies and scripts
```

## 🔌 API Endpoints

### Products

- `GET /api/products` - Get all products (supports query parameters)
  - Query params: `category`, `search`, `minPrice`, `maxPrice`, `sortBy`, `order`
- `GET /api/products/:id` - Get a single product by ID
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Categories

- `GET /api/categories` - Get all unique categories

### Statistics

- `GET /api/statistics` - Get comprehensive product statistics
  - Returns: total products, total quantity, average/min/max price, category breakdown

### Export

- `GET /api/products/export/csv` - Export all products to CSV format

### Health Check

- `GET /api/health` - Server health status

### API Documentation

- `GET /api-docs` - Interactive Swagger API documentation

## 📝 Example API Usage

### Get all products
```bash
curl http://localhost:3000/api/products
```

### Search products
```bash
curl http://localhost:3000/api/products?search=shoes
```

### Filter by category and price
```bash
curl http://localhost:3000/api/products?category=clothing&minPrice=50&maxPrice=100
```

### Get product by ID
```bash
curl http://localhost:3000/api/products/000-01
```

### Create a new product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "000-11",
    "category": "clothing",
    "name": "New Product",
    "description": "Product description",
    "quantity": 100,
    "unit_price": 50.00,
    "code": "000-11"
  }'
```

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Security**: express-validator, express-rate-limit
- **Documentation**: Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **Deployment**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Build Tools**: npm scripts

## 🎨 UI Features

- **Responsive Design** - Mobile-first approach, works on all devices
- **Modern Gradient Background** - Eye-catching purple gradient theme
- **Smooth Animations** - CSS transitions and hover effects
- **Loading States** - Spinner indicators for async operations
- **Error Handling** - User-friendly error messages
- **Product Cards** - Beautiful card-based product display with hover effects
- **Advanced Filtering** - Real-time search and filter interface
- **Admin Panel** - Full CRUD interface for product management
- **Statistics Dashboard** - Visual analytics and category breakdowns
- **Dark Mode Ready** - CSS variables for easy theme switching

## 🔒 Security Features

- **Input Validation** - Server-side validation using express-validator
- **SQL Injection Prevention** - Parameterized queries throughout
- **Rate Limiting** - Protection against API abuse (100 req/15min standard, 20 req/15min for writes)
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Error Handling** - Secure error messages without exposing sensitive information
- **Input Sanitization** - All user inputs are validated and sanitized

## 🎯 Pages & Features

- **Search Page** (`/index.html`) - Main product search interface with filtering
- **Admin Panel** (`/admin.html`) - Full product management (Create, Update, Delete)
- **Dashboard** (`/dashboard.html`) - Statistics and analytics visualization
- **About Page** (`/home.html`) - Project information

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

View test coverage:
```bash
npm test -- --coverage
```

## 📈 Future Enhancements

- [x] Database integration (SQLite)
- [x] RESTful API with CRUD operations
- [x] Modern responsive UI/UX
- [x] Admin panel for product management
- [x] Statistics dashboard
- [x] Input validation and security
- [x] Rate limiting
- [x] Docker support
- [x] API documentation with Swagger/OpenAPI
- [x] Unit and integration tests
- [x] Export data to CSV
- [x] Logging system
- [x] Pagination
- [x] Search history
- [x] CI/CD pipeline
- [ ] User authentication and authorization
- [ ] Product images support
- [ ] Shopping cart functionality
- [ ] Product reviews and ratings
- [ ] Export to PDF
- [ ] PostgreSQL migration option
- [ ] Redis caching layer
- [ ] WebSocket support for real-time updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**joshu**

---

Built with ❤️ using modern web technologies

#   l o o k u p t o o l . 2 0  
 