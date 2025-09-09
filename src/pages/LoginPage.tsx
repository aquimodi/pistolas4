import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Server, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = () => {
  const { user, login } = useAuth();
  const { addNotification } = useNotification();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(credentials.username, credentials.password);
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome to the Datacenter Equipment Management System'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="mb-8">
            <Server className="h-16 w-16 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Datacenter Equipment</h1>
          <h2 className="text-xl font-light mb-8">Management System</h2>
          <p className="text-gray-300 text-center max-w-md leading-relaxed">
            Professional equipment reception and tracking for modern datacenters. 
            Streamline your IT infrastructure management with our comprehensive solution.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:hidden mb-8">
            <Server className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Datacenter Equipment</h1>
            <p className="text-gray-600">Management System</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-gray-600 mb-8">Access the datacenter management portal</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-colors"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-colors"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : null}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Demo credentials: admin/admin or operator/operator
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;