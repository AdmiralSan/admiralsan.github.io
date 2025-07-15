import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SupplierManagement from '../../pages/SupplierManagement';

const InventorySuppliers = () => {
  const { refreshData } = useOutletContext();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Supplier Management</h2>
      <SupplierManagement />
    </div>
  );
};

export default InventorySuppliers;
