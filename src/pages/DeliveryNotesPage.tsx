import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, Package, FileText, Edit3, Trash2, Building } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useVerificationData } from '../hooks/useVerificationData';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import VerificationProgressBar from '../components/VerificationProgressBar';
import DeliveryNoteModal from '../components/DeliveryNoteModal';
import FileViewer from '../components/FileViewer';

const DeliveryNotesPage = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const {
    deliveryNotes,
    orders,
    projects,
    isLoading,
    error,
    refetch,
    calculateDeliveryNoteProgress,
    getDeliveryNotesByOrder
  } = useVerificationData();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeliveryNote, setEditingDeliveryNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');

  useEffect(() => {
    if (!isLoading && orderId) {
      const order = orders.find(o => o.id === parseInt(orderId));
      setCurrentOrder(order || null);
    }
  }, [orderId, orders, isLoading]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar los albaranes de entrega'
      });
    }
  }, [error, addNotification]);

  const handleCreateDeliveryNote = (orderId: string) => {
    setEditingDeliveryNote(null);
    setSelectedOrder(orderId);
    setIsModalOpen(true);
  };

  const handleEditDeliveryNote = (deliveryNote: any) => {
    setEditingDeliveryNote(deliveryNote);
    setSelectedOrder(deliveryNote.order_id);
    setIsModalOpen(true);
  };

  const handleDeliveryNoteSaved = () => {
    refetch();
    setIsModalOpen(false);
    setEditingDeliveryNote(null);
    setSelectedOrder('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar albaranes por orden si se especifica un orderId
  const relevantDeliveryNotes = orderId 
    ? getDeliveryNotesByOrder(parseInt(orderId))
    : deliveryNotes;

  const filteredDeliveryNotes = relevantDeliveryNotes.filter(note => {
    const matchesSearch = 
      note.delivery_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      <Breadcrumb items={[{ label: 'Delivery Notes', current: true }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentOrder ? `Albaranes - ${currentOrder.order_code}` : 'Todos los Albaranes'}
          </h1>
          <p className="mt-1 text-gray-600">
            {currentOrder 
              ? `Gestiona los albaranes del pedido ${currentOrder.order_code}`
              : 'Gestiona todos los albaranes de entrega de equipos'
            }
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por código, transportista o tracking..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders and Delivery Notes */}
      <div className="space-y-6">
        {(currentOrder ? [currentOrder] : orders).map((order: any) => {
          const orderDeliveryNotes = orderId 
            ? filteredDeliveryNotes 
            : filteredDeliveryNotes.filter(note => note.order_id === order.id);
          const project = projects.find(p => p.id === order.project_id);
          
          // Si estamos en vista global, solo mostrar órdenes que tienen albaranes
          if (!currentOrder && orderDeliveryNotes.length === 0) {
            return null;
          }

          return (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">{order.order_code}</h2>
                      <p className="text-gray-600">{project?.project_name} - {project?.client}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Building className="h-4 w-4 mr-1" />
                        {project?.datacenter} | Equipos esperados: {order.equipment_count}
                      </div>
                    </div>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
                    <button
                      onClick={() => handleCreateDeliveryNote(order.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nuevo Albarán
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="p-6">
                {orderDeliveryNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orderDeliveryNotes.map((note: any) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-900">{note.delivery_code}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                            {note.status}
                          </span>
                        </div>
                        
                        {/* Barra de progreso de verificación */}
                        <div className="mb-3">
                          <VerificationProgressBar
                            label="Verificación"
                            {...calculateDeliveryNoteProgress(note.id)}
                            size="small"
                            showDetails={false}
                          />
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Equipos: {note.estimated_equipment_count}</p>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(note.delivery_date).toLocaleDateString()}
                          </div>
                          {note.carrier && (
                            <p>Transportista: {note.carrier}</p>
                          )}
                          {note.tracking_number && (
                            <p className="text-xs">Tracking: {note.tracking_number}</p>
                          )}
                        </div>

                        {note.attached_document_path && (
                          <div className="mt-3">
                            <FileViewer
                              filePath={note.attached_document_path}
                              showRemove={false}
                              className="text-xs"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3">
                          <div className="flex space-x-2">
                            <Link
                              to={`/delivery-notes/${note.id}/equipment`}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ver Equipos →
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
                              <Link
                                to={`/delivery-notes/${note.id}/validate`}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Validar →
                              </Link>
                            )}
                          </div>
                            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator') && (
                              <button
                                onClick={() => handleEditDeliveryNote(note)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No hay albaranes para este pedido</p>
                    <p className="text-sm">Haz clic en "Nuevo Albarán" para crear uno</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(currentOrder ? [currentOrder] : orders).length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
          <p className="mt-1 text-sm text-gray-500">Primero debe crear pedidos para poder generar albaranes.</p>
        </div>
      )}

      {/* Delivery Note Modal */}
      {isModalOpen && (() => {
        const order = orders.find(o => o.id === parseInt(selectedOrder));
        const project = order ? projects.find(p => p.id === order.project_id) : null;
        const projectName = project?.project_name || 'Unknown_Project';

        return (
          <DeliveryNoteModal
            deliveryNote={editingDeliveryNote}
            orderId={selectedOrder}
            projectName={projectName}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleDeliveryNoteSaved}
          />
        );
      })()}
    </div>
  );
};

export default DeliveryNotesPage;