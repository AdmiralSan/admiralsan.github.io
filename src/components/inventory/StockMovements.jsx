import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import format from 'date-fns/format';

const StockMovements = () => {
  const { refreshData } = useOutletContext();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const movementsPerPage = 10;
  // Checkbox handlers
  const handleSelectMovement = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredMovements.map((m) => m.id));
      setSelectAll(true);
    }
  };

  // Delete selected movements
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('stock_movements')
        .delete()
        .in('id', selectedIds);
      if (error) throw error;
      setSelectedIds([]);
      setSelectAll(false);
      fetchMovements();
    } catch (err) {
      setError('Failed to delete selected stock movements: ' + err.message);
    }
  };

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
    <div>
      <h2 className="text-xl font-semibold mb-6">Stock Movement History</h2>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk delete button */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedIds.length})
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <motion.div
            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <AnimatePresence>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No stock movements found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovements.map((movement) => (
                    <tr 
                      key={movement.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(movement.id)}
                          onChange={() => handleSelectMovement(movement.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(movement.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {movement.products?.name || 'Unknown Product'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(
                            movement.movement_type
                          )}`}
                        >
                          {movement.movement_type?.charAt(0).toUpperCase() + movement.movement_type?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reference_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mt-4 flex justify-center">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default StockMovements;