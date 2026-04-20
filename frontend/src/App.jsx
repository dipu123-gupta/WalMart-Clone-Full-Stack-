import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './app/store';
import router from './routes/AppRouter';
import { getProfile } from './features/auth/authSlice';
import { fetchCart } from './features/cart/cartSlice';
import { fetchWishlist } from './features/wishlist/wishlistSlice';
import { fetchNotifications } from './features/notifications/notificationSlice';
import { useSocket } from './hooks/useSocket';
import { Toaster, toast } from 'react-hot-toast';

const AppInitializer = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Try to restore session
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(getProfile());
    }
    // Generate guest session ID
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', 'guest_' + Math.random().toString(36).substring(2, 15));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      dispatch(fetchNotifications());
    } else {
      dispatch(fetchCart()); // Guest cart
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('order_updated', (data) => {
        toast.success(`Order Update: Your order #${data.orderId.slice(-6).toUpperCase()} is now ${data.status}!`, { duration: 6000 });
        // Can also dispatch to Redux here to update local order tracking state in Phase 5
      });
      return () => {
         socket.off('order_updated');
      };
    }
  }, [socket, isConnected]);

  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <Provider store={store}>
      <AppInitializer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#0071dc', secondary: '#fff' },
          },
        }}
      />
    </Provider>
  );
};

export default App;
