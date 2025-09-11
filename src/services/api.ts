// API base URL - uses proxy configured in vite.config.ts for development
// and nginx proxy for production
const API_BASE_URL = '/api';

class ApiService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      // Manejar error 401 sin redirección automática
      if (response.status === 401) {
        // No hacer redirección automática desde el API service
        // Dejar que AuthContext maneje la redirección
        throw new Error('Authentication required');
      }
      
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait and try again.');
      }
      
      if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
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
    console.log(`API GET: ${API_BASE_URL}${endpoint}`);
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
  getAll: () => apiService.get('/delivery-notes'),
  getByOrder: (orderId: string) => apiService.get(`/delivery-notes/order/${orderId}`),
  create: (data: any) => apiService.post('/delivery-notes', data),
  update: (id: string, data: any) => apiService.put(`/delivery-notes/${id}`, data)
};

export const equipmentAPI = {
  getByDeliveryNote: (deliveryNoteId: string) => apiService.get(`/equipment/delivery-note/${deliveryNoteId}`),
  getAll: () => apiService.get('/equipment'),
  create: (data: any) => apiService.post('/equipment', data),
  update: (id: string, data: any) => apiService.put(`/equipment/${id}`, data),
  delete: (id: string) => apiService.delete(`/equipment/${id}`),
  verify: (serial_number: string, delivery_note_id: number) =>
    apiService.post('/equipment/verify', { serial_number, delivery_note_id }),
  unverify: (id: string) =>
    apiService.post(`/equipment/unverify/${id}`, {}),
}

export const monitoringAPI = {
  getStatus: () => apiService.get('/monitoring/status'),
  getLogs: (params?: any) => apiService.get(`/monitoring/logs${params ? `?${new URLSearchParams(params).toString()}` : ''}`),
  getMetrics: () => apiService.get('/monitoring/metrics')
};