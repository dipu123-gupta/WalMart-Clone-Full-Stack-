import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import productReducer from '@/features/products/productSlice';
import cartReducer from '@/features/cart/cartSlice';
import orderReducer from '@/features/orders/orderSlice';
import searchReducer from '@/features/search/searchSlice';
import wishlistReducer from '@/features/wishlist/wishlistSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import compareReducer from '@/features/compare/compareSlice';

import deliveryReducer from '@/features/delivery/deliverySlice';
import settingsReducer from '@/features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    search: searchReducer,
    wishlist: wishlistReducer,
    notifications: notificationReducer,
    compare: compareReducer,
    delivery: deliveryReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
  devTools: import.meta.env.DEV,
});
