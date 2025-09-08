import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Package, Truck, Building } from 'lucide-react';
import { ordersAPI, projectsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderModal from '../components/OrderModal';

const OrdersPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [project, setProject] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const fetchData = async () => {
    try {
      if (projectId) {
        const [projectData, ordersData] = await Promise.all([
          projectsAPI.getById(projectId),
          ordersAPI.getByProject(projectId)
        ]);
        setProject(projectData);
        setOrders(ordersData);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleOrderSaved = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
        { label: project?.name || 'Project', href: `/projects` },
        { label: 'Orders', current: true }

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders - {project?.name}</h1>
            <p className="mt-1 text-gray-600">{project?.description}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project?.status)}`}>
                {project?.status?.replace('_', ' ') || 'active'}
              </span>
            </div>
          </div>
          <button
            onClick={handleCreateOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Orders</h2>
        </div>
        
        {orders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{order.order_number}</h3>
                        <p className="text-sm text-gray-600">Vendor: {order.vendor}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      {order.expected_delivery_date && (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          Expected {new Date(order.expected_delivery_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status?.replace('_', ' ') || 'pending'}
                    </span>
                    <Link
                      to={`/orders/${order.id}/delivery-notes`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Delivery Notes
                    </Link>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first order for this project.</p>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          order={editingOrder}
          projectId={projectId!}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleOrderSaved}
        />
      )}
    </div>
  );
};

export default OrdersPage;