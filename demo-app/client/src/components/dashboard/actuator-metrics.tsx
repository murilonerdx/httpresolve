import React, {useEffect, useState} from 'react';
import { Button } from '@/components/ui/button';
import { ActuatorMetrics } from '@/lib/types';
import { RefreshCw, Shield, Activity } from 'lucide-react';

interface ActuatorMetricsPanelProps {
  metrics: ActuatorMetrics | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ActuatorMetricsPanel({ metrics, onRefresh, isLoading }: ActuatorMetricsPanelProps) {
  const [refreshInterval, setRefreshInterval] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [onRefresh, refreshInterval]);


  // Helper to format memory size
  const formatMemorySize = (bytes: number | undefined) => {
    if (bytes === undefined) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format cpu percentage
  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Métricas do Actuator
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="refreshInterval" className="text-sm font-bold text-neutral-700">
              Reload in
            </label>
            <input
                id="refreshInterval"
                type="number"
                min={1}
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                className="border rounded px-2 py-1 w-14 text-center"
                style={{ WebkitAppearance: 'none' }}
            />
            <span className="text-sm text-neutral-700">seg</span>
            <Button size="icon" variant="ghost" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      
      <div className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Bulkhead Metrics */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h3 className="font-medium text-sm">Métricas de Bulkhead</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Permissões Disponíveis</div>
                <div className="font-medium">{metrics?.bulkhead?.available ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Tamanho da Fila</div>
                <div className="font-medium">{metrics?.bulkhead?.queueSize ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Rejeitados</div>
                <div className="font-medium">{metrics?.bulkhead?.rejected ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Sucesso</div>
                <div className="font-medium">{metrics?.bulkhead?.success ?? '-'}</div>
              </div>
            </div>
          </div>
          
          {/* Rate Limit Metrics */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h3 className="font-medium text-sm">Métricas de Rate Limit</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Disponíveis</div>
                <div className="font-medium">{metrics?.ratelimit?.available ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Rejeitados</div>
                <div className="font-medium">{metrics?.ratelimit?.rejected ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Janela Restante</div>
                <div className="font-medium">{metrics?.ratelimit?.remainingWindow ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Sucesso</div>
                <div className="font-medium">{metrics?.ratelimit?.success ?? '-'}</div>
              </div>
            </div>
          </div>
          
          {/* System Metrics */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h3 className="font-medium text-sm">Métricas do Sistema</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Quantidade de CPUs</div>
                <div className="font-medium">{metrics?.system?.cpuCount ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Uso de CPU</div>
                <div className="font-medium">{metrics?.system?.cpuUsage ? formatPercent(metrics.system.cpuUsage) : '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Threads Ativas</div>
                <div className="font-medium">{metrics?.jvm?.threadsLive ?? '-'}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">Memória Utilizada</div>
                <div className="font-medium">{metrics?.jvm?.memoryUsed ? formatMemorySize(metrics.jvm.memoryUsed) : '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
