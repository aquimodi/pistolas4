import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { equipmentAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import FileUpload from './FileUpload';

interface EquipmentModalProps {
  equipment: any;
  deliveryNoteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ 
  equipment, 
  deliveryNoteId, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    serial_number: '',
    asset_tag: '',
    manufacturer: '',
    model: '',
    category: '',
    specifications: '',
    condition_status: 'new',
    location: '',
    status: 'received',
    verification_photo_path: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        serial_number: equipment.serial_number || '',
        asset_tag: equipment.asset_tag || '',
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        category: equipment.category || '',
        specifications: equipment.specifications || '',
        condition_status: equipment.condition_status || 'new',
        location: equipment.location || '',
        status: equipment.status || 'received',
        verification_photo_path: equipment.verification_photo_path || ''
      });
    } else {
      setFormData({
        serial_number: '',
        asset_tag: '',
        manufacturer: '',
        model: '',
        category: '',
        specifications: '',
        condition_status: 'new',
        location: '',
        status: '',
        verification_photo_path: ''
      });
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        delivery_note_id: deliveryNoteId
      };

      if (equipment) {
        await equipmentAPI.update(equipment.id, dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Equipo Actualizado',
          message: 'El equipo ha sido actualizado correctamente'
        });
      } else {
        await equipmentAPI.create(dataToSubmit);
        addNotification({
          type: 'success',
          title: 'Equipo Creado',
          message: 'Nuevo equipo ha sido registrado correctamente'
        });
      }
      onSave();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al guardar el equipo'
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
            {equipment ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Serie *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                placeholder="ej. DL001234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Tag
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.asset_tag}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
                placeholder="ej. DC-SRV-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fabricante *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.manufacturer}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="Dell">Dell</option>
                <option value="HPE">HPE</option>
                <option value="Cisco">Cisco</option>
                <option value="Lenovo">Lenovo</option>
                <option value="NetApp">NetApp</option>
                <option value="VMware">VMware</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="ej. PowerEdge R750"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              <option value="Server">Servidor</option>
              <option value="Network">Red</option>
              <option value="Storage">Almacenamiento</option>
              <option value="Security">Seguridad</option>
              <option value="Accessory">Accesorio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especificaciones
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.specifications}
              onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
              placeholder="ej. Intel Xeon Gold 6338, 64GB RAM, 2x 960GB SSD"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condición
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.condition_status}
                onChange={(e) => setFormData(prev => ({ ...prev, condition_status: e.target.value }))}
              >
                <option value="new">Nuevo</option>
                <option value="good">Bueno</option>
                <option value="fair">Regular</option>
                <option value="poor">Malo</option>
              </select>
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
                <option value="installed">Instalado</option>
                <option value="configured">Configurado</option>
                <option value="decommissioned">Dado de Baja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="ej. Madrid DC-1 Rack A1-U01"
            />
          </div>

          <div>
            <FileUpload
              uploadType="equipment"
              onFileUploaded={(path) => setFormData(prev => ({ ...prev, verification_photo_path: path }))}
              currentFile={formData.verification_photo_path}
              accept="image/*"
            />
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
              {equipment ? 'Actualizar' : 'Registrar'} Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentModal;