import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import format from 'date-fns/format';

const StockMovementHistory = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const movementsPerPage = 10;

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, [currentPage, filter]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('id, name');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stock_movements')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('movement_type', filter);
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('stock_movements')
        .select('id', { count: 'exact' });

      if (countError) throw countError;

      setTotalPages(Math.ceil(count / movementsPerPage));

      // Fetch paginated data
      const from = (currentPage - 1) * movementsPerPage;
      const to = from + movementsPerPage - 1;
      
      const { data, error } = await query.range(from, to);
      
      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'incoming':
        return 'bg-green-100 text-green-700';
      case 'outgoing':
        return 'bg-red-100 text-red-700';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-700';
      case 'transfer':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) return '-';
      return format(new Date(timestamp), 'PPp');
    } catch (error) {
      return timestamp;
    }
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const filteredMovements = movements.filter((movement) => {
    const productName = movement.products?.name?.toLowerCase() || '';
    const reference = movement.reference_number?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return productName.includes(searchLower) || reference.includes(searchLower);
  });

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Stock Movement History</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Movements</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
            <option value="adjustment">Adjustments</option>
            <option value="transfer">Transfers</option>
          </select>
          <input
            type="text"
            placeholder="Search by product or reference..."
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      ) : error ? (
        <motion.div
          className="bg-red-50 border border-red-200 rounded-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-red-600">Error: {error}</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {filteredMovements.length === 0 ? (
            <motion.p
              className="text-slate-500 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              No stock movements found.
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredMovements.map((movement) => (
                    <motion.tr
                      key={movement.id}
                      whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                      className="transition-all"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatTimestamp(movement.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {movement.products?.name || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(
                            movement.movement_type
                          )}`}
                        >
                          {movement.movement_type?.charAt(0).toUpperCase() + movement.movement_type?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {movement.reference_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {movement.notes || '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mt-4 flex justify-center">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default StockMovementHistory;
