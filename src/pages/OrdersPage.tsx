import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ordersAPI, projectsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderModal from '../components/OrderModal';

interface OrdersPageProps {}

const OrdersPage: React.FC<OrdersPageProps> = () => {
  const { projectId } = useParams();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      if (projectId && projectId !== 'all') {
        // Fetch project details
        const projectData = await projectsAPI.getById(projectId);
        setProject(projectData);
        
        // Fetch orders for specific project
        const ordersData = await ordersAPI.getByProject(projectId);
        setOrders(ordersData);
      } else {
        // Show all orders
        const data = await ordersAPI.getAll();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders'
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleModalSave = async (data: any) => {
    try {
      if (selectedOrder) {
        await ordersAPI.update(selectedOrder.id, data);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Order updated successfully'
        });
      } else {
        await ordersAPI.create({ ...data, project_id: projectId });
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Order created successfully'
        });
      }
      await fetchData();
      handleModalClose();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save order'
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
            {projectId && projectId !== 'all' ? 'Orders for Project' : 'All Orders'}
          </h1>
          {project && (
            <p className="text-gray-600 mt-1">{project.project_name} - {project.client}</p>
          )}
        </div>
        {projectId && projectId !== 'all' && (
          <button
            onClick={handleCreateOrder}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Order</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {orders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{order.order_code || order.order_number}</h3>
                        <p className="text-sm text-gray-600">Vendor: {order.vendor}</p>
                        <p className="text-sm text-gray-600">Equipos: {order.equipment_count}</p>
                        {!projectId && order.project_name && (
                          <p className="text-xs text-gray-500">Project: {order.project_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {order.expected_delivery_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {projectId && projectId !== 'all' 
                ? 'Get started by creating a new order for this project.'
                : 'No orders found in the system.'
              }
            </p>
            {projectId && projectId !== 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateOrder}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Order</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        order={selectedOrder}
        projectId={projectId}
      />
    </div>
  );
};

export default OrdersPage;