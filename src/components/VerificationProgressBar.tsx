import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface VerificationProgressBarProps {
  label: string;
  verified: number;
  total: number;
  percentage: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({
  label,
  verified,
  total,
  percentage,
  size = 'medium',
  showDetails = true,
  className = ''
}) => {
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getProgressIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage > 0) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  };

  const getProgressText = (percentage: number) => {
    if (percentage === 100) return 'Completado';
    if (percentage > 0) return 'En progreso';
    return 'Pendiente';
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return {
          container: 'space-y-1',
          text: 'text-xs',
          bar: 'h-1.5',
          details: 'text-xs'
        };
      case 'large':
        return {
          container: 'space-y-3',
          text: 'text-base font-medium',
          bar: 'h-3',
          details: 'text-sm'
        };
      default: // medium
        return {
          container: 'space-y-2',
          text: 'text-sm',
          bar: 'h-2',
          details: 'text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses(size);
  const progressColor = getProgressColor(percentage);

  if (total === 0) {
    return (
      <div className={`${sizeClasses.container} ${className}`}>
        <div className="flex items-center justify-between">
          <span className={`${sizeClasses.text} text-gray-600`}>{label}</span>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span className={`${sizeClasses.details} text-gray-500`}>Sin equipos</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses.container} ${className}`}>
      {/* Header con label y porcentaje */}
      <div className="flex items-center justify-between">
        <span className={`${sizeClasses.text} text-gray-700`}>{label}</span>
        <div className="flex items-center space-x-2">
          {getProgressIcon(percentage)}
          <span className={`${sizeClasses.text} font-medium text-gray-900`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses.bar} ${progressColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Detalles adicionales */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <span className={`${sizeClasses.details} text-gray-600`}>
            {verified} de {total} equipos verificados
          </span>
          <span className={`${sizeClasses.details} font-medium ${
            percentage === 100 ? 'text-green-600' :
            percentage > 0 ? 'text-yellow-600' : 'text-gray-500'
          }`}>
            {getProgressText(percentage)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VerificationProgressBar;