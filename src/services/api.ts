// Dynamic API base URL - use current host if not localhost
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If we're running on localhost, use localhost for API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    
    // Otherwise, use same hostname with port 3001
    return `http://${hostname}:3001/api`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { error: response.status === 404 ? 'Resource not found' : 'Network error' };
      }
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }
}

const apiService = new ApiService();

export const authAPI = {
  login: (username: string, password: string) => 
    apiService.post('/auth/login', { username, password }),
  logout: () => 
    apiService.post('/auth/logout', {}),
  verify: () => 
    apiService.get('/auth/verify')
};

export const projectsAPI = {
  getAll: () => apiService.get('/projects'),
  getById: (id: string) => apiService.get(`/projects/${id}`),
  create: (data: any) => apiService.post('/projects', data),
  update: (id: string, data: any) => apiService.put(`/projects/${id}`, data),
  delete: (id: string) => apiService.delete(`/projects/${id}`)
};

export const ordersAPI = {
  getByProject: (projectId: string) => apiService.get(`/orders/project/${projectId}`),
  getAll: () => apiService.get('/orders'),
  create: (data: any) => apiService.post('/orders', data),
  update: (id: string, data: any) => apiService.put(`/orders/${id}`, data)
};

export const deliveryNotesAPI = {
  getByOrder: (orderId: string) => apiService.get(`/delivery-notes/order/${orderId}`),
  create: (data: any) => apiService.post('/delivery-notes', data),
  update: (id: string, data: any) => apiService.put(`/delivery-notes/${id}`, data)
};

export const equipmentAPI = {
  getByDeliveryNote: (deliveryNoteId: string) => apiService.get(`/equipment/delivery-note/${deliveryNoteId}`),
  getAll: () => apiService.get('/equipment'),
  create: (data: any) => apiService.post('/equipment', data),
  update: (id: string, data: any) => apiService.put(`/equipment/${id}`, data)
};

export const monitoringAPI = {
  getStatus: () => apiService.get('/monitoring/status'),
  getLogs: (params?: any) => apiService.get(`/monitoring/logs${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getMetrics: () => apiService.get('/monitoring/metrics')
};