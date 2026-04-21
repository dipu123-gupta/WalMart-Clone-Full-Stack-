import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { ProtectedRoute, GuestRoute, RoleGuard } from '@/components/protected/RouteGuards';

// Lazy loaded pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Seller Pages
const SellerLayout = lazy(() => import('@/layouts/SellerLayout'));
const SellerDashboardPage = lazy(() => import('@/pages/seller/SellerDashboardPage'));
const SellerProductsPage = lazy(() => import('@/pages/seller/SellerProductsPage'));
const SellerOrdersPage = lazy(() => import('@/pages/seller/SellerOrdersPage'));
const SellerPayoutsPage = lazy(() => import('@/pages/seller/SellerPayoutsPage'));
const SellerSettingsPage = lazy(() => import('@/pages/seller/SellerSettingsPage'));

// Delivery Agent Pages
const DeliveryAgentLayout = lazy(() => import('@/layouts/DeliveryAgentLayout'));
const DeliveryAgentDashboardPage = lazy(() => import('@/pages/delivery/DeliveryAgentDashboardPage'));
const DeliveryHistoryPage = lazy(() => import('@/pages/delivery/DeliveryHistoryPage'));
const DeliverySettingsPage = lazy(() => import('@/pages/delivery/DeliverySettingsPage'));

// Admin Pages
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminPayoutsPage = lazy(() => import('@/pages/admin/AdminPayoutsPage'));
const AdminLogisticsPage = lazy(() => import('@/pages/admin/AdminLogisticsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

// Auth
const LoginForm = lazy(() => import('@/features/auth/components/LoginForm'));
const RegisterForm = lazy(() => import('@/features/auth/components/RegisterForm'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <span className="loading loading-spinner loading-lg text-walmart-blue"></span>
  </div>
);

const wrap = (Component, guard = null) => {
  const el = (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
  if (guard === 'protected') return <ProtectedRoute>{el}</ProtectedRoute>;
  if (guard === 'guest') return <GuestRoute>{el}</GuestRoute>;
  return el;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: wrap(HomePage) },
      { path: 'products', element: wrap(ProductsPage) },
      { path: 'products/:slug', element: wrap(ProductDetailPage) },
      { path: 'search', element: wrap(SearchPage) },
      { path: 'cart', element: wrap(CartPage) },
      { path: 'compare', element: wrap(ComparePage) },
      { path: 'checkout', element: wrap(CheckoutPage, 'protected') },
      { path: 'orders', element: wrap(OrdersPage, 'protected') },
      { path: 'orders/:id', element: wrap(OrderDetailPage, 'protected') },
      { path: 'profile', element: wrap(ProfilePage, 'protected') },
      { path: 'wishlist', element: wrap(WishlistPage, 'protected') },
      { path: 'notifications', element: wrap(NotificationsPage, 'protected') },
      { path: '*', element: wrap(NotFoundPage) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: wrap(LoginForm, 'guest') },
      { path: 'register', element: wrap(RegisterForm, 'guest') },
    ],
  },
  {
    path: '/seller',
    element: (
      <RoleGuard roles={['seller']}>
        {wrap(SellerLayout)}
      </RoleGuard>
    ), 
    children: [
      { index: true, element: wrap(SellerDashboardPage) },
      { path: 'dashboard', element: wrap(SellerDashboardPage) },
      { path: 'products', element: wrap(SellerProductsPage) },
      { path: 'orders', element: wrap(SellerOrdersPage) },
      { path: 'payouts', element: wrap(SellerPayoutsPage) },
      { path: 'settings', element: wrap(SellerSettingsPage) },
    ]
  },
  {
    path: '/admin',
    element: (
      <RoleGuard roles={['admin']}>
        {wrap(AdminLayout)}
      </RoleGuard>
    ),
    children: [
      { index: true, element: wrap(AdminDashboardPage) },
      { path: 'dashboard', element: wrap(AdminDashboardPage) },
      { path: 'users', element: wrap(AdminUsersPage) },
      { path: 'products', element: wrap(AdminProductsPage) },
      { path: 'coupons', element: wrap(AdminCouponsPage) },
      { path: 'payouts', element: wrap(AdminPayoutsPage) },
      { path: 'logistics', element: wrap(AdminLogisticsPage) },
      { path: 'settings', element: wrap(AdminSettingsPage) },
    ]
  },
  {
    path: '/delivery',
    element: (
      <RoleGuard roles={['delivery_agent']}>
        {wrap(DeliveryAgentLayout)}
      </RoleGuard>
    ),
    children: [
      { index: true, element: wrap(DeliveryAgentDashboardPage) },
      { path: 'dashboard', element: wrap(DeliveryAgentDashboardPage) },
      { path: 'history', element: wrap(DeliveryHistoryPage) },
      { path: 'settings', element: wrap(DeliverySettingsPage) },
    ]
  }
]);

export default router;
