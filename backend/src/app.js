const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const sanitizer = require('./middlewares/sanitizer');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');
const env = require('./config/env');
const logger = require('./config/logger');

const app = express();

// ===== Settings =====
app.set('query parser', 'extended');
app.set('trust proxy', 1);

// ===== Security Middleware =====
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));

// ===== Body Parsing =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== Data Sanitization =====
app.use(sanitizer);

// ===== Compression =====
app.use(compression());

// ===== Logging =====
if (env.isDev()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ===== Rate Limiting =====
app.use('/api/', apiLimiter);

// ===== API Routes =====
app.use('/api/v1', routes);

// ===== Root Route =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛒 WalMart Clone API v1.0',
    docs: '/api/v1/health',
  });
});

// ===== Error Handling =====
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
