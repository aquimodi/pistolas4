import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Calendar, Package, FileText, Edit3, Trash2, Building, ArrowLeft } from 'lucide-react';
import { ordersAPI, projectsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import OrderModal from '../components/OrderModal';
import LoadingSpinner from '../components/LoadingSpinner';

const OrdersPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [projectsResponse, ordersResponse] = await Promise.all([
        projectsAPI.getAll(),
        projectId ? ordersAPI.getByProject(projectId) : ordersAPI.getAll(),
      ]);
      
      setProjects(projectsResponse);
      setOrders(ordersResponse);
      
      if (projectId) {
        const project = projectsResponse.find(p => p.id === parseInt(projectId));
        setCurrentProject(project || null);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar los datos'
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

  const handleEdit = (order: Order) => {
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
      case 'pending_receive': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
        ...(currentProject ? [
          { label: currentProject.project_name, href: `/projects/${currentProject.id}` },
          { label: 'Orders', current: true }
        ] : [
          { label: 'Orders', current: true }
        ])
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            {currentProject && (
              <Link
                to="/projects"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentProject ? `Pedidos - ${currentProject.project_name}` : 'Todos los Pedidos'}
              </h1>
              <p className="text-gray-600">
                {currentProject 
                  ? `Cliente: ${currentProject.client} | Datacenter: ${currentProject.datacenter}`
                  : 'Gestiona todos los pedidos de equipos'
                }
              </p>
            </div>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
          <button
            onClick={handleCreateOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </button>
        )}
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por código, proveedor o descripción..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order: any) => {
              const project = projects.find(p => p.id === order.project_id);
              return (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{order.order_code}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
                    <button
                      onClick={() => handleEdit(order)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  {!currentProject && project && (
                    <div className="text-sm">
                      <span className="font-medium">Proyecto:</span> {project.project_name}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Equipos:</span> {order.equipment_count}
                  </div>
                  {order.vendor && (
                    <div className="text-sm">
                      <span className="font-medium">Proveedor:</span> {order.vendor}
                    </div>
                  )}
                  {order.description && (
                    <div className="text-sm">
                      <span className="font-medium">Descripción:</span>
                      <p className="text-gray-600 mt-1">{order.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Creado {new Date(order.created_at).toLocaleDateString()}
                  </div>
                  {order.expected_delivery_date && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Entrega: {new Date(order.expected_delivery_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to={`/orders/${order.id}/delivery-notes`}
                    className="inline-flex items-center justify-center w-full px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Ver Albaranes
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'No se encontraron pedidos con los filtros aplicados.' 
              : currentProject 
                ? 'Este proyecto aún no tiene pedidos.'
                : 'Comienza creando un nuevo pedido.'
            }
          </p>
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && !searchTerm && (
            <div className="mt-6">
              <button
                onClick={handleCreateOrder}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {isModalOpen && (
        <OrderModal
          order={editingOrder}
          projectId={projectId || (currentProject?.id.toString())}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleOrderSaved}
        />
      )}
    </div>
  );
};

export default OrdersPage;