// API Base URL
const API_BASE = '/api';

// State management
let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let totalPages = 1;
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadAllProducts();
    displaySearchHistory();
    
    // Add enter key support for search
    document.getElementById('mySearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProduct();
        }
    });
});

// Load all categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) throw new Error('Failed to load categories');
        
        categories = await response.json();
        const categoryFilter = document.getElementById('categoryFilter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load all products with pagination
async function loadAllProducts(page = 1) {
    showLoading(true);
    hideError();
    currentPage = page;
    
    try {
        const response = await fetch(`${API_BASE}/products?page=${page}&limit=12`);
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        allProducts = data.products || data; // Handle both paginated and non-paginated responses
        filteredProducts = allProducts;
        totalPages = data.pagination?.totalPages || 1;
        
        if (Array.isArray(data)) {
            displayProducts(data);
        } else {
            displayProducts(data.products);
            displayPagination(data.pagination);
        }
    } catch (error) {
        showError('Failed to load products. Make sure the server is running.');
        console.error('Error loading products:', error);
    } finally {
        showLoading(false);
    }
}

// Search for a specific product
async function searchProduct() {
    const searchInput = document.getElementById('mySearch');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }
    
    // Add to search history
    addToSearchHistory(searchTerm);
    
    showLoading(true);
    hideError();
    hideProductDetails();
    
    try {
        // Try to search by exact ID first
        if (searchTerm.match(/^\d{3}-\d{2}$/)) {
            const response = await fetch(`${API_BASE}/products/${searchTerm}`);
            if (response.ok) {
                const product = await response.json();
                displayProductDetails(product);
                showLoading(false);
                return;
            }
        }
        
        // Otherwise do a general search
        const response = await fetch(`${API_BASE}/products?search=${encodeURIComponent(searchTerm)}&page=1&limit=12`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        const products = data.products || data;
        
        if (products.length === 0) {
            showError(`No products found matching "${searchTerm}"`);
            document.getElementById('productResults').innerHTML = '';
        } else if (products.length === 1) {
            displayProductDetails(products[0]);
        } else {
            displayProducts(products);
            if (data.pagination) {
                displayPagination(data.pagination);
            }
        }
    } catch (error) {
        showError('Search failed. Please try again.');
        console.error('Search error:', error);
    } finally {
        showLoading(false);
    }
}

// Apply filters
async function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let url = `${API_BASE}/products?page=1&limit=12&`;
    const params = [];
    
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (minPrice) params.push(`minPrice=${minPrice}`);
    if (maxPrice) params.push(`maxPrice=${maxPrice}`);
    params.push(`sortBy=${sortBy}`);
    
    url += params.join('&');
    
    showLoading(true);
    hideError();
    hideProductDetails();
    currentPage = 1;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Filter failed');
        
        const data = await response.json();
        const products = data.products || data;
        filteredProducts = products;
        displayProducts(products);
        
        if (data.pagination) {
            displayPagination(data.pagination);
        }
    } catch (error) {
        showError('Failed to apply filters');
        console.error('Filter error:', error);
    } finally {
        showLoading(false);
    }
}

// Display products in a grid
function displayProducts(products) {
    const resultsDiv = document.getElementById('productResults');
    
    if (products.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">No products found</p>';
        return;
    }
    
    resultsDiv.innerHTML = `
        <div class="products-grid">
            ${products.map(product => `
                <div class="product-card-small" onclick="displayProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    <div class="product-header">
                        <h3>${escapeHtml(product.name)}</h3>
                        <span class="product-code">${escapeHtml(product.code)}</span>
                    </div>
                    <div class="product-body">
                        <p class="product-category">${escapeHtml(product.category)}</p>
                        <p class="product-description">${truncateText(escapeHtml(product.description), 100)}</p>
                        <div class="product-footer">
                            <span class="price">€${product.unit_price.toFixed(2)}</span>
                            <span class="quantity-badge ${product.quantity < 50 ? 'low-stock' : ''}">
                                ${product.quantity} in stock
                            </span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display pagination controls
function displayPagination(pagination) {
    const resultsDiv = document.getElementById('productResults');
    const paginationHtml = `
        <div class="pagination">
            <button class="btn-secondary" onclick="loadAllProducts(${pagination.page - 1})" 
                    ${pagination.page === 1 ? 'disabled' : ''}>
                Previous
            </button>
            <span class="pagination-info">
                Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)
            </span>
            <button class="btn-secondary" onclick="loadAllProducts(${pagination.page + 1})" 
                    ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>
                Next
            </button>
        </div>
    `;
    
    resultsDiv.insertAdjacentHTML('beforeend', paginationHtml);
}

// Display single product details
function displayProductDetails(product) {
    document.getElementById('prd-name').textContent = product.name;
    document.getElementById('prd-category').textContent = product.category;
    document.getElementById('prd-code').textContent = product.code;
    document.getElementById('prd-desc').textContent = product.description;
    document.getElementById('prd-qty').textContent = product.quantity;
    document.getElementById('prd-qty').className = `quantity-badge ${product.quantity < 50 ? 'low-stock' : ''}`;
    document.getElementById('prd-price').textContent = `€${product.unit_price.toFixed(2)}`;
    
    document.getElementById('productDetails').style.display = 'block';
    document.getElementById('productResults').innerHTML = '';
    
    // Scroll to details
    document.getElementById('productDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Close product details
function closeProductDetails() {
    document.getElementById('productDetails').style.display = 'none';
}

// Show all products
function showAllProducts() {
    document.getElementById('mySearch').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortBy').value = 'name';
    loadAllProducts(1);
}

// Search history functions
function addToSearchHistory(term) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== term);
    // Add to beginning
    searchHistory.unshift(term);
    // Keep only last 10
    searchHistory = searchHistory.slice(0, 10);
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    displaySearchHistory();
}

function displaySearchHistory() {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;
    
    if (searchHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No search history</p>';
        return;
    }
    
    historyContainer.innerHTML = `
        <div class="search-history">
            <h4>Recent Searches</h4>
            ${searchHistory.map(term => `
                <button class="history-item" onclick="useSearchHistory('${escapeHtml(term)}')">
                    ${escapeHtml(term)}
                </button>
            `).join('')}
            <button class="clear-history" onclick="clearSearchHistory()">Clear History</button>
        </div>
    `;
}

function useSearchHistory(term) {
    document.getElementById('mySearch').value = term;
    searchProduct();
}

function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem('searchHistory');
    displaySearchHistory();
}

// Export to CSV
async function exportToCSV() {
    try {
        const response = await fetch(`${API_BASE}/products/export/csv`);
        if (!response.ok) throw new Error('Export failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess('Products exported successfully!');
    } catch (error) {
        showError('Failed to export products');
        console.error('Export error:', error);
    }
}

// Utility functions
function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.querySelector('.btn-text').style.display = show ? 'none' : 'inline';
        btn.querySelector('.btn-loader').style.display = show ? 'inline' : 'none';
        btn.disabled = show;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 15px 20px; background: #10b981; color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function hideProductDetails() {
    document.getElementById('productDetails').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
