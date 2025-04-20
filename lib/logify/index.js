const winston = require('winston');
require('winston-elasticsearch');
const { v4: uuidv4 } = require('uuid');

/**
 * Klasa do zarządzania logowaniem w mikroserwisach
 */
class Logify {
  /**
   * Tworzy instancję Logify
   * @param {Object} options - Opcje konfiguracyjne
   * @param {string} options.serviceName - Nazwa serwisu
   * @param {string} [options.elasticsearchUrl] - URL do Elasticsearch (domyślnie: http://localhost:9200)
   * @param {string} [options.indexPrefix] - Prefiks indeksu w Elasticsearch (domyślnie: logify)
   * @param {string} [options.logLevel] - Poziom logowania (domyślnie: info)
   */
  constructor(options) {
    this.serviceName = options.serviceName;
    this.elasticsearchUrl = options.elasticsearchUrl || 'http://localhost:9200';
    this.indexPrefix = options.indexPrefix || 'logify';
    this.logLevel = options.logLevel || 'info';
    
    // Inicjalizacja loggera
    this.logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: this.serviceName },
      transports: [
        new winston.transports.Console(),
        new winston.transports.Elasticsearch({
          level: this.logLevel,
          clientOpts: { node: this.elasticsearchUrl },
          indexPrefix: this.indexPrefix
        })
      ]
    });
    
    // Statystyki API
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }
  
  /**
   * Tworzy middleware do logowania przychodzących requestów
   * @returns {Function} Middleware Express
   */
  requestLogger() {
    return (req, res, next) => {
      req._startTime = Date.now();
      const requestId = uuidv4();
      req.requestId = requestId;
      
      this.logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: req.headers,
        ip: req.ip
      });
      
      next();
    };
  }
  
  /**
   * Tworzy middleware do logowania wychodzących odpowiedzi
   * @returns {Function} Middleware Express
   */
  responseLogger() {
    return (req, res, next) => {
      const oldSend = res.send;
      res.send = (data) => {
        const responseTime = Date.now() - req._startTime;
        
        // Aktualizacja statystyk
        this.apiStats.totalRequests++;
        this.apiStats.averageResponseTime = (this.apiStats.averageResponseTime * (this.apiStats.totalRequests - 1) + responseTime) / this.apiStats.totalRequests;
        
        if (res.statusCode >= 400) {
          this.apiStats.failedRequests++;
        } else {
          this.apiStats.successfulRequests++;
        }
        
        this.logger.info('Outgoing response', {
          requestId: req.requestId,
          statusCode: res.statusCode,
          responseTime,
          path: req.path,
          method: req.method
        });
        
        return oldSend.apply(res, arguments);
      };
      next();
    };
  }
  
  /**
   * Tworzy middleware do obsługi błędów
   * @returns {Function} Middleware Express
   */
  errorHandler() {
    return (err, req, res, next) => {
      this.logger.error('Unhandled error', {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack
      });
      
      this.apiStats.failedRequests++;
      res.status(500).json({ error: 'Internal server error' });
    };
  }
  
  /**
   * Zwraca statystyki API
   * @returns {Object} Statystyki API
   */
  getApiStats() {
    return this.apiStats;
  }
  
  /**
   * Loguje informację
   * @param {string} message - Wiadomość do zalogowania
   * @param {Object} [meta] - Dodatkowe metadane
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }
  
  /**
   * Loguje ostrzeżenie
   * @param {string} message - Wiadomość do zalogowania
   * @param {Object} [meta] - Dodatkowe metadane
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }
  
  /**
   * Loguje błąd
   * @param {string} message - Wiadomość do zalogowania
   * @param {Object} [meta] - Dodatkowe metadane
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }
  
  /**
   * Loguje debug
   * @param {string} message - Wiadomość do zalogowania
   * @param {Object} [meta] - Dodatkowe metadane
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = Logify; 