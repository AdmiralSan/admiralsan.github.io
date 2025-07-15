import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card bg-white"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {isLoading ? (
          <div className="h-7 w-20 bg-slate-200 animate-pulse rounded mt-1"></div>
        ) : (
          <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ title, description, icon, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="card bg-white hover:shadow-lg transition-shadow"
  >
    <div className="flex items-start gap-4">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <div className="text-left">
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  </motion.button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    categories: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch total products count
        const { count: totalProducts, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (productsError) throw productsError;

        // Fetch products for calculating low stock and total value
        const { data: products, error: productsDataError } = await supabase
          .from('products')
          .select('price, quantity, reorder_level, category');

        if (productsDataError) throw productsDataError;

        // Calculate low stock items
        const lowStockItems = products.filter(product => 
          product.quantity <= (product.reorder_level || 0)
        ).length;

        // Calculate total inventory value
        const totalValue = products.reduce((sum, product) => 
          sum + (product.price || 0) * (product.quantity || 0), 0
        );

        // Get unique categories
        const uniqueCategories = new Set();
        products.forEach(product => {
          if (product.category) {
            uniqueCategories.add(product.category);
          }
        });

        // Fetch recent stock movements
        const { data: movements, error: movementsError } = await supabase
          .from('stock_movements')
          .select(`
            id, 
            quantity, 
            movement_type, 
            created_at,
            products:product_id (name)
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (movementsError) throw movementsError;

        setRecentActivity(movements || []);
        
        setStatsData({
          totalProducts: totalProducts || 0,
          lowStockItems,
          totalValue,
          categories: uniqueCategories.size
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Products',
      value: statsData.totalProducts.toLocaleString(),
      icon: <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      color: 'bg-blue-50',
      isLoading: loading
    },
    {
      title: 'Low Stock Items',
      value: statsData.lowStockItems.toLocaleString(),
      icon: <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      color: 'bg-red-50',
      isLoading: loading
    },
    {
      title: 'Total Value',
      value: formatCurrency(statsData.totalValue),
      icon: <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'bg-green-50',
      isLoading: loading
    },
    {
      title: 'Categories',
      value: statsData.categories.toLocaleString(),
      icon: <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      color: 'bg-purple-50',
      isLoading: loading
    }
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Add a new item to your inventory',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
      onClick: () => navigate('/products/new')
    },
    {
      title: 'Generate Report',
      description: 'Create a detailed inventory report',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      onClick: () => navigate('/reports')
    },
    {
      title: 'Low Stock Alert',
      description: 'View items that need restocking',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
      onClick: () => navigate('/reorder')
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="text-sm text-slate-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <QuickAction key={action.title} {...action} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card bg-white"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
        
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg animate-pulse">
                <div className="p-2 bg-slate-200 rounded-full h-9 w-9"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          // Real activity data
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.movement_type === 'incoming' 
                    ? 'bg-green-50' 
                    : activity.movement_type === 'outgoing' 
                    ? 'bg-red-50' 
                    : 'bg-blue-50'
                }`}>
                  <svg className={`w-5 h-5 ${
                    activity.movement_type === 'incoming' 
                      ? 'text-green-600' 
                      : activity.movement_type === 'outgoing' 
                      ? 'text-red-600' 
                      : 'text-blue-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {activity.movement_type === 'incoming' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    ) : activity.movement_type === 'outgoing' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {activity.movement_type === 'incoming' 
                      ? `Added ${activity.quantity} ${activity.products?.name || 'item(s)'} to stock` 
                      : activity.movement_type === 'outgoing' 
                      ? `Removed ${activity.quantity} ${activity.products?.name || 'item(s)'} from stock`
                      : `Adjusted stock of ${activity.products?.name || 'item(s)'}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // No activity
          <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg">
            No recent activity recorded
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;