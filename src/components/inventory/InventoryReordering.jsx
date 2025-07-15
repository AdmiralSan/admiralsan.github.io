import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AutomatedReorder from '../../components/AutomatedReorder';

const InventoryReordering = () => {
  const { refreshData } = useOutletContext();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Automated Reordering</h2>
      <AutomatedReorder />
    </div>
  );
};

export default InventoryReordering;
