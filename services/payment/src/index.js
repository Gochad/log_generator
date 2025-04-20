const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Logify = require('logify');

const app = express();
const port = process.env.PORT || 3004;

// Inicjalizacja Logify
const logify = new Logify({
  serviceName: 'payment-service',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  indexPrefix: 'logify-payment',
  logLevel: 'info'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(logify.requestLogger());
app.use(logify.responseLogger());
app.use(logify.errorLogger());

// Przykładowa baza danych płatności
const payments = [];

// Statystyki API
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0
};

// Endpoint do pobierania statystyk API
app.get('/api/stats', (req, res) => {
  logify.info('Pobieranie statystyk API', { stats: apiStats });
  res.json(apiStats);
});

// Endpoint do tworzenia nowej płatności
app.post('/api/payments', (req, res) => {
  const startTime = Date.now();
  const { orderId, amount, currency, paymentMethod } = req.body;

  if (!orderId || !amount || !currency || !paymentMethod) {
    logify.warn('Nieprawidłowe dane płatności', { body: req.body });
    apiStats.failedRequests++;
    return res.status(400).json({ error: 'Brak wymaganych pól' });
  }

  const payment = {
    id: uuidv4(),
    orderId,
    amount,
    currency,
    paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString(),
    processedAt: null
  };

  payments.push(payment);
  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Utworzono nową płatność', { payment });
  res.status(201).json(payment);
});

// Endpoint do pobierania płatności po ID
app.get('/api/payments/:id', (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  const payment = payments.find(p => p.id === id);
  if (!payment) {
    logify.warn('Nie znaleziono płatności', { id });
    apiStats.failedRequests++;
    return res.status(404).json({ error: 'Nie znaleziono płatności' });
  }

  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Pobrano płatność', { id });
  res.json(payment);
});

// Endpoint do pobierania płatności dla zamówienia
app.get('/api/payments/order/:orderId', (req, res) => {
  const startTime = Date.now();
  const { orderId } = req.params;

  const orderPayments = payments.filter(p => p.orderId === orderId);
  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Pobrano płatności zamówienia', { orderId, count: orderPayments.length });
  res.json(orderPayments);
});

// Endpoint do anulowania płatności
app.post('/api/payments/:id/cancel', (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  const payment = payments.find(p => p.id === id);
  if (!payment) {
    logify.warn('Nie znaleziono płatności do anulowania', { id });
    apiStats.failedRequests++;
    return res.status(404).json({ error: 'Nie znaleziono płatności' });
  }

  if (payment.status === 'completed') {
    logify.warn('Nie można anulować zakończonej płatności', { id });
    apiStats.failedRequests++;
    return res.status(400).json({ error: 'Nie można anulować zakończonej płatności' });
  }

  payment.status = 'cancelled';
  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Anulowano płatność', { id });
  res.json(payment);
});

// Symulacja przetwarzania płatności
setInterval(() => {
  const pendingPayments = payments.filter(p => p.status === 'pending');
  pendingPayments.forEach(payment => {
    // Symulacja opóźnienia przetwarzania
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% szans na sukces
      payment.status = success ? 'completed' : 'failed';
      payment.processedAt = new Date().toISOString();
      
      logify.info('Zakończono przetwarzanie płatności', { 
        id: payment.id, 
        status: payment.status,
        success 
      });
    }, Math.random() * 5000); // Losowe opóźnienie 0-5 sekund
  });
}, 10000); // Sprawdzaj co 10 sekund

app.listen(port, () => {
  logify.info(`Serwis płatności uruchomiony na porcie ${port}`);
}); 