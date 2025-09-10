import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, Calendar, Package, Server, Building, Edit3, Filter } from 'lucide-react';
import { equipmentAPI, deliveryNotesAPI, ordersAPI, projectsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import EquipmentModal from '../components/EquipmentModal';

const EquipmentPage = () => {
  const { deliveryNoteId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [equipment, setEquipment] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentDeliveryNote, setCurrentDeliveryNote] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      let equipmentData, deliveryNotesData, ordersData, projectsData;
      
      // Si hay deliveryNoteId específico, cargar solo el equipo de ese albarán
      if (deliveryNoteId) {
        [equipmentData, deliveryNotesData, ordersData, projectsData] = await Promise.all([
          equipmentAPI.getByDeliveryNote(deliveryNoteId),
          deliveryNotesAPI.getAll(),
          ordersAPI.getAll(),
          projectsAPI.getAll()
        ]);
        
        // Encontrar el albarán, pedido y proyecto actuales
        const deliveryNote = deliveryNotesData.find(dn => dn.id === parseInt(deliveryNoteId));
        setCurrentDeliveryNote(deliveryNote || null);
        
        if (deliveryNote) {
          const order = ordersData.find(o => o.id === deliveryNote.order_id);
          setCurrentOrder(order || null);
          
          if (order) {
            const project = projectsData.find(p => p.id === order.project_id);
            setCurrentProject(project || null);
          }
        }
      } else {
        [equipmentData, deliveryNotesData, ordersData, projectsData] = await Promise.all([
          equipmentAPI.getAll(),
          deliveryNotesAPI.getAll(),
          ordersAPI.getAll(),
          projectsAPI.getAll()
        ]);
      }
      
      setEquipment(equipmentData);
      setDeliveryNotes(deliveryNotesData);
      setOrders(ordersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch equipment data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deliveryNoteId]);

  const handleCreateEquipment = (deliveryNoteId: string) => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipmentItem: any) => {
    setEditingEquipment(equipmentItem);
    setIsModalOpen(true);
  };

  const handleEquipmentSaved = () => {
    fetchData();
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-yellow-100 text-yellow-800';
      case 'installed': return 'bg-blue-100 text-blue-800';
      case 'configured': return 'bg-green-100 text-green-800';
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

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
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
        ...(currentProject ? [
          { label: 'Projects', href: '/projects' },
          { label: currentProject.project_name, href: `/projects/${currentProject.id}` }
        ] : []),
        ...(currentOrder ? [
          { label: 'Orders', href: currentProject ? `/projects/${currentProject.id}/orders` : '/orders' }
        ] : []),
        ...(currentDeliveryNote ? [
          { label: 'Delivery Notes', href: currentOrder ? `/orders/${currentOrder.id}/delivery-notes` : '/delivery-notes' }
        ] : []),
        { label: 'Equipment', current: true }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentDeliveryNote 
              ? `Equipos - ${currentDeliveryNote.delivery_code}`
              : 'Inventario de Equipos'
            }
          </h1>
          <p className="mt-1 text-gray-600">
            {currentDeliveryNote 
              ? `Gestiona los equipos del albarán ${currentDeliveryNote.delivery_code}`
              : 'Gestiona todo el equipamiento del datacenter'
            }
          </p>
          {currentProject && (
            <p className="text-sm text-gray-500">
              Proyecto: {currentProject.project_name} - Cliente: {currentProject.client}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Total equipos: {equipment.length}
        </div>
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && deliveryNoteId && (
          <button
            onClick={() => handleCreateEquipment(deliveryNoteId)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Equipo
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por S/N, Asset Tag, Fabricante o Modelo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="received">Recibido</option>
          <option value="installed">Instalado</option>
          <option value="configured">Configurado</option>
          <option value="decommissioned">Dado de Baja</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="Server">Servidor</option>
          <option value="Network">Red</option>
          <option value="Storage">Almacenamiento</option>
          <option value="Security">Seguridad</option>
          <option value="Accessory">Accesorio</option>
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item: any) => {
          const deliveryNote = deliveryNotes.find(dn => dn.id === item.delivery_note_id);
          const order = orders.find(o => o.id === deliveryNote?.order_id);
          const project = projects.find(p => p.id === order?.project_id);

          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Server className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.manufacturer} {item.model}</h3>
                      <p className="text-sm text-gray-600">S/N: {item.serial_number}</p>
                    </div>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
                    <button
                      onClick={() => handleEditEquipment(item)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {item.asset_tag && (
                    <div className="text-sm">
                      <span className="font-medium">Asset Tag:</span> {item.asset_tag}
                    </div>
                  )}
                  {item.category && (
                    <div className="text-sm">
                      <span className="font-medium">Categoría:</span> {item.category}
                    </div>
                  )}
                  {item.location && (
                    <div className="text-sm flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {item.location}
                    </div>
                  )}
                  {item.specifications && (
                    <div className="text-sm">
                      <span className="font-medium">Especificaciones:</span>
                      <p className="text-gray-600 mt-1">{item.specifications}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition_status)}`}>
                      {item.condition_status}
                    </span>
                  </div>
                  
                  {project && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Proyecto:</p>
                      <p className="text-sm font-medium text-gray-900">{project.project_name}</p>
                    </div>
                  )}
                </div>

                {deliveryNote && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Albarán: {deliveryNote.delivery_code} • 
                      Entregado: {new Date(deliveryNote.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Equipment Message */}
      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay equipos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedStatus || selectedCategory 
              ? 'No se encontraron equipos con los filtros aplicados.'
              : 'Los equipos aparecerán aquí cuando se registren en los albaranes.'
            }
          </p>
        </div>
      )}

      {/* Equipment Modal */}
      {isModalOpen && (
        <EquipmentModal
          equipment={editingEquipment}
          deliveryNoteId={deliveryNoteId || editingEquipment?.delivery_note_id || ''}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleEquipmentSaved}
        />
      )}
    </div>
  );
};

export default EquipmentPage;