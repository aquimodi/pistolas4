import React, { useState, useEffect } from 'react';
import { Activity, Server, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { monitoringAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import Breadcrumb from '../components/Breadcrumb';

const MonitoringPage = () => {
  const { addNotification } = useNotification();
  const [metrics, setMetrics] = useState({
    requests_per_minute: 0,
    average_response_time: 0,
    error_rate: 0,
    active_users: 0,
    database_connections: 0,
    memory_usage: 0
  });
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsData, statusData, logsData] = await Promise.all([
        monitoringAPI.getMetrics(),
        monitoringAPI.getStatus(),
        monitoringAPI.getLogs({ limit: 50 })
      ]);

      setMetrics(metricsData);
      setSystemStatus(statusData);
      setLogs(logsData);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch monitoring data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return AlertTriangle;
      case 'warn': return AlertTriangle;
      case 'info': return CheckCircle;
      default: return CheckCircle;
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
      <Breadcrumb items={[{ label: 'System Monitoring', current: true }]} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="mt-1 text-gray-600">Real-time system performance and application logs</p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Server className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">System Status</h2>
          <div className="ml-auto flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
        </div>
        
        {systemStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.floor(systemStatus.uptime / 3600)}h
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(systemStatus.memory.heapUsed / 1024 / 1024)}MB
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.version}
              </div>
              <div className="text-sm text-gray-600">Node Version</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.environment}
              </div>
              <div className="text-sm text-gray-600">Environment</div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Activity className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Performance Metrics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{metrics.requests_per_minute}</div>
            <div className="text-sm text-blue-700">Requests/Min</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{Math.round(metrics.average_response_time)}ms</div>
            <div className="text-sm text-green-700">Avg Response</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-xl font-bold text-red-600">{metrics.error_rate.toFixed(2)}%</div>
            <div className="text-sm text-red-700">Error Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{metrics.active_users}</div>
            <div className="text-sm text-purple-700">Active Users</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-xl font-bold text-indigo-600">{metrics.database_connections}</div>
            <div className="text-sm text-indigo-700">DB Connections</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-xl font-bold text-yellow-600">{Math.round(metrics.memory_usage)}MB</div>
            <div className="text-sm text-yellow-700">Memory Usage</div>
          </div>
        </div>
      </div>

      {/* Application Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Application Logs</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {logs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {logs.map((log: any, index) => {
                const Icon = getLogLevelIcon(log.level);
                return (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        log.level === 'error' ? 'text-red-500' :
                        log.level === 'warn' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-900">{log.message}</p>
                        {log.ip && (
                          <p className="mt-1 text-xs text-gray-500">IP: {log.ip}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs available</h3>
              <p className="mt-1 text-sm text-gray-500">Application logs will appear here as they are generated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;