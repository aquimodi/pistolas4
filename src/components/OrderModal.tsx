import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

const OrderModal: React.FC<OrderModalProps> = ({ order, projectId, isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    order_code: '',
    equipment_count: 0,
    vendor: '',
    description: '',
    expected_delivery_date: '',
    status: 'pending'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectsAPI.getAll();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    
    if (!projectId) {
      fetchProjects();
    }
  }, [projectId]);

  useEffect(() => {
    if (order) {
      setFormData({
        order_code: order.order_code || '',
        equipment_count: order.equipment_count || 0,
        vendor: order.vendor || '',
        description: order.description || '',
        expected_delivery_date: order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '',
        status: order.status || 'pending'
      });
      setSelectedProjectId(order.project_id?.toString() || projectId || '');
    } else {
      setFormData({
        order_code: '',
        equipment_count: 0,
        vendor: '',
        description: '',
        expected_delivery_date: '',
        status: 'pending_receive'
      });
      setSelectedProjectId(projectId || '');
    }
  }, [order, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        project_id: selectedProjectId,
        expected_delivery_date: formData.expected_delivery_date || null
      };

      if (order) {
        await ordersAPI.update(order.id, dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Order Updated',
          message: 'Order has been updated successfully'
        });
      } else {
        await ordersAPI.create(dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Order Created',
          message: 'New order has been created successfully'
        });
      }
      onSave();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save order'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {order ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {!projectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyecto *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Seleccionar proyecto...</option>
                    {projects.map((project: any) => (
                      <option key={project.id} value={project.id.toString()}>
                        {project.project_name} ({project.ritm_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              Código Pedido *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.order_code}
              onChange={(e) => setFormData(prev => ({ ...prev, order_code: e.target.value }))}
              placeholder="ej. PED-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Equipos *
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.equipment_count}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_count: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              placeholder="ej. Dell Technologies"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del pedido..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Entrega Esperada
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.expected_delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="pending_receive">Pending Receive</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="partial">Partially Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLoading && <LoadingSpinner size="small" className="mr-2" />}
              {order ? 'Update' : 'Create'} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;