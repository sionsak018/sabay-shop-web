import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { HomePage } from '../features/products/pages/HomePage';
import { ProductListPage } from '../features/products/pages/ProductListPage';
import { CreateProductPage } from '../features/products/pages/CreateProductPage';
import { EditProductPage } from '../features/products/pages/EditProductPage';
import { CartPage } from '../features/cart/pages/CartPage';
import { CheckoutPage } from '../features/cart/pages/CheckoutPage';
import { OrdersPage } from '../features/cart/pages/OrdersPage';
import { InboxPage } from '../features/messages/pages/InboxPage';
import { ProductDetailPage } from '../features/products/pages/ProductDetailPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { PublicProfilePage } from '../features/profile/pages/PublicProfilePage';
import { AdminLayout, AdminDashboard, AdminPlaceholder, MainCategoryPage, SubCategoryPage, BrandPage, ModelPage, BodyTypePage, AttributePage, CategoryFieldPage, ProvincePage, DistrictPage, CommunePage, VillagePage, UserPage, ProductPage, SliderPage, RolePage, PermissionPage } from '../features/admin';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
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
        <Route
          path="/sell"
          element={user ? <CreateProductPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/edit-product/:id"
          element={user ? <EditProductPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/cart"
          element={user ? <CartPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/checkout"
          element={user ? <CheckoutPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/orders"
          element={user ? <OrdersPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/inbox"
          element={user ? <InboxPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />

        {/* Categories Group */}
        <Route path="main-categories" element={<MainCategoryPage />} />
        <Route path="sub-categories" element={<SubCategoryPage />} />
        <Route path="category-fields" element={<CategoryFieldPage />} />

        {/* Product Attributes Group */}
        <Route path="brands" element={<BrandPage />} />
        <Route path="models" element={<ModelPage />} />
        <Route path="body-types" element={<BodyTypePage />} />
        <Route path="attributes" element={<AttributePage />} />

        <Route path="products" element={<ProductPage />} />
        <Route path="sliders" element={<SliderPage />} />

        {/* User Access Group */}
        <Route path="users" element={<UserPage />} />
        <Route path="roles" element={<RolePage />} />
        <Route path="permissions" element={<PermissionPage />} />

        {/* Locations Group */}
        <Route path="provinces" element={<ProvincePage />} />
        <Route path="districts" element={<DistrictPage />} />
        <Route path="communes" element={<CommunePage />} />
        <Route path="villages" element={<VillagePage />} />

        <Route path="config" element={<AdminPlaceholder />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
