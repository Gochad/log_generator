const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Logify = require('logify');

const app = express();
const port = process.env.PORT || 3005;

// Inicjalizacja Logify
const logify = new Logify({
  serviceName: 'notification-service',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  indexPrefix: 'logify-notification',
  logLevel: 'info'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(logify.requestLogger());
app.use(logify.responseLogger());
app.use(logify.errorLogger());

// Przykładowa baza danych powiadomień
const notifications = [];

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

// Endpoint do tworzenia nowego powiadomienia
app.post('/api/notifications', (req, res) => {
  const startTime = Date.now();
  const { userId, type, message, priority = 'normal' } = req.body;

  if (!userId || !type || !message) {
    logify.warn('Nieprawidłowe dane powiadomienia', { body: req.body });
    apiStats.failedRequests++;
    return res.status(400).json({ error: 'Brak wymaganych pól' });
  }

  const notification = {
    id: uuidv4(),
    userId,
    type,
    message,
    priority,
    status: 'pending',
    createdAt: new Date().toISOString(),
    sentAt: null
  };

  notifications.push(notification);
  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Utworzono nowe powiadomienie', { notification });
  res.status(201).json(notification);
});

// Endpoint do pobierania powiadomień użytkownika
app.get('/api/notifications/user/:userId', (req, res) => {
  const startTime = Date.now();
  const { userId } = req.params;
  const { status, type, priority } = req.query;

  let userNotifications = notifications.filter(n => n.userId === userId);

  if (status) {
    userNotifications = userNotifications.filter(n => n.status === status);
  }
  if (type) {
    userNotifications = userNotifications.filter(n => n.type === type);
  }
  if (priority) {
    userNotifications = userNotifications.filter(n => n.priority === priority);
  }

  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Pobrano powiadomienia użytkownika', { userId, count: userNotifications.length });
  res.json(userNotifications);
});

// Endpoint do aktualizacji statusu powiadomienia
app.patch('/api/notifications/:id/status', (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'sent', 'failed'].includes(status)) {
    logify.warn('Nieprawidłowy status powiadomienia', { id, status });
    apiStats.failedRequests++;
    return res.status(400).json({ error: 'Nieprawidłowy status' });
  }

  const notification = notifications.find(n => n.id === id);
  if (!notification) {
    logify.warn('Nie znaleziono powiadomienia', { id });
    apiStats.failedRequests++;
    return res.status(404).json({ error: 'Nie znaleziono powiadomienia' });
  }

  notification.status = status;
  if (status === 'sent') {
    notification.sentAt = new Date().toISOString();
  }

  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Zaktualizowano status powiadomienia', { id, status });
  res.json(notification);
});

// Endpoint do usuwania powiadomienia
app.delete('/api/notifications/:id', (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) {
    logify.warn('Nie znaleziono powiadomienia do usunięcia', { id });
    apiStats.failedRequests++;
    return res.status(404).json({ error: 'Nie znaleziono powiadomienia' });
  }

  notifications.splice(index, 1);
  apiStats.successfulRequests++;
  apiStats.totalRequests++;
  apiStats.averageResponseTime = (apiStats.averageResponseTime * (apiStats.totalRequests - 1) + (Date.now() - startTime)) / apiStats.totalRequests;

  logify.info('Usunięto powiadomienie', { id });
  res.status(204).send();
});

// Symulacja wysyłania powiadomień
setInterval(() => {
  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  pendingNotifications.forEach(notification => {
    // Symulacja opóźnienia wysyłania
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% szans na sukces
      notification.status = success ? 'sent' : 'failed';
      if (success) {
        notification.sentAt = new Date().toISOString();
      }
      logify.info('Zakończono próbę wysłania powiadomienia', { 
        id: notification.id, 
        status: notification.status,
        success 
      });
    }, Math.random() * 5000); // Losowe opóźnienie 0-5 sekund
  });
}, 10000); // Sprawdzaj co 10 sekund

app.listen(port, () => {
  logify.info(`Serwis powiadomień uruchomiony na porcie ${port}`);
}); 