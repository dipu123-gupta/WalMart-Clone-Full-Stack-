const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');
const User = require('../models/User');

let io;

const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      
      // Ensure user exists
      const user = await User.findById(decoded.id).select('role isActive');
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not active or not found'));
      }

      socket.user = {
        id: decoded.id,
        role: user.role,
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      next(new Error('Authentication error: Invalid string'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

    // Join isolated rooms for targeted emissions
    socket.join(`user_${socket.user.id}`);
    socket.join(`role_${socket.user.role}`);

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
    
    // Additional custom events can be bound here
    // e.g., socket.on('listen_order', (orderId) => socket.join(`order_${orderId}`));
  });

  logger.info('🚀 Socket.IO Server initialized successfully');
  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIo,
};
