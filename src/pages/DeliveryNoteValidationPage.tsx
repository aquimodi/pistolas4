import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCcw,
  AlertTriangle,
  Package,
  FileText,
  Server,
  Building,
  ClipboardCheck,
  ClipboardX
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useVerificationData } from '../hooks/useVerificationData';
import LoadingSpinner from '../components/LoadingSpinner';
import Breadcrumb from '../components/Breadcrumb';
import VerificationProgressBar from '../components/VerificationProgressBar';
import CameraCaptureButton from '../components/CameraCaptureButton';

const DeliveryNoteValidationPage = () => {
  const { deliveryNoteId } = useParams();
  const { addNotification } = useNotification();
  const {
    deliveryNotes,
    equipment,
    isLoading,
    error,
    refetch,
    calculateDeliveryNoteProgress,
    getEquipmentByDeliveryNote
  } = useVerificationData();
  const [serialNumberInput, setSerialNumberInput] = useState('');
  const [verificationPhoto, setVerificationPhoto] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtener el albarán actual y sus equipos
  const deliveryNote = deliveryNotes.find(dn => dn.id === parseInt(deliveryNoteId!));
  const deliveryNoteEquipment = getEquipmentByDeliveryNote(parseInt(deliveryNoteId!));

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar los datos del albarán o equipos.'
      });
    }
  }, [error, addNotification]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSerialNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumberInput.trim()) return;

    const snToVerify = serialNumberInput.trim();
    setSerialNumberInput(''); // Clear input immediately

    // Verificar que tenemos al menos el número de serie
    if (!snToVerify) {
      addNotification({
        type: 'warning',
        title: 'Número de Serie Requerido',
        message: 'Por favor, introduce el número de serie del equipo.'
      });
      return;
    }

    const itemToVerify = equipment.find(
      (item) => item.serial_number.toLowerCase() === snToVerify.toLowerCase()
    );

    if (!itemToVerify) {
      addNotification({
        type: 'error',
        title: 'Equipo No Encontrado',
        message: `El número de serie "${snToVerify}" no pertenece a este albarán.`
      });
      return;
    }

    if (itemToVerify.is_verified) {
      addNotification({
        type: 'warning',
        title: 'Equipo Ya Verificado',
        message: `El equipo con S/N "${snToVerify}" ya ha sido verificado.`
      });
      return;
    }

    try {
      let photoPath = '';
      
      // First upload the photo
      if (verificationPhoto) {
        const formData = new FormData();
        formData.append('file', verificationPhoto);

        const uploadResponse = await fetch('/api/upload/equipment', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload verification photo');
        }

        const uploadResult = await uploadResponse.json();
        photoPath = uploadResult.filePath;
      }

      // Then verify with the uploaded photo path
      await equipmentAPI.verify(snToVerify, parseInt(deliveryNoteId!), photoPath);
      
      addNotification({
        type: 'success',
        title: 'Equipo Verificado',
        message: `El equipo con S/N "${snToVerify}" ha sido verificado correctamente${verificationPhoto ? ' con foto de documentación' : ''}.`
      });
      // Refresh data to show updated status
      refetch();
      setVerificationPhoto(null); // Clear photo after successful verification
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error de Verificación',
        message: error instanceof Error ? error.message : 'Error al verificar el equipo.'
      });
    }
  };

  const handleUnverify = async (equipmentId: number) => {
    try {
      await equipmentAPI.unverify(equipmentId.toString());
      addNotification({
        type: 'info',
        title: 'Verificación Deshecha',
        message: 'La verificación del equipo ha sido deshecha.'
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al deshacer la verificación.'
      });
    }
  };

  const handlePhotoCapture = (photoFile: File) => {
    setVerificationPhoto(photoFile);
    addNotification({
      type: 'success',
      title: 'Foto Capturada',
      message: 'Foto del equipo capturada correctamente. Ahora ingresa el número de serie.'
    });
  };

  const verifiedCount = deliveryNoteEquipment.filter((item) => item.is_verified).length;
  const totalEquipment = deliveryNoteEquipment.length;
  const allVerified = totalEquipment > 0 && verifiedCount === totalEquipment;
  const progressData = calculateDeliveryNoteProgress(parseInt(deliveryNoteId!));

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Albarán no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">No se pudo cargar la información del albarán.</p>
        <div className="mt-6">
          <Link
            to="/delivery-notes"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Albaranes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Delivery Notes', href: '/delivery-notes' },
        { label: deliveryNote.delivery_code, href: `/delivery-notes/${deliveryNote.id}/equipment` },
        { label: 'Validation', current: true }
      ]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Validación de Equipos - {deliveryNote.delivery_code}
          </h1>
          <p className="mt-1 text-gray-600">
            Verifica los equipos recibidos para el albarán: {deliveryNote.delivery_code}
          </p>
          <p className="text-sm text-gray-500">
            Pedido: {deliveryNote.order_code} | Proyecto: {deliveryNote.project_name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Equipos Verificados:</p>
            <p className="text-xl font-bold text-blue-600">
              {verifiedCount} / {totalEquipment}
            </p>
          </div>
          {/* Barra de progreso principal */}
          <div className="min-w-64">
            <VerificationProgressBar
              label="Progreso Total"
              {...progressData}
              size="medium"
            />
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Refresh List"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Verification Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Camera Capture Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              1. Capturar Foto del Equipo
            </h3>
            <CameraCaptureButton 
              onPhotoCapture={handlePhotoCapture}
              className="w-full"
            />
            {verificationPhoto && (
              <div className="mt-2 flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Foto capturada correctamente
              </div>
            )}
          </div>
          
          {/* Serial Number Input Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              2. Ingresar Número de Serie (Requerido)
            </h3>
            <form onSubmit={handleSerialNumberSubmit} className="flex items-center space-x-4">
              <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Escanear o introducir número de serie..."
              value={serialNumberInput}
              onChange={(e) => setSerialNumberInput(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!serialNumberInput.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Verificar
          </button>
        </form>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Opciones de Verificación:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Solo Número de Serie:</strong> Introduce el S/N y verifica sin foto</li>
              <li>• <strong>Número de Serie + Foto:</strong> Documentación completa con evidencia visual</li>
              <li>• <strong>Solo Foto:</strong> Próximamente disponible con OCR automático</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Lista de Equipos en Albarán</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {deliveryNoteEquipment.length === 0 ? (
            <li className="p-6 text-center text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              No hay equipos registrados para este albarán.
              <p className="mt-2 text-sm">Por favor, añade equipos desde la página de "Ver Equipos" de este albarán.</p>
            </li>
          ) : (
            deliveryNoteEquipment.map((item) => (
              <li key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.manufacturer} {item.model}
                  </p>
                  <p className="text-sm text-gray-600">S/N: {item.serial_number}</p>
                  {item.asset_tag && (
                    <p className="text-xs text-gray-500">Asset Tag: {item.asset_tag}</p>
                  )}
                  {item.verification_photo_path && (
                    <a href={item.verification_photo_path} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                      Ver Foto de Verificación
                    </a>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {item.is_verified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" /> Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-4 w-4 mr-1" /> Pendiente
                    </span>
                  )}
                  {item.is_verified && (
                    <button
                      onClick={() => handleUnverify(item.id)}
                      className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                      title="Deshacer verificación"
                    >
                      <ClipboardX className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {allVerified && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                ¡Todos los equipos de este albarán han sido verificados!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteValidationPage;
