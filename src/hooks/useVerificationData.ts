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

      setData({
        projects: projectsData,
        orders: ordersData,
        deliveryNotes: deliveryNotesData,
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