import React from 'react';
import { useOutletContext } from 'react-router-dom';
import WarehouseManagement from '../../pages/WarehouseManagement';

const InventoryWarehouses = () => {
  const { refreshData } = useOutletContext();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Warehouse Management</h2>
      <WarehouseManagement />
    </div>
  );
};

export default InventoryWarehouses;
