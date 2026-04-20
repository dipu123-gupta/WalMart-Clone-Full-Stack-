import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_URL } from '../constants'; // Extract base domain

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    let socketInstance;

    if (isAuthenticated && user) {
      // Connect to the base URL (stripping out /api/v1 if it exists in API_URL)
      const parsedUrl = new URL(API_URL, window.location.origin);
      const baseUrl = parsedUrl.origin;
      const token = localStorage.getItem('accessToken');

      socketInstance = io(baseUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('🔗 WebSocket Connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('🔗 WebSocket Disconnected');
      });

      // Handle token expiration / auth errors sent by server
      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  return { socket, isConnected };
};
