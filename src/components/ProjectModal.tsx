import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from './LoadingSpinner';

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
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código RITM *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.ritm_code}
              onChange={(e) => setFormData(prev => ({ ...prev, ritm_code: e.target.value }))}
              placeholder="ej. RITM0012345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.project_name}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
              placeholder="ej. Expansión Datacenter Fase 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
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
              URL Carpeta Teams
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.teams_folder_url}
              onChange={(e) => setFormData(prev => ({ ...prev, teams_folder_url: e.target.value }))}
              placeholder="https://teams.microsoft.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo Excel
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.excel_file_path}
              onChange={(e) => setFormData(prev => ({ ...prev, excel_file_path: e.target.value }))}
              placeholder="/uploads/projects/RITM0012345_equipment_list.xlsx"
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
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLoading && <LoadingSpinner size="small" className="mr-2" />}
              {project ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;