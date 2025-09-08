import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Package, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';
import { projectsAPI, ordersAPI, equipmentAPI, monitoringAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    projects: 0,
    orders: 0,
    equipment: 0,
    pending_deliveries: 0
  });
  const [metrics, setMetrics] = useState({
    requests_per_minute: 0,
    average_response_time: 0,
    error_rate: 0,
    active_users: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Evitar peticiones si ya está cargando
      if (isLoading) return;
      
      try {
        setIsLoading(true);
        const [projects, orders, equipment, systemMetrics] = await Promise.all([
          projectsAPI.getAll(),
          ordersAPI.getAll(),
          equipmentAPI.getAll(),
          monitoringAPI.getMetrics()
        ]);

        setStats({
          projects: projects.length,
          orders: orders.length,
          equipment: equipment.length,
          pending_deliveries: orders.filter((o: any) => o.status === 'pending').length
        });

        setMetrics(systemMetrics);

        // Mock recent activity
        setRecentActivity([
          { id: 1, action: 'Equipment received', item: 'PowerEdge R750 (SN: DL001234)', time: '2 minutes ago', type: 'success' },
          { id: 2, action: 'Order created', item: 'ORD-2024-003 from Cisco', time: '15 minutes ago', type: 'info' },
          { id: 3, action: 'Project updated', item: 'DC Expansion Phase 1', time: '1 hour ago', type: 'info' },
          { id: 4, action: 'Delivery delayed', item: 'DN-2024-005', time: '2 hours ago', type: 'warning' }
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Solo cargar datos una vez al montar el componente
    let mounted = true;
    if (mounted) {
      fetchDashboardData();
    }
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(() => {
      if (mounted) {
        monitoringAPI.getMetrics().then(setMetrics).catch(console.error);
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const statCards = [
    { name: 'Active Projects', value: stats.projects, icon: Server, color: 'blue', href: '/projects' },
    { name: 'Total Orders', value: stats.orders, icon: FileText, color: 'green', href: '/equipment' },
    { name: 'Equipment Items', value: stats.equipment, icon: Package, color: 'purple', href: '/equipment' },
    { name: 'Pending Deliveries', value: stats.pending_deliveries, icon: Clock, color: 'orange', href: '/equipment' }
  ];

  const metricCards = [
    { name: 'Requests/Min', value: metrics.requests_per_minute, unit: '', color: 'blue' },
    { name: 'Avg Response', value: Math.round(metrics.average_response_time), unit: 'ms', color: 'green' },
    { name: 'Error Rate', value: metrics.error_rate.toFixed(2), unit: '%', color: 'red' },
    { name: 'Active Users', value: metrics.active_users, unit: '', color: 'purple' }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome to the Datacenter Equipment Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                  stat.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                  stat.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                  'bg-orange-100 group-hover:bg-orange-200'
                } transition-colors`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">{stat.name}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">System Performance</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricCards.map((metric) => (
              <div key={metric.name} className="text-center">
                <div className={`text-2xl font-bold text-${metric.color}-600`}>
                  {metric.value}{metric.unit}
                </div>
                <div className="text-sm text-gray-600">{metric.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.item}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link 
                to="/projects"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Server className="h-5 w-5 text-blue-600 mr-3" />
                Manage Projects
              </Link>
              <Link 
                to="/equipment"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Package className="h-5 w-5 text-green-600 mr-3" />
                View Equipment
              </Link>
              <Link 
                to="/monitoring"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                System Monitoring
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;