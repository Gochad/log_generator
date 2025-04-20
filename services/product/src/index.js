const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Logify = require('../../../lib/logify');

const app = express();
const port = process.env.PORT || 3002;

// Inicjalizacja loggera
const logify = new Logify({
  serviceName: 'product-service',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  indexPrefix: 'logify',
  logLevel: 'info'
});

app.use(cors());
app.use(express.json());

// Middleware do logowania
app.use(logify.requestLogger());
app.use(logify.responseLogger());
app.use(logify.errorHandler());

const products = [
  { id: '1', name: 'Laptop', price: 999.99, stock: 10, category: 'Electronics', rating: 4.5 },
  { id: '2', name: 'Smartphone', price: 499.99, stock: 20, category: 'Electronics', rating: 4.2 },
  { id: '3', name: 'Tablet', price: 299.99, stock: 15, category: 'Electronics', rating: 4.0 },
  { id: '4', name: 'Headphones', price: 99.99, stock: 30, category: 'Audio', rating: 4.7 },
  { id: '5', name: 'Smartwatch', price: 199.99, stock: 12, category: 'Wearables', rating: 4.1 }
];

app.get('/api/stats', (req, res) => {
  logify.info('Fetching API stats', { requestId: req.requestId });
  res.json(logify.getApiStats());
});

app.get('/api/products', (req, res) => {
  logify.info('Fetching all products', { requestId: req.requestId });
  
  if (Math.random() < 0.05) {
    logify.error('Failed to fetch products', {
      requestId: req.requestId,
      error: 'Database connection error',
      stack: new Error().stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  logify.info('Fetching product', {
    requestId: req.requestId,
    productId: id
  });
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    logify.warn('Product not found', {
      requestId: req.requestId,
      productId: id
    });
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

app.get('/api/products/search', (req, res) => {
  const { query, category, minPrice, maxPrice } = req.query;
  
  logify.info('Searching products', {
    requestId: req.requestId,
    query,
    category,
    minPrice,
    maxPrice
  });
  
  let results = [...products];
  
  if (query) {
    results = results.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  if (category) {
    results = results.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (minPrice) {
    results = results.filter(p => 
      p.price >= parseFloat(minPrice)
    );
  }
  
  if (maxPrice) {
    results = results.filter(p => 
      p.price <= parseFloat(maxPrice)
    );
  }
  
  logify.info('Search results', {
    requestId: req.requestId,
    resultCount: results.length
  });
  
  res.json(results);
});

app.post('/api/products', (req, res) => {
  const { name, price, stock, category } = req.body;
  
  logify.info('Creating new product', {
    requestId: req.requestId,
    name,
    price,
    stock,
    category
  });
  
  if (Math.random() < 0.1) {
    logify.error('Failed to create product', {
      requestId: req.requestId,
      error: 'Validation error',
      details: 'Price must be a positive number'
    });
    return res.status(400).json({ error: 'Invalid product data' });
  }
  
  const newProduct = {
    id: uuidv4(),
    name,
    price,
    stock,
    category: category || 'Uncategorized',
    rating: 0,
    createdAt: new Date()
  };
  
  products.push(newProduct);
  
  logify.info('Product created successfully', {
    requestId: req.requestId,
    productId: newProduct.id
  });
  
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  
  logify.info('Updating product', {
    requestId: req.requestId,
    productId: id,
    updates: { name, price, stock, category }
  });
  
  const productIndex = products.findIndex(p => p.id === id);
  
  if (productIndex === -1) {
    logify.warn('Product not found for update', {
      requestId: req.requestId,
      productId: id
    });
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const updatedProduct = {
    ...products[productIndex],
    name: name || products[productIndex].name,
    price: price || products[productIndex].price,
    stock: stock || products[productIndex].stock,
    category: category || products[productIndex].category,
    updatedAt: new Date()
  };
  
  products[productIndex] = updatedProduct;
  
  logify.info('Product updated successfully', {
    requestId: req.requestId,
    productId: id
  });
  
  res.json(updatedProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  logify.info('Deleting product', {
    requestId: req.requestId,
    productId: id
  });
  
  const productIndex = products.findIndex(p => p.id === id);
  
  if (productIndex === -1) {
    logify.warn('Product not found for deletion', {
      requestId: req.requestId,
      productId: id
    });
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const deletedProduct = products.splice(productIndex, 1)[0];
  
  logify.info('Product deleted successfully', {
    requestId: req.requestId,
    productId: id
  });
  
  res.json(deletedProduct);
});

app.patch('/api/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  logify.info('Updating product stock', {
    requestId: req.requestId,
    productId: id,
    quantity
  });
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    logify.warn('Product not found for stock update', {
      requestId: req.requestId,
      productId: id
    });
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const newStock = product.stock + quantity;
  
  if (newStock < 0) {
    logify.error('Invalid stock update', {
      requestId: req.requestId,
      productId: id,
      currentStock: product.stock,
      requestedChange: quantity
    });
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  
  product.stock = newStock;
  
  logify.info('Product stock updated successfully', {
    requestId: req.requestId,
    productId: id,
    newStock
  });
  
  res.json(product);
});

app.listen(port, () => {
  logify.info(`Product service listening on port ${port}`);
}); 