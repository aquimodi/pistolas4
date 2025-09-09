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
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          // Usar setTimeout para evitar bucles infinitos
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
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
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      project_id: 1, 
      order_code: 'PED-2024-NEW', 
      equipment_count: 1, 
      vendor: 'Mock Vendor', 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('delivery_notes') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new delivery note');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      order_id: 1, 
      delivery_code: 'ALB-2024-NEW', 
      estimated_equipment_count: 1, 
      delivery_date: new Date(), 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('equipment') && queryLower.includes('insert')) {
    console.log('📊 Mock: Creating new equipment');
    return [{ 
      id: Math.floor(Math.random() * 1000) + 100, 
      delivery_note_id: 1, 
      serial_number: 'MOCK-' + Math.random().toString(36).substr(2, 6).toUpperCase(), 
      manufacturer: 'Mock Manufacturer', 
      model: 'Mock Model', 
      created_at: new Date() 
    }];
  }
  
  if (queryLower.includes('orders') && queryLower.includes('select')) {</Action>
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