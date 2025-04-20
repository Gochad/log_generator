const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');

class MiddlewareCommon {
  constructor(options = {}) {
    this.options = {
      corsOptions: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        ...options.corsOptions
      },
      rateLimitOptions: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Zbyt wiele żądań z tego IP, spróbuj ponownie później',
        ...options.rateLimitOptions
      }
    };
  }

  getCors() {
    return cors(this.options.corsOptions);
  }

  getHelmet() {
    return helmet();
  }

  getCompression() {
    return compression();
  }

  getRateLimit() {
    return rateLimit(this.options.rateLimitOptions);
  }

  validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

  errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({
      error: 'Wystąpił błąd wewnętrzny serwera',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  notFoundHandler(req, res) {
    res.status(404).json({
      error: 'Nie znaleziono zasobu',
      path: req.path
    });
  }

  getBasicMiddleware() {
    return [
      this.getCors(),
      this.getHelmet(),
      this.getCompression(),
      this.getRateLimit()
    ];
  }

  getErrorMiddleware() {
    return [
      this.errorHandler,
      this.notFoundHandler
    ];
  }
}

module.exports = MiddlewareCommon; 