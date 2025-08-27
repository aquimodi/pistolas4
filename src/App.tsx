import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import OrdersPage from './pages/OrdersPage';
import DeliveryNotesPage from './pages/DeliveryNotesPage';
import EquipmentPage from './pages/EquipmentPage';
import MonitoringPage from './pages/MonitoringPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationContainer from './components/NotificationContainer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:projectId/orders" element={<OrdersPage />} />
                <Route path="orders/:orderId/delivery-notes" element={<DeliveryNotesPage />} />
                <Route path="delivery-notes/:deliveryNoteId/equipment" element={<EquipmentPage />} />
                <Route path="monitoring" element={<MonitoringPage />} />
              </Route>
            </Routes>
            <NotificationContainer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;