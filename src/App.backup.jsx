import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import Header from './components/Header';
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
// Login components removed
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './App.css';

function AppContent() {
  const [refreshProducts, setRefreshProducts] = useState(false);

  const handleProductAdded = () => {
    setRefreshProducts(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Direct access without login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* All routes accessible without login */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/products" element={
            <div className="w-full">
              <ProductList key={refreshProducts} onProductAdded={handleProductAdded} />
            </div>
          } />
          
          {/* Inventory routes with sub-pages */}
          <Route path="/inventory" element={<Inventory />}>
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
          
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/suppliers" element={<SupplierManagement />} />
          <Route path="/reordering" element={<AutomatedReorder />} />
          <Route path="/warehouses" element={<WarehouseManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/service-records" element={<ServiceRecords />} />
          <Route path="/billing" element={<Billing />} />
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
          <Router>
            <AppContent />
          </Router>
        </CurrencyProvider>
      </TemplateProvider>
    </ThemeProvider>
  );
}

export default App;
