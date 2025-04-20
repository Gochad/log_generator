# Logify

Wspólna biblioteka do logowania dla mikroserwisów Logify.

## Instalacja

```bash
npm install logify
```

## Użycie

```javascript
const Logify = require('logify');
const express = require('express');
const app = express();

// Inicjalizacja loggera
const logify = new Logify({
  serviceName: 'user-service',
  elasticsearchUrl: 'http://localhost:9200',
  indexPrefix: 'logify',
  logLevel: 'info'
});

// Middleware do logowania
app.use(logify.requestLogger());
app.use(logify.responseLogger());
app.use(logify.errorHandler());

// Przykład użycia w routach
app.get('/api/users', (req, res) => {
  logify.info('Fetching all users', { requestId: req.requestId });
  
  // Logika biznesowa...
  
  res.json(users);
});

// Endpoint do pobierania statystyk API
app.get('/api/stats', (req, res) => {
  res.json(logify.getApiStats());
});

// Przykład logowania błędów
app.post('/api/users', (req, res) => {
  try {
    // Logika biznesowa...
  } catch (error) {
    logify.error('Failed to create user', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## API

### Konstruktor

```javascript
const logify = new Logify(options);
```

#### Opcje

- `serviceName` (string, wymagane) - Nazwa serwisu
- `elasticsearchUrl` (string, opcjonalne) - URL do Elasticsearch (domyślnie: http://localhost:9200)
- `indexPrefix` (string, opcjonalne) - Prefiks indeksu w Elasticsearch (domyślnie: logify)
- `logLevel` (string, opcjonalne) - Poziom logowania (domyślnie: info)

### Metody

#### Middleware

- `requestLogger()` - Middleware do logowania przychodzących requestów
- `responseLogger()` - Middleware do logowania wychodzących odpowiedzi
- `errorHandler()` - Middleware do obsługi błędów

#### Logowanie

- `info(message, meta)` - Loguje informację
- `warn(message, meta)` - Loguje ostrzeżenie
- `error(message, meta)` - Loguje błąd
- `debug(message, meta)` - Loguje debug

#### Statystyki

- `getApiStats()` - Zwraca statystyki API 