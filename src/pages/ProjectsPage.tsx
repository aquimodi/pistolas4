import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Server, Calendar, Users, FileText } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useVerificationData } from '../hooks/useVerificationData';
import Breadcrumb from '../components/Breadcrumb';
import ProjectModal from '../components/ProjectModal';
import VerificationProgressBar from '../components/VerificationProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const {
    projects,
    isLoading,
    error,
    refetch,
    calculateProjectProgress
  } = useVerificationData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const handleError = () => {
      if (isMounted) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch projects'
        });
      }
    };
    
    if (error && isMounted) {
      handleError();
    }
    
    return () => { isMounted = false; };
  }, [error, addNotification]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleProjectSaved = () => {
    refetch();
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
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
      <Breadcrumb items={[{ label: 'Projects', current: true }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-gray-600">Manage datacenter expansion and equipment projects</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: any) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Server className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{project.ritm_code}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1">{project.project_name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ') || 'active'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso de verificación */}
              <div className="mb-4">
                <VerificationProgressBar
                  label="Progreso de Verificación"
                  {...calculateProjectProgress(project.id)}
                  size="small"
                />
              </div>
              
              <div className="text-gray-600 text-sm mb-4 space-y-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Cliente: {project.client}
                </div>
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  Datacenter: {project.datacenter}
                </div>
                {project.delivery_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Entrega: {new Date(project.delivery_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Creado {new Date(project.created_at).toLocaleDateString()}
                </div>
                {project.teams_folder_url && (
                  <a 
                    href={project.teams_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Teams
                  </a>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/projects/${project.id}/orders`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Ver Pedidos
                </Link>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <button
                    onClick={() => handleEditProject(project)}
                    className="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <div className="mt-6">
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Project Modal */}
      {isModalOpen && (
        <ProjectModal
          project={editingProject}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleProjectSaved}
        />
      )}
    </div>
  );
};

export default ProjectsPage;