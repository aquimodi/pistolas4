import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';
import FileUpload from './FileUpload';
import FileViewer from './FileViewer';

interface ProjectModalProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    ritm_code: '',
    project_name: '',
    client: '',
    datacenter: '',
    delivery_date: '',
    teams_folder_url: '',
    excel_file_path: '',
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFetchingServiceNow, setIsFetchingServiceNow] = useState(false);
  const [serviceNowFetched, setServiceNowFetched] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Función para validar formato RITM
  const validateRITMFormat = (ritmCode: string): boolean => {
    return /^RITM\d{4,}$/.test(ritmCode);
  };

  // Función para manejar cambios en el campo RITM
  const handleRITMChange = (value: string) => {
    setFormData(prev => ({ ...prev, ritm_code: value }));
    
    // Si estamos editando un proyecto existente, no hacer fetch automático
    if (project) return;
    
    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Si el formato no es válido, limpiar el estado
    if (!validateRITMFormat(value)) {
      setServiceNowFetched(false);
      return;
    }
    
    // Debounce para evitar llamadas excesivas
    const timer = setTimeout(async () => {
      await fetchServiceNowData(value);
    }, 1000);
    
    setDebounceTimer(timer);
  };

  // Función para obtener datos de ServiceNow
  const fetchServiceNowData = async (ritmCode: string) => {
    if (!validateRITMFormat(ritmCode)) return;
    
    setIsFetchingServiceNow(true);
    setServiceNowFetched(false);
    
    try {
      const response = await projectsAPI.fetchFromServiceNow(ritmCode);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Auto-completar campos con datos de ServiceNow
        setFormData(prev => ({
          ...prev,
          project_name: data.project_name || prev.project_name,
          client: data.client || prev.client,
          datacenter: data.datacenter || prev.datacenter,
          excel_file_path: data.excel_file_path || prev.excel_file_path
        }));
        
        setServiceNowFetched(true);
        
        addNotification({
          type: 'success',
          title: 'Datos Obtenidos',
          message: 'Información del proyecto obtenida desde ServiceNow'
        });
      }
    } catch (error) {
      console.error('Error fetching ServiceNow data:', error);
      
      let errorMessage = 'Error al obtener datos de ServiceNow';
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          errorMessage = 'Este RITM ya existe en el sistema';
        } else if (error.message.includes('No data found')) {
          errorMessage = 'No se encontraron datos para este RITM';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Error de autenticación con ServiceNow';
        }
      }
      
      addNotification({
        type: 'error',
        title: 'Error ServiceNow',
        message: errorMessage
      });
    } finally {
      setIsFetchingServiceNow(false);
    }
  };

  useEffect(() => {
    if (project) {
      setFormData({
        ritm_code: project.ritm_code || '',
        project_name: project.project_name || '',
        client: project.client || '',
        datacenter: project.datacenter || '',
        delivery_date: project.delivery_date ? project.delivery_date.split('T')[0] : '',
        teams_folder_url: project.teams_folder_url || '',
        excel_file_path: project.excel_file_path || '',
        status: project.status || 'active'
      });
      setServiceNowFetched(true); // Existing project, no need to fetch from ServiceNow
    } else {
      setFormData({
        ritm_code: '',
        project_name: '',
        client: '',
        datacenter: '',
        delivery_date: '',
        teams_folder_url: '',
        excel_file_path: '',
        status: 'active'
      });
      setServiceNowFetched(false);
    }
  }, [project]);

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
      if (project) {
        await projectsAPI.update(project.id, formData);
        addNotification({
          type: 'success',
          title: 'Project Updated',
          message: 'Project has been updated successfully'
        });
      } else {
        await projectsAPI.create(formData);
        addNotification({
          type: 'success',
          title: 'Project Created',
          message: 'New project has been created successfully'
        });
      }
      onSave();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save project'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploaded = (filePath: string) => {
    setFormData(prev => ({ ...prev, excel_file_path: filePath }));
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {project ? 'Edit Project' : 'Create New Project'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              Código RITM (ServiceNow) *
              {isFetchingServiceNow && (
                <div className="ml-2 flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-1 text-xs text-blue-600">Obteniendo datos...</span>
                </div>
              )}
              {serviceNowFetched && !project && (
                <div className="ml-2 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="ml-1 text-xs">Datos obtenidos</span>
                </div>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={project ? true : false} // Disable if editing existing project
                className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  project ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  serviceNowFetched && !project ? 'border-green-300 bg-green-50' : ''
                }`}
                value={formData.ritm_code}
                onChange={(e) => handleRITMChange(e.target.value.toUpperCase())}
                placeholder="ej. RITM0012345"
              />
              {!project && validateRITMFormat(formData.ritm_code) && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isFetchingServiceNow ? (
                    <Search className="h-4 w-4 text-blue-500 animate-pulse" />
                  ) : serviceNowFetched ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Search className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            {!project && formData.ritm_code && !validateRITMFormat(formData.ritm_code) && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Formato inválido. Debe comenzar con "RITM" seguido de números.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Proyecto *
              {isFetchingServiceNow && (
                <span className="ml-2 text-xs text-blue-600">(Se completará automáticamente)</span>
              )}
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.project_name}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
              placeholder="Nombre descriptivo del proyecto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
                {isFetchingServiceNow && (
                  <span className="ml-2 text-xs text-blue-600">(Se completará automáticamente)</span>
                )}
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.client}
                onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                placeholder="ej. Telefónica España"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datacenter *
                {isFetchingServiceNow && (
                  <span className="ml-2 text-xs text-blue-600">(Se completará automáticamente)</span>
                )}
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.datacenter}
                onChange={(e) => setFormData(prev => ({ ...prev, datacenter: e.target.value }))}
                placeholder="ej. Madrid DC-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Entrega
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Carpeta Teams
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.teams_folder_url}
              onChange={(e) => setFormData(prev => ({ ...prev, teams_folder_url: e.target.value }))}
              placeholder="https://teams.microsoft.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {`Archivo Excel del Proyecto${isFetchingServiceNow ? ' (Se completará automáticamente si existe)' : ''}`}
            </label>

            {!formData.project_name || formData.project_name.trim().length < 3 ? (
              <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-amber-900">
                  Ingresa el nombre del proyecto primero
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  El nombre del proyecto es necesario para organizar los archivos correctamente
                </p>
              </div>
            ) : formData.excel_file_path ? (
              <div className="space-y-2">
                <FileViewer
                  filePath={formData.excel_file_path}
                  showRemove={true}
                  onRemove={() => setFormData(prev => ({ ...prev, excel_file_path: '' }))}
                />
                <FileUpload
                  uploadType="projects"
                  onFileUploaded={handleFileUploaded}
                  currentFile=""
                  accept=".xlsx,.xls,.csv"
                  maxSize={10}
                  label="Cambiar archivo"
                  projectName={formData.project_name}
                />
              </div>
            ) : (
              <FileUpload
                uploadType="projects"
                onFileUploaded={handleFileUploaded}
                currentFile=""
                accept=".xlsx,.xls,.csv"
                maxSize={10}
                label=""
                projectName={formData.project_name}
              />
            )}

            {serviceNowFetched && !project && formData.excel_file_path && (
              <p className="mt-2 text-xs text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Archivo Excel encontrado en ServiceNow
              </p>
            )}
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
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
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
              disabled={isLoading || isFetchingServiceNow}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {(isLoading || isFetchingServiceNow) && <LoadingSpinner size="small" className="mr-2" />}
              {project ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;