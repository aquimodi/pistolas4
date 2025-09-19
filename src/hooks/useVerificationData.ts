import { useState, useEffect } from 'react';
import { projectsAPI, ordersAPI, deliveryNotesAPI, equipmentAPI } from '../services/api';

interface VerificationData {
  projects: any[];
  orders: any[];
  deliveryNotes: any[];
  equipment: any[];
  isLoading: boolean;
  error: string | null;
}

interface ProgressData {
  verified: number;
  total: number;
  percentage: number;
}

export function useVerificationData() {
  const [data, setData] = useState<VerificationData>({
    projects: [],
    orders: [],
    deliveryNotes: [],
    equipment: [],
    isLoading: true,
    error: null
  });

  const fetchAllData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [projectsData, ordersData, deliveryNotesData, equipmentData] = await Promise.all([
        projectsAPI.getAll(),
        ordersAPI.getAll(),
        deliveryNotesAPI.getAll(),
        equipmentAPI.getAll()
      ]);

      // Actualizar estados en cascada basado en verificación
      const updatedProjects = await updateProjectStatuses(projectsData, ordersData, deliveryNotesData, equipmentData);
      const updatedOrders = await updateOrderStatuses(ordersData, deliveryNotesData, equipmentData);
      const updatedDeliveryNotes = await updateDeliveryNoteStatuses(deliveryNotesData, equipmentData);

      setData({
        projects: updatedProjects,
        orders: updatedOrders,
        deliveryNotes: updatedDeliveryNotes,
        equipment: equipmentData,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error loading data'
      }));
    }
  };

  // Función para actualizar estados de albaranes basado en equipos verificados
  const updateDeliveryNoteStatuses = async (deliveryNotes: any[], equipment: any[]) => {
    const updatedDeliveryNotes = [...deliveryNotes];
    
    for (const deliveryNote of updatedDeliveryNotes) {
      const deliveryNoteEquipment = equipment.filter(eq => eq.delivery_note_id === deliveryNote.id);
      const verifiedCount = deliveryNoteEquipment.filter(eq => eq.is_verified).length;
      const totalCount = deliveryNoteEquipment.length;
      
      let newStatus = deliveryNote.status;
      if (totalCount > 0 && verifiedCount === totalCount) {
        newStatus = 'completed';
      } else if (verifiedCount > 0) {
        newStatus = 'processing';
      } else {
        newStatus = 'pending_receive';
      }
      
      if (newStatus !== deliveryNote.status) {
        try {
          await deliveryNotesAPI.update(deliveryNote.id, { ...deliveryNote, status: newStatus });
          deliveryNote.status = newStatus;
        } catch (error) {
          console.warn('Failed to update delivery note status:', error);
        }
      }
    }
    
    return updatedDeliveryNotes;
  };

  // Función para actualizar estados de pedidos basado en albaranes completados
  const updateOrderStatuses = async (orders: any[], deliveryNotes: any[], equipment: any[]) => {
    const updatedOrders = [...orders];
    
    for (const order of updatedOrders) {
      const orderDeliveryNotes = deliveryNotes.filter(dn => dn.order_id === order.id);
      const completedDeliveryNotes = orderDeliveryNotes.filter(dn => dn.status === 'completed');
      
      let newStatus = order.status;
      if (orderDeliveryNotes.length > 0 && completedDeliveryNotes.length === orderDeliveryNotes.length) {
        newStatus = 'completed';
      } else if (completedDeliveryNotes.length > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'pending_receive';
      }
      
      if (newStatus !== order.status) {
        try {
          await ordersAPI.update(order.id, { ...order, status: newStatus });
          order.status = newStatus;
        } catch (error) {
          console.warn('Failed to update order status:', error);
        }
      }
    }
    
    return updatedOrders;
  };

  // Función para actualizar estados de proyectos basado en pedidos completados
  const updateProjectStatuses = async (projects: any[], orders: any[], deliveryNotes: any[], equipment: any[]) => {
    const updatedProjects = [...projects];
    
    for (const project of updatedProjects) {
      const projectOrders = orders.filter(o => o.project_id === project.id);
      const completedOrders = projectOrders.filter(o => o.status === 'completed');
      
      let newStatus = project.status;
      if (projectOrders.length > 0 && completedOrders.length === projectOrders.length) {
        newStatus = 'completed';
      } else if (completedOrders.length > 0) {
        newStatus = 'active';
      } else {
        newStatus = 'pending_receive';
      }
      
      if (newStatus !== project.status && project.status !== 'on_hold' && project.status !== 'cancelled') {
        try {
          await projectsAPI.update(project.id, { ...project, status: newStatus });
          project.status = newStatus;
        } catch (error) {
          console.warn('Failed to update project status:', error);
        }
      }
    }
    
    return updatedProjects;
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Calcular progreso de un albarán específico
  const calculateDeliveryNoteProgress = (deliveryNoteId: number): ProgressData => {
    const deliveryNoteEquipment = data.equipment.filter(eq => eq.delivery_note_id === deliveryNoteId);
    const verified = deliveryNoteEquipment.filter(eq => eq.is_verified).length;
    const total = deliveryNoteEquipment.length;
    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { verified, total, percentage };
  };

  // Calcular progreso de un pedido específico
  const calculateOrderProgress = (orderId: number): ProgressData => {
    const orderDeliveryNotes = data.deliveryNotes.filter(dn => dn.order_id === orderId);
    let totalVerified = 0;
    let totalEquipment = 0;

    orderDeliveryNotes.forEach(deliveryNote => {
      const deliveryNoteEquipment = data.equipment.filter(eq => eq.delivery_note_id === deliveryNote.id);
      totalEquipment += deliveryNoteEquipment.length;
      totalVerified += deliveryNoteEquipment.filter(eq => eq.is_verified).length;
    });

    const percentage = totalEquipment > 0 ? Math.round((totalVerified / totalEquipment) * 100) : 0;

    return {
      verified: totalVerified,
      total: totalEquipment,
      percentage
    };
  };

  // Calcular progreso de un proyecto específico
  const calculateProjectProgress = (projectId: number): ProgressData => {
    const projectOrders = data.orders.filter(order => order.project_id === projectId);
    let totalVerified = 0;
    let totalEquipment = 0;

    projectOrders.forEach(order => {
      const orderProgress = calculateOrderProgress(order.id);
      totalVerified += orderProgress.verified;
      totalEquipment += orderProgress.total;
    });

    const percentage = totalEquipment > 0 ? Math.round((totalVerified / totalEquipment) * 100) : 0;

    return {
      verified: totalVerified,
      total: totalEquipment,
      percentage
    };
  };

  // Obtener equipos por albarán
  const getEquipmentByDeliveryNote = (deliveryNoteId: number) => {
    return data.equipment.filter(eq => eq.delivery_note_id === deliveryNoteId);
  };

  // Obtener albaranes por pedido
  const getDeliveryNotesByOrder = (orderId: number) => {
    return data.deliveryNotes.filter(dn => dn.order_id === orderId);
  };

  // Obtener pedidos por proyecto
  const getOrdersByProject = (projectId: number) => {
    return data.orders.filter(order => order.project_id === projectId);
  };

  return {
    ...data,
    refetch: fetchAllData,
    calculateProjectProgress,
    calculateOrderProgress,
    calculateDeliveryNoteProgress,
    getEquipmentByDeliveryNote,
    getDeliveryNotesByOrder,
    getOrdersByProject
  };
}