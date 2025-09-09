import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Package, FileText, Edit3, Trash2 } from 'lucide-react';
import { ordersAPI, projectsAPI } from '../services/api';
import OrderModal from '../components/OrderModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';

interface Order {
  id: number;
  project_id: number;
  order_code: string;
  order_number?: string;
  equipment_count: number;
  created_at: string;
  updated_at: string;
  project_name?: string;
}

interface Project {
  id: number;
  ritm_code: string;
  project_name: string;
  client: string;
  datacenter: string;
  delivery_date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, projectsResponse] = await Promise.all([
        ordersAPI.getAll(),
        projectsAPI.getAll()
      ]);
      
      setOrders(ordersResponse);
      setProjects(projectsResponse);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      addNotification('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id.toString(), orderData);
        addNotification('Pedido actualizado correctamente', 'success');
      } else {
        await ordersAPI.create(orderData);
        addNotification('Pedido creado correctamente', 'success');
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingOrder(null);
    } catch (error: any) {
      console.error('Error saving order:', error);
      addNotification('Error al guardar el pedido', 'error');
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (orderId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      try {
        await ordersAPI.delete(orderId.toString());
        addNotification('Pedido eliminado correctamente', 'success');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting order:', error);
        addNotification('Error al eliminar el pedido', 'error');
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !selectedProject || order.project_id.toString() === selectedProject;
    return matchesSearch && matchesProject;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedidos</h1>
        <p className="text-gray-600">Gestiona los pedidos de equipos para cada proyecto</p>
      </div>

      {/* Filtros y acciones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar pedidos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map(project => (
            <option key={project.id} value={project.id.toString()}>
              {project.project_name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código de Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyecto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad de Equipos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map(order => {
              const project = projects.find(p => p.id === order.project_id);
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-blue-500 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {order.order_code || order.order_number}
                        </h3>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {project?.project_name || 'Proyecto no encontrado'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {project?.ritm_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {order.equipment_count} equipos
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedProject ? 'No se encontraron pedidos con los filtros aplicados.' : 'Comienza creando un nuevo pedido.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <OrderModal
          order={editingOrder}
          projects={projects}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
}