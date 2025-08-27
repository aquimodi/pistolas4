import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = getIcon(notification.type);
        const colorClasses = getColorClasses(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`p-4 rounded-md border shadow-lg ${colorClasses} transform transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-start">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">{notification.title}</h3>
                {notification.message && (
                  <p className="mt-1 text-sm opacity-90">{notification.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer;