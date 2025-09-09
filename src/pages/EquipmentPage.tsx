import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Plus } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { equipmentAPI, deliveryNotesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EquipmentModal from '../components/EquipmentModal';

interface EquipmentPageProps {}

const EquipmentPage: React.FC<EquipmentPageProps> = () => {
  const { deliveryNoteId } = useParams();
  const { addNotification } = useNotification();
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState(null);

  useEffect(() => {
    fetchData();
  }, [deliveryNoteId]);

  const fetchData = async () => {
    try {
      if (deliveryNoteId && deliveryNoteId !== 'all') {
        // Fetch delivery note details if needed
        // const deliveryNoteData = await deliveryNotesAPI.getById(deliveryNoteId);
        // setDeliveryNote(deliveryNoteData);
        
        // Fetch equipment for specific delivery note
        const equipmentData = await equipmentAPI.getByDeliveryNote(deliveryNoteId);
        setEquipment(equipmentData);
      } else {
        // Show all equipment
        const data = await equipmentAPI.getAll();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch equipment'
      });
      setEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEquipment = () => {
    setSelectedEquipment(null);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipmentItem: any) => {
    setSelectedEquipment(equipmentItem);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEquipment(null);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (selectedEquipment) {
        await equipmentAPI.update(selectedEquipment.id, data);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Equipment updated successfully'
        });
      } else {
        await equipmentAPI.create({ ...data, delivery_note_id: deliveryNoteId });
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Equipment registered successfully'
        });
      }
      await fetchData();
      handleModalClose();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save equipment'
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {deliveryNoteId && deliveryNoteId !== 'all' ? 'Equipment for Delivery Note' : 'All Equipment'}
          </h1>
          {deliveryNote && (
            <p className="text-gray-600 mt-1">Delivery Note: {deliveryNote.delivery_code}</p>
          )}
        </div>
        {deliveryNoteId && deliveryNoteId !== 'all' && (
          <button
            onClick={handleCreateEquipment}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Register Equipment</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {equipment.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {equipment.map((item: any) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.serial_number}</h3>
                        <p className="text-sm text-gray-600">{item.manufacturer} {item.model}</p>
                        {item.asset_tag && (
                          <p className="text-sm text-gray-600">Asset Tag: {item.asset_tag}</p>
                        )}
                        {!deliveryNoteId && item.delivery_note_number && (
                          <p className="text-xs text-gray-500">Delivery Note: {item.delivery_note_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'deployed' ? 'bg-green-100 text-green-800' :
                      item.status === 'received' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                    {item.condition_status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.condition_status === 'new' ? 'bg-green-100 text-green-800' :
                        item.condition_status === 'used' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.condition_status}
                      </span>
                    )}
                    <button
                      onClick={() => handleEditEquipment(item)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {item.location && (
                  <p className="text-xs text-gray-500 mt-2">Location: {item.location}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Monitor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment</h3>
            <p className="mt-1 text-sm text-gray-500">
              {deliveryNoteId && deliveryNoteId !== 'all' 
                ? 'Get started by registering equipment for this delivery note.'
                : 'No equipment found in the system.'
              }
            </p>
            {deliveryNoteId && deliveryNoteId !== 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateEquipment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Register Equipment</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        equipment={selectedEquipment}
        deliveryNoteId={deliveryNoteId}
      />
    </div>
  );
};

export default EquipmentPage;