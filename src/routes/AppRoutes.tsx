import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Layout } from '../components/layout/Layout';

// Route-level code splitting. The editor/prosemirror bundle (~1.6 MB raw) and
// leaflet (~240 kB) are only needed on a few routes, so they must not be in the
// entry chunk that every visitor downloads.
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import('../features/products/pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductListPage = lazy(() => import('../features/products/pages/ProductListPage').then(m => ({ default: m.ProductListPage })));
const ProductDetailPage = lazy(() => import('../features/products/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CreateProductPage = lazy(() => import('../features/products/pages/CreateProductPage').then(m => ({ default: m.CreateProductPage })));
const EditProductPage = lazy(() => import('../features/products/pages/EditProductPage').then(m => ({ default: m.EditProductPage })));
const CartPage = lazy(() => import('../features/cart/pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../features/cart/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('../features/cart/pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const InboxPage = lazy(() => import('../features/messages/pages/InboxPage').then(m => ({ default: m.InboxPage })));
const ProfilePage = lazy(() => import('../features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import('../features/profile/pages/PublicProfilePage').then(m => ({ default: m.PublicProfilePage })));

const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('../features/admin/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPlaceholder = lazy(() => import('../features/admin/pages/AdminPlaceholder').then(m => ({ default: m.AdminPlaceholder })));
const MainCategoryPage = lazy(() => import('../features/admin/pages/MainCategoryPage').then(m => ({ default: m.MainCategoryPage })));
const SubCategoryPage = lazy(() => import('../features/admin/pages/SubCategoryPage').then(m => ({ default: m.SubCategoryPage })));
const BrandPage = lazy(() => import('../features/admin/pages/BrandPage').then(m => ({ default: m.BrandPage })));
const ModelPage = lazy(() => import('../features/admin/pages/ModelPage').then(m => ({ default: m.ModelPage })));
const BodyTypePage = lazy(() => import('../features/admin/pages/BodyTypePage').then(m => ({ default: m.BodyTypePage })));
const AttributePage = lazy(() => import('../features/admin/pages/AttributePage').then(m => ({ default: m.AttributePage })));
const CategoryFieldPage = lazy(() => import('../features/admin/pages/CategoryFieldPage').then(m => ({ default: m.CategoryFieldPage })));
const ProvincePage = lazy(() => import('../features/admin/pages/ProvincePage').then(m => ({ default: m.ProvincePage })));
const DistrictPage = lazy(() => import('../features/admin/pages/DistrictPage').then(m => ({ default: m.DistrictPage })));
const CommunePage = lazy(() => import('../features/admin/pages/CommunePage').then(m => ({ default: m.CommunePage })));
const VillagePage = lazy(() => import('../features/admin/pages/VillagePage').then(m => ({ default: m.VillagePage })));
const UserPage = lazy(() => import('../features/admin/pages/UserPage').then(m => ({ default: m.UserPage })));
const ProductPage = lazy(() => import('../features/admin/pages/ProductPage').then(m => ({ default: m.ProductPage })));
const SliderPage = lazy(() => import('../features/admin/pages/SliderPage').then(m => ({ default: m.SliderPage })));
const RolePage = lazy(() => import('../features/admin/pages/RolePage').then(m => ({ default: m.RolePage })));
const PermissionPage = lazy(() => import('../features/admin/pages/PermissionPage').then(m => ({ default: m.PermissionPage })));

// Kept inline: it is tiny and gives the shell its look while the route chunk loads.
const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center" aria-busy="true" aria-label="Loading">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Auth routes without Layout */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

        {/* Routes using the Layout (Header/Footer) */}
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/u/:id" element={<PublicProfilePage />} />

          {/* Protected routes - redirected to /login if not authenticated */}
          <Route path="/sell" element={user ? <CreateProductPage /> : <Navigate to="/login" replace />} />
          <Route path="/edit-product/:id" element={user ? <EditProductPage /> : <Navigate to="/login" replace />} />
          <Route path="/cart" element={user ? <CartPage /> : <Navigate to="/login" replace />} />
          <Route path="/checkout" element={user ? <CheckoutPage /> : <Navigate to="/login" replace />} />
          <Route path="/orders" element={user ? <OrdersPage /> : <Navigate to="/login" replace />} />
          <Route path="/inbox" element={user ? <InboxPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="main-categories" element={<MainCategoryPage />} />
          <Route path="sub-categories" element={<SubCategoryPage />} />
          <Route path="category-fields" element={<CategoryFieldPage />} />
          <Route path="brands" element={<BrandPage />} />
          <Route path="models" element={<ModelPage />} />
          <Route path="body-types" element={<BodyTypePage />} />
          <Route path="attributes" element={<AttributePage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="sliders" element={<SliderPage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="roles" element={<RolePage />} />
          <Route path="permissions" element={<PermissionPage />} />
          <Route path="provinces" element={<ProvincePage />} />
          <Route path="districts" element={<DistrictPage />} />
          <Route path="communes" element={<CommunePage />} />
          <Route path="villages" element={<VillagePage />} />
          <Route path="config" element={<AdminPlaceholder />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
