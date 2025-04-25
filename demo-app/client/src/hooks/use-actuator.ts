import { useState, useEffect, useCallback } from 'react';
import { ActuatorMetrics } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useActuator(actuatorBaseUrl: string) {
  const [metrics, setMetrics] = useState<ActuatorMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchMetricValue = useCallback(async (metricName: string) => {
    try {
      const response = await apiRequest('GET', `/api/metrics/${encodeURIComponent(metricName)}`);
      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error(`Error fetching metric ${metricName}:`, error);
      return undefined;
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch metrics through proxy to avoid CORS issues
      const response = await apiRequest('GET', `/api/metrics/list?url=${encodeURIComponent(actuatorBaseUrl)}`);
      const data = await response.json();

      // Check if we got data.names which is the actuator response structure
      if (!data.names) {
        throw new Error('Invalid response from Actuator API');
      }

      setIsConnected(true);

      // Now fetch individual metrics data
      const bulkheadPromises = [
        fetchMetricValue('bulkhead.available'),
        fetchMetricValue('bulkhead.queue.size'),
        fetchMetricValue('bulkhead.rejected'),
        fetchMetricValue('bulkhead.success')
      ];

      const ratelimitPromises = [
        fetchMetricValue('ratelimit.available'),
        fetchMetricValue('ratelimit.rejected'),
        fetchMetricValue('ratelimit.remaining.window'),
        fetchMetricValue('ratelimit.success')
      ];

      const systemPromises = [
        fetchMetricValue('system.cpu.count'),
        fetchMetricValue('system.cpu.usage')
      ];

      const jvmPromises = [
        fetchMetricValue('jvm.threads.live'),
        fetchMetricValue('jvm.memory.used')
      ];

      // Wait for all metrics to load
      const [
        bulkheadAvailable, bulkheadQueueSize, bulkheadRejected, bulkheadSuccess,
        ratelimitAvailable, ratelimitRejected, ratelimitRemainingWindow, ratelimitSuccess,
        systemCpuCount, systemCpuUsage,
        jvmThreadsLive, jvmMemoryUsed
      ] = await Promise.all([
        ...bulkheadPromises,
        ...ratelimitPromises,
        ...systemPromises,
        ...jvmPromises
      ]);

      setMetrics({
        bulkhead: {
          available: bulkheadAvailable,
          queueSize: bulkheadQueueSize,
          rejected: bulkheadRejected,
          success: bulkheadSuccess
        },
        ratelimit: {
          available: ratelimitAvailable,
          rejected: ratelimitRejected,
          remainingWindow: ratelimitRemainingWindow !== undefined ? `${ratelimitRemainingWindow.toFixed(1)}s` : undefined,
          success: ratelimitSuccess
        },
        system: {
          cpuCount: systemCpuCount,
          cpuUsage: systemCpuUsage
        },
        jvm: {
          threadsLive: jvmThreadsLive,
          memoryUsed: jvmMemoryUsed
        }
      });


    } catch (error) {
      console.error('Error fetching actuator metrics:', error);
      setIsConnected(false);
      toast({
        title: "Erro ao atualizar métricas",
        description: "Não foi possível conectar ao Spring Boot Actuator",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [actuatorBaseUrl, fetchMetricValue, toast]);

  // Initial load
  useEffect(() => {
    refreshMetrics();
    
    // Setup auto-refresh every 10 seconds
    const interval = setInterval(refreshMetrics, 10000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    metrics,
    isLoading,
    refreshMetrics,
    isConnected
  };
}
