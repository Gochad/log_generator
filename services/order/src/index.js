const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Logify = require('../../../lib/logify');

const app = express();
const port = process.env.PORT || 3003;

// Inicjalizacja loggera
const logify = new Logify({
  serviceName: 'order-service',
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

const orders = [];

app.get('/api/stats', (req, res) => {
  logify.info('Fetching API stats', { requestId: req.requestId });
  res.json(logify.getApiStats());
});

app.post('/api/orders', (req, res) => {
  const { userId, products, totalAmount } = req.body;
  
  logify.info('Creating new order', {
    requestId: req.requestId,
    userId,
    products,
    totalAmount
  });
  
  if (Math.random() < 0.1) {
    logify.error('Failed to create order', {
      requestId: req.requestId,
      error: 'Invalid order data'
    });
    return res.status(400).json({ error: 'Invalid order data' });
  }
  
  const newOrder = {
    id: uuidv4(),
    userId,
    products,
    totalAmount,
    status: 'pending',
    createdAt: new Date()
  };
  
  orders.push(newOrder);
  
  setTimeout(() => {
    logify.info('Order created successfully', {
      requestId: req.requestId,
      orderId: newOrder.id
    });
  }, Math.random() * 1000);
  
  res.status(201).json(newOrder);
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  logify.info('Fetching order', {
    requestId: req.requestId,
    orderId: id
  });
  
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    logify.warn('Order not found', {
      requestId: req.requestId,
      orderId: id
    });
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

app.get('/api/orders/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  logify.info('Fetching user orders', {
    requestId: req.requestId,
    userId
  });
  
  const userOrders = orders.filter(o => o.userId === userId);
  
  res.json(userOrders);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  logify.info('Updating order status', {
    requestId: req.requestId,
    orderId: id,
    status
  });
  
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    logify.warn('Order not found', {
      requestId: req.requestId,
      orderId: id
    });
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = status;
  
  logify.info('Order status updated successfully', {
    requestId: req.requestId,
    orderId: id,
    newStatus: status
  });
  
  res.json(order);
});

app.listen(port, () => {
  logify.info(`Order service listening on port ${port}`);
}); 