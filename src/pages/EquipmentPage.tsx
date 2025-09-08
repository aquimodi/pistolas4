import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Package, MapPin, Calendar, Cpu, HardDrive } from 'lucide-react';
import { equipmentAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';

const EquipmentPage = () => {
  const { deliveryNoteId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEquipment = async () => {
    try {
      if (deliveryNoteId && deliveryNoteId !== 'all') {
        const data = await equipmentAPI.getByDeliveryNote(deliveryNoteId);
        setEquipment(data);
      } else {
        // Show all equipment if no specific delivery note
        const data = await equipmentAPI.getAll();
        setEquipment(data);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch equipment'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [deliveryNoteId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'installed': return 'bg-green-100 text-green-800';
      case 'configured': return 'bg-purple-100 text-purple-800';
      case 'decommissioned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
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
        { label: 'Project Name', href: '/projects' },
        { label: 'Order Number', href: '/projects/1/orders' },
        { label: 'Delivery Note', current: true }
      ]} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Inventory</h1>
            <p className="mt-1 text-gray-600">Delivery Note: DN-2024-{deliveryNoteId}</p>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      {equipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="h-8 w-8 text-blue-600" />
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status?.replace('_', ' ') || 'received'}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {item.manufacturer} {item.model}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Cpu className="h-4 w-4 mr-2" />
                    Serial: {item.serial_number}
                  </div>
                  
                  {item.asset_tag && (
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      Asset: {item.asset_tag}
                    </div>
                  )}
                  
                  {item.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location: {item.location}
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                {item.condition_status && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition_status)}`}>
                      Condition: {item.condition_status}
                    </span>
                  </div>
                )}

                {item.specifications && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 line-clamp-2">{item.specifications}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment</h3>
            <p className="mt-1 text-sm text-gray-500">Equipment items will appear here when they are registered.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;