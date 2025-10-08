import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { deliveryNotesAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import FileUpload from './FileUpload';
import FileViewer from './FileViewer';

interface DeliveryNoteModalProps {
  deliveryNote: any;
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({ 
  deliveryNote, 
  orderId, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    delivery_code: '',
    estimated_equipment_count: 0,
    delivery_date: '',
    carrier: '',
    tracking_number: '',
    attached_document_path: '',
    notes: '',
    status: 'received'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  useEffect(() => {
    if (deliveryNote) {
      setFormData({
        delivery_code: deliveryNote.delivery_code || '',
        estimated_equipment_count: deliveryNote.estimated_equipment_count || 0,
        delivery_date: deliveryNote.delivery_date ? deliveryNote.delivery_date.split('T')[0] : '',
        carrier: deliveryNote.carrier || '',
        tracking_number: deliveryNote.tracking_number || '',
        attached_document_path: deliveryNote.attached_document_path || '',
        notes: deliveryNote.notes || '',
        status: deliveryNote.status || 'received'
      });
    } else {
      // Auto-generate delivery code for new delivery notes
      const today = new Date();
      const year = today.getFullYear();
      const orderNum = Math.floor(Math.random() * 999) + 1;
      const defaultCode = `ALB-${year}-${orderNum.toString().padStart(3, '0')}`;
      
      setFormData({
        delivery_code: defaultCode,
        estimated_equipment_count: 0,
        delivery_date: today.toISOString().split('T')[0],
        carrier: '',
        tracking_number: '',
        attached_document_path: '',
        notes: '',
        status: 'received'
      });
    }
  }, [deliveryNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFileUploading) {
      addNotification({
        type: 'warning',
        title: 'Wait for Upload',
        message: 'Please wait for file upload to complete'
      });
      return;
    }

    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        order_id: orderId,
        delivery_date: formData.delivery_date || null,
        estimated_equipment_count: parseInt(formData.estimated_equipment_count.toString()) || 0
      };

      if (deliveryNote) {
        await deliveryNotesAPI.update(deliveryNote.id, dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Albarán Actualizado',
          message: 'El albarán ha sido actualizado correctamente'
        });
      } else {
        await deliveryNotesAPI.create(dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Albarán Creado',
          message: 'Nuevo albarán ha sido creado correctamente'
        });
      }
      onSave();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al guardar el albarán'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploaded = (filePath: string) => {
    setFormData(prev => ({ ...prev, attached_document_path: filePath }));
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {deliveryNote ? 'Editar Albarán' : 'Crear Nuevo Albarán'}
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
              Código Albarán *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.delivery_code}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_code: e.target.value }))}
              placeholder="ej. ALB-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Equipos Estimados *
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.estimated_equipment_count}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_equipment_count: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Entrega *
            </label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transportista
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.carrier}
                onChange={(e) => setFormData(prev => ({ ...prev, carrier: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="DHL">DHL</option>
                <option value="Correos">Correos</option>
                <option value="MRW">MRW</option>
                <option value="SEUR">SEUR</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Seguimiento
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.tracking_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                placeholder="ej. FX123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documento del Albarán
            </label>

            {formData.attached_document_path ? (
              <div className="space-y-2">
                <FileViewer
                  filePath={formData.attached_document_path}
                  showRemove={true}
                  onRemove={() => setFormData(prev => ({ ...prev, attached_document_path: '' }))}
                />
                <FileUpload
                  uploadType="delivery_notes"
                  onFileUploaded={handleFileUploaded}
                  currentFile=""
                  accept=".pdf,.docx,.doc,.xlsx,.xls"
                  maxSize={10}
                  label="Cambiar archivo"
                />
              </div>
            ) : (
              <FileUpload
                uploadType="delivery_notes"
                onFileUploaded={handleFileUploaded}
                currentFile=""
                accept=".pdf,.docx,.doc,.xlsx,.xls"
                maxSize={10}
                label=""
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales sobre la entrega..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="received">Recibido</option>
              <option value="processing">Procesando</option>
              <option value="completed">Completado</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLoading && <LoadingSpinner size="small" className="mr-2" />}
              {deliveryNote ? 'Actualizar' : 'Crear'} Albarán
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryNoteModal;