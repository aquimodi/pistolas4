import { useState, useEffect } from 'react';

interface ApiHookOptions {
  interval?: number; // Refresh interval in milliseconds
  dependencies?: any[]; // Dependencies to trigger refetch
}

export function useApiData<T>(
  endpoint: string, 
  options: ApiHookOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { interval, dependencies = [] } = options;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api${endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up interval if specified
    if (interval && interval > 0) {
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, isLoading, error, refetch };
}

// Specialized hooks for common endpoints
export function useProjects() {
  return useApiData<any[]>('/projects');
}

export function useOrders(projectId?: string) {
  return useApiData<any[]>(
    projectId ? `/orders/project/${projectId}` : '/orders',
    { dependencies: [projectId] }
  );
}

export function useEquipment(deliveryNoteId?: string) {
  return useApiData<any[]>(
    deliveryNoteId ? `/equipment/delivery-note/${deliveryNoteId}` : '/equipment',
    { dependencies: [deliveryNoteId] }
  );
}

export function useMonitoring() {
  return useApiData<any>('/monitoring/status', {
    interval: 30000 // Refresh every 30 seconds
  });
}