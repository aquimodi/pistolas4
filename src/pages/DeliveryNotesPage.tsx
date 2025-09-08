import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Package, Truck, Building } from 'lucide-react';
import { deliveryNotesAPI, ordersAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';

const DeliveryNotesPage = () => {
  const { orderId } = useParams();
  const { addNotification } = useNotification();
  const [order, setOrder] = useState<any>(null);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      if (orderId) {
        const deliveryNotesData = await deliveryNotesAPI.getByOrder(orderId);
        setDeliveryNotes(deliveryNotesData);
        
        // Mock order data for breadcrumb
        setOrder({ 
          id: orderId, 
          order_number: `ORD-2024-${orderId.padStart(3, '0')}`,
          project_name: 'DC Expansion Phase 1'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch delivery notes'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: 'Project', href: '/projects' },
        { label: 'Orders', href: '/projects/1/orders' },
        { label: order?.order_number || 'Order', current: true }
      ]} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Notes - {order?.order_number}</h1>
            <p className="mt-1 text-gray-600">Order: {order?.order_number}</p>
          </div>
        </div>
      </div>

      {/* Delivery Notes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Delivery Notes</h2>
        </div>
        
        {deliveryNotes.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {deliveryNotes.map((note: any) => (
              <div key={note.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{note.delivery_note_number}</h3>
                        {note.carrier && (
                          <p className="text-sm text-gray-600">Carrier: {note.carrier}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Delivered {new Date(note.delivery_date).toLocaleDateString()}
                      </div>
                      {note.tracking_number && (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          Tracking: {note.tracking_number}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                      {note.status?.replace('_', ' ') || 'received'}
                    </span>
                    <Link
                      to={`/delivery-notes/${note.id}/equipment`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Equipment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery notes</h3>
            <p className="mt-1 text-sm text-gray-500">Delivery notes will appear here when items are received.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryNotesPage;