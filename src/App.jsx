import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
// Clerk authentication removed
import { motion, AnimatePresence } from 'framer-motion';
// Duplicate NavLink import removed
// ...existing code...
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
// ...existing code...
import DebugPanel from './components/DebugPanel';
// ...existing code...
import Accounts from './pages/Accounts';
import AccountsOverview from './pages/accounts/AccountsOverview';
import DailyLedger from './pages/accounts/DailyLedger';
import PaymentsPage from './pages/accounts/PaymentsPage';
import PendingPayments from './pages/accounts/PendingPayments';
import AssignedPendingPayments from './pages/accounts/AssignedPendingPayments';
import ExpensesPage from './pages/accounts/ExpensesPage';
import AccountsReports from './pages/accounts/AccountsReports';
// import AccountsSettings from './pages/accounts/AccountsSettings';
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
import CustomersPage from './pages/Customers';
import { CurrencyProvider } from './contexts/CurrencyContext';
// ...existing code...
import './App.css';

function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Navigation links for header
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Products', href: '/products' },
    { name: 'Inventory', href: '/inventory/overview' },
    { name: 'Accounts', href: '/accounts/overview' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
    { name: 'Billing', href: '/billing' },
    { name: 'Customers', href: '/customers' },
    { name: 'Service Records', href: '/service-records' },
    { name: 'User Management', href: '/users' }
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur shadow-sm w-full sticky top-0 z-30 fade-in"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-blue-600 tracking-tight select-none hover:text-blue-700 transition-colors">
              VsdvBillsoft
            </NavLink>
            
            {/* Mobile menu button */}
            <button 
              className="ml-4 md:hidden text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop Navigation - Only show when signed in */}
        {/* Desktop Navigation - Always show */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
          
          <div className="flex items-center space-x-4">
            {/* Notification button - always show */}
            <button className="text-slate-600 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {/* Authentication buttons removed */}
            {/* UserButton removed */}
          </div>
        </div>
        
        {/* Mobile Navigation - Always show */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-slate-200 py-3"
            >
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.href}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors px-2 py-1 rounded ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`
                    }
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
          <AnimatePresence>
            {showMobileMenu && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden border-t border-slate-200 py-3"
              >
                <div className="flex flex-col space-y-3">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.href}
                      className={({ isActive }) =>
                        `text-sm font-medium transition-colors px-2 py-1 rounded ${
                          isActive
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        }`
                      }
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        {/* End navigation and header */}
      </div>
    </motion.header>
  );
}

function AppContent() {
  const [refreshProducts, setRefreshProducts] = useState(false);

  const handleProductAdded = () => {
    setRefreshProducts(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main app routes - always show */}
        <Routes>
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* AdminSetup removed */}
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
          <Route path="/suppliers" element={<Navigate to="/inventory/suppliers" replace />} />
          <Route path="/reordering" element={<Navigate to="/inventory/reordering" replace />} />
          <Route path="/warehouses" element={<Navigate to="/inventory/warehouses" replace />} />
          {/* Accounts routes with sub-pages */}
          <Route path="/accounts" element={<Accounts />}>
            <Route path="overview" element={<AccountsOverview />} />
            <Route path="daily-ledger" element={<DailyLedger />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="pending" element={<PendingPayments />} />
            <Route path="assigned-pending" element={<AssignedPendingPayments />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<AccountsReports />} />
            {/* <Route path="settings" element={<AccountsSettings />} /> */}
          </Route>
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/service-records" element={<ServiceRecords />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
        {/* Debug Panel - Remove this in production */}
        <DebugPanel />
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
