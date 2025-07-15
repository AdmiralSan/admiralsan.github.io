import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import Header from './components/Header.clerk';
import StockMovementHistory from './components/StockMovementHistory';
import AutomatedReorder from './components/AutomatedReorder';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SupplierManagement from './pages/SupplierManagement';
import WarehouseManagement from './pages/WarehouseManagement';
import UserManagement from './pages/UserManagement';
import ServiceRecords from './pages/ServiceRecords';
import Billing from './pages/Billing';
import Unauthorized from './pages/Unauthorized';
import Inventory from './pages/Inventory';
import Login from './pages/Login.clerk';
import Register from './pages/Register.clerk';
// Inventory sub-pages
import InventoryOverview from './components/inventory/InventoryOverview';
import InventoryProducts from './components/inventory/InventoryProducts';
import ProductVariants from './components/inventory/ProductVariants';
import StockLevels from './components/inventory/StockLevels';
import BatchTracking from './components/inventory/BatchTracking';
import StockMovements from './components/inventory/StockMovements';
import InventoryWarehouses from './components/inventory/InventoryWarehouses';
import InventorySuppliers from './components/inventory/InventorySuppliers';
import InventoryReordering from './components/inventory/InventoryReordering';
// Protected Route
import ProtectedRoute from './components/ProtectedRoute.clerk';
import { ThemeProvider } from './contexts/ThemeContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthContext.clerk';
import './App.css';

function AppContent() {
  const [refreshProducts, setRefreshProducts] = useState(false);
  const { isSignedIn } = useUser();

  const handleProductAdded = () => {
    setRefreshProducts(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <div className="w-full">
                <ProductList key={refreshProducts} onProductAdded={handleProductAdded} />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Inventory routes with sub-pages */}
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }>
            <Route path="overview" element={<InventoryOverview />} />
            <Route path="products" element={<InventoryProducts />} />
            <Route path="variants" element={<ProductVariants />} />
            <Route path="stock-levels" element={<StockLevels />} />
            <Route path="batch-tracking" element={<BatchTracking />} />
            <Route path="stock-movements" element={<StockMovements />} />
            <Route path="warehouses" element={<InventoryWarehouses />} />
            <Route path="suppliers" element={<InventorySuppliers />} />
            <Route path="reordering" element={<InventoryReordering />} />
          </Route>
          
          {/* Redirect old URLs to new location */}
          <Route path="/inventory-movements" element={<Navigate to="/inventory/stock-movements" replace />} />
          <Route path="/suppliers" element={<Navigate to="/inventory/suppliers" replace />} />
          <Route path="/reordering" element={<Navigate to="/inventory/reordering" replace />} />
          <Route path="/warehouses" element={<Navigate to="/inventory/warehouses" replace />} />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/service-records" element={
            <ProtectedRoute>
              <ServiceRecords />
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TemplateProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </CurrencyProvider>
      </TemplateProvider>
    </ThemeProvider>
  );
}

export default App;
