const http = require('http');
const logger = require('./config/logger');

// Global error handlers (Top-level)
process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const registerEventHandlers = require('./events/eventHandlers');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Register event handlers
  registerEventHandlers();

  // Start background jobs
  const { startOrderCleanupJob } = require('./jobs/orderCleanupJob');
  startOrderCleanupJob();

  // Create HTTP server (for Socket.io)
  const server = http.createServer(app);

  // Initialize Socket.io Server
  const { initSocketServer } = require('./sockets/socketManager');
  initSocketServer(server);

  // Start listening
  server.listen(env.PORT, () => {
    logger.info(`
    ╔══════════════════════════════════════════════╗
    ║  🛒 WalMart Clone API Server                ║
    ║  Environment: ${env.NODE_ENV.padEnd(30)}║
    ║  Port: ${String(env.PORT).padEnd(37)}║
    ║  URL: http://localhost:${String(env.PORT).padEnd(22)}║
    ╚══════════════════════════════════════════════╝
    `);
  });
};

startServer();
