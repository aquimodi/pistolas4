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
        if (response.status === 401) {
          // Don't retry on auth errors
          setError('Authentication required');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Stop interval on persistent errors
      if (interval && interval > 0) {
        console.warn('Stopping API polling due to error:', err);
        return 'STOP_POLLING';
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    const runFetch = async () => {
      if (!isMounted) return;
      
      const result = await fetchData();
      
      // Set up interval if specified and no errors
      if (result !== 'STOP_POLLING' && interval && interval > 0 && isMounted) {
        intervalId = setInterval(async () => {
          if (!isMounted) return;
          const intervalResult = await fetchData();
          if (intervalResult === 'STOP_POLLING' && intervalId) {
            clearInterval(intervalId);
          }
        }, interval);
      }
    };
    
    runFetch();
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [...dependencies, interval]); // Add interval to dependencies

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