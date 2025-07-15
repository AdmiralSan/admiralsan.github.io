import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
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
import { ThemeProvider } from './contexts/ThemeContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './App.css';

function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">VsdvBillsoft</h1>
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedOut>
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to VsdvBillsoft
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Your comprehensive inventory management solution
            </p>
            <div className="space-x-4">
              <SignInButton>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  Sign In to Get Started
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </div>
        </SignedOut>
        
        <SignedIn>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            
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
            <Route path="/suppliers" element={<Navigate to="/inventory/suppliers" replace />} />
            <Route path="/reordering" element={<Navigate to="/inventory/reordering" replace />} />
            <Route path="/warehouses" element={<Navigate to="/inventory/warehouses" replace />} />
            
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/service-records" element={<ServiceRecords />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </SignedIn>
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
