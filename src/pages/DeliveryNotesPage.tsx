import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { deliveryNotesAPI, ordersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DeliveryNoteModal from '../components/DeliveryNoteModal';

interface DeliveryNotesPageProps {}

const DeliveryNotesPage: React.FC<DeliveryNotesPageProps> = () => {
  const { orderId } = useParams();
  const { addNotification } = useNotification();
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      if (orderId && orderId !== 'all') {
        // Fetch order details
        const orderData = await ordersAPI.getById(orderId);
        setOrder(orderData);
        
        // Fetch delivery notes for specific order
        const deliveryNotesData = await deliveryNotesAPI.getByOrder(orderId);
        setDeliveryNotes(deliveryNotesData);
      } else {
        // Show all delivery notes
        const data = await deliveryNotesAPI.getAll();
        setDeliveryNotes(data);
      }
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch delivery notes'
      });
      setDeliveryNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeliveryNote = () => {
    setSelectedDeliveryNote(null);
    setIsModalOpen(true);
  };

  const handleEditDeliveryNote = (deliveryNote: any) => {
    setSelectedDeliveryNote(deliveryNote);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDeliveryNote(null);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (selectedDeliveryNote) {
        await deliveryNotesAPI.update(selectedDeliveryNote.id, data);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Delivery note updated successfully'
        });
      } else {
        await deliveryNotesAPI.create({ ...data, order_id: orderId });
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Delivery note created successfully'
        });
      }
      await fetchData();
      handleModalClose();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save delivery note'
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
            {orderId && orderId !== 'all' ? 'Delivery Notes for Order' : 'All Delivery Notes'}
          </h1>
          {order && (
            <p className="text-gray-600 mt-1">Order: {order.order_code} - {order.vendor}</p>
          )}
        </div>
        {orderId && orderId !== 'all' && (
          <button
            onClick={handleCreateDeliveryNote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Delivery Note</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {deliveryNotes.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {deliveryNotes.map((note: any) => (
              <div key={note.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{note.delivery_code || note.delivery_note_number}</h3>
                        <p className="text-sm text-gray-600">Equipos estimados: {note.estimated_equipment_count}</p>
                        {note.carrier && (
                          <p className="text-sm text-gray-600">Carrier: {note.carrier}</p>
                        )}
                        {!orderId && note.order_number && (
                          <p className="text-xs text-gray-500">Order: {note.order_number}</p>
                        )}
                        {!orderId && note.project_name && (
                          <p className="text-xs text-gray-500">Project: {note.project_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      note.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      note.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {note.status}
                    </span>
                    <button
                      onClick={() => handleEditDeliveryNote(note)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {note.delivery_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Delivered: {new Date(note.delivery_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery notes</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orderId && orderId !== 'all' 
                ? 'Get started by creating a new delivery note for this order.'
                : 'No delivery notes found in the system.'
              }
            </p>
            {orderId && orderId !== 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateDeliveryNote}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Delivery Note</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <DeliveryNoteModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        deliveryNote={selectedDeliveryNote}
        orderId={orderId}
      />
    </div>
  );
};

export default DeliveryNotesPage;