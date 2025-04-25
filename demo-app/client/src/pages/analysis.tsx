import React, {useEffect, useState} from 'react';
import { Header } from '@/components/dashboard/header';
import { Footer } from '@/components/dashboard/footer';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { useActuator } from '@/hooks/use-actuator';
import { useRequestTest } from '@/hooks/use-request-test';
import { useLocalStorage, TestHistory } from '@/hooks/use-local-storage';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Shield, 
  Clock3, 
  Users, 
  MessageSquare, 
  AlertCircle,
  ArrowRight,
  Layers,
  BarChart4,
  RefreshCw
} from 'lucide-react';

// Configurações do Bulkhead e Rate Limit
const BULKHEAD_CONFIG = {
  maxConcurrentCalls: 3,
  maxQueueSize: 2,
  queueTimeout: 5000, // ms
};

const RATE_LIMIT_CONFIG = {
  limit: 5,
  window: 10, // seconds
};

export default function Analysis() {
  const [actuatorUrl] = useState<string>('http://localhost:8080/actuator/metrics');
  const { metrics, isLoading: isLoadingMetrics, refreshMetrics, isConnected } = useActuator(actuatorUrl);
  const { testHistory } = useLocalStorage();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(1);
  // Atualize as métricas (polling)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, refreshMetrics]);

  // Encontrar o teste selecionado, ou usar o mais recente
  const selectedTest = selectedTestId
      ? testHistory.find(t => t.id === selectedTestId)
      : (testHistory.length > 0 ? testHistory[testHistory.length - 1] : null);

  // Função para formatar tempo em ms
  const formatTime = (time: number | undefined) => {
    if (time === undefined) return '0ms';
    return `${(time * 1000).toFixed(0)}ms`;
  };

  // Cálculos para Bulkhead
  const calculateBulkheadUtilization = () => {
    const bulkheadConfig = getBulkheadConfig();
    const available = metrics?.bulkhead?.available || 0;
    const used = bulkheadConfig.maxConcurrentCalls - available;
    const totalFixed = bulkheadConfig.maxConcurrentCalls
    return {
      utilizationPercent: (used / bulkheadConfig.maxConcurrentCalls) * 100,
      used,
      total: bulkheadConfig.maxConcurrentCalls,
      fixed: totalFixed
    };
  };

  const calculateQueueUtilization = () => {
    const bulkheadConfig = getBulkheadConfig();
    const queueSize = metrics?.bulkhead?.queueSize || 0;
    return {
      utilizationPercent: (queueSize / bulkheadConfig.maxQueueSize) * 100,
      used: queueSize,
      total: bulkheadConfig.maxQueueSize
    };
  };

  const calculateResponseTimeVsTimeout = () => {
    const bulkheadConfig = getBulkheadConfig();
    const avgTime = selectedTest?.protectedResults?.avgTime || 0;
    const avgTimeMs = avgTime * 1000;
    const percentOfTimeout = (avgTimeMs / bulkheadConfig.queueTimeout) * 100;

    return {
      avgTimeMs,
      queueTimeoutMs: bulkheadConfig.queueTimeout,
      percentOfTimeout,
      isHealthy: percentOfTimeout < 50
    };
  };
  const calculateRateLimitUtilization = () => {
    const rateLimitConfig = getRateLimitConfig();
    const available = metrics?.ratelimit?.available || 0;
    const used = (metrics?.ratelimit.success || 0) - available;
    return {
      utilizationPercent: ( used / available) * 100,
      used,
      total: rateLimitConfig.limit
    };
  };

  const calculateTheoreticalLimit = () => {
    const bulkheadConfig = getBulkheadConfig();
    const rateLimitConfig = getRateLimitConfig();

    const maxConcurrent = bulkheadConfig.maxConcurrentCalls;
    const queueSize = bulkheadConfig.maxQueueSize;
    const queueTimeoutMs = bulkheadConfig.queueTimeout;

    const avgTime = selectedTest?.protectedResults?.avgTime || 0.5;

    const concurrentLimit = avgTime > 0 ? maxConcurrent / avgTime : 0;
    const rateLimitThroughput = rateLimitConfig.limit / rateLimitConfig.window;

    return {
      concurrentLimit: concurrentLimit.toFixed(2),
      rateLimitThroughput: rateLimitThroughput.toFixed(2),
      effectiveLimit: Math.min(concurrentLimit, rateLimitThroughput).toFixed(2),
      limitingFactor: concurrentLimit < rateLimitThroughput ? 'Bulkhead' : 'Rate Limit'
    };
  };

  const getBulkheadConfig = () => {
    if (!metrics || !metrics.bulkhead)
      return { maxConcurrentCalls: 0, maxQueueSize: 0, queueTimeout: 0 };

    // O valor em bulkhead.available é o limite máximo quando inicial
    const available = Number(metrics.bulkhead.available);
    // Tamanho da fila: normalmente não muda, pode aparecer em metrics.bulkhead.queueSize ou em tags
    const maxConcurrentCalls = available;

    // Supondo que metrics.bulkhead.queueSize é o máximo configurado — se não for, ajuste para usar o valor de tags/description ou consulte o backend para incluir em uma métrica customizada.
    const maxQueueSize = Number(metrics.bulkhead.queueSize);

    // Timeout: para métricas padrão, não é exposto diretamente. Se o seu actuator expõe ou tem um custom, use aqui.
    const queueTimeout = 6000; // Se não houver métrica para isso, deixe 0 ou crie um endpoint que exponha

    return { maxConcurrentCalls, maxQueueSize, queueTimeout };
  };

// Função para extrair configurações do Rate Limit a partir das métricas
  const getRateLimitConfig = () => {
    if (!metrics || !metrics.ratelimit)
      return { limit: 0, window: 0 };

    // Valor inicial do available, que é igual ao do YAML quando a janela reseta.
    const available = Number(metrics.ratelimit.available);
    const success = Number(metrics.ratelimit.success);
    const rejected = Number(metrics.ratelimit.rejected);

    // O VALUE inicial é sempre limit, depois available diminui e success sobe.
    let limit = null;

    // Quando a janela reseta, success e rejected ficam 0, available = limit configurado
    if (success === 0 && rejected === 0 && available > 0) {
      limit = available;
    } else {
      // No meio da janela, limit = available + success + rejected
      limit = available + success + rejected;
    }

    // Window (segundos): geralmente consulta em remainingWindow, geralmente em milissegundos ou segundos (ajuste conforme formato do actuator)
    let window = 0;
    if (metrics.ratelimit.remainingWindow) {
      // Se vier "4.5s" ou "4000", converte para segundos
      const str = String(metrics.ratelimit.remainingWindow);
      // Se vier "5000" milissegundos, converte para segundos
      if(str.endsWith('s')) window = parseFloat(str);
      else window = Math.round(Number(str) / 1000);
    }

    return {
      limit: limit || 0,
      window
    };
  };


  // Calcular percentual de rejeição
  const calculateRejectionRate = () => {
    const rejected = metrics?.bulkhead?.rejected || 0;
    const success = metrics?.bulkhead?.success || 0;
    const total = rejected + success;
    return total > 0 ? (rejected / total) * 100 : 0;
  };


  // Análise da relação entre bulkhead e rate limit
  const analyzeBulkheadRateLimit = () => {
    const bulkheadRejected = metrics?.bulkhead?.rejected || 0;
    const rateLimitRejected = metrics?.ratelimit?.rejected || 0;
    const totalRejected = bulkheadRejected + rateLimitRejected;
    
    return {
      bulkheadRejectedPercent: totalRejected > 0 ? (bulkheadRejected / totalRejected) * 100 : 0,
      rateLimitRejectedPercent: totalRejected > 0 ? (rateLimitRejected / totalRejected) * 100 : 0,
      primaryBottleneck: bulkheadRejected > rateLimitRejected ? 'bulkhead' : 'ratelimit'
    };
  };

  // Preparar dados para gráficos
  const prepareUtilizationData = () => {
    const bulkhead = calculateBulkheadUtilization();
    const rateLimit = calculateRateLimitUtilization();
    const queue = calculateQueueUtilization();
    
    return [
      { name: 'Chamadas Concorrentes', utilização: bulkhead.utilizationPercent, disponível: 100 - bulkhead.utilizationPercent },
      { name: 'Fila de Espera', utilização: queue.utilizationPercent, disponível: 100 - queue.utilizationPercent },
      { name: 'Taxa de Requisições', utilização: rateLimit.utilizationPercent, disponível: 100 - rateLimit.utilizationPercent }
    ];
  };

  const prepareRejectionData = () => {
    const analysis = analyzeBulkheadRateLimit();
    
    return [
      { name: 'Bulkhead', valor: analysis.bulkheadRejectedPercent },
      { name: 'Rate Limit', valor: analysis.rateLimitRejectedPercent }
    ];
  };

  // Cálculo de throughput (requisições por segundo)
  const calculateThroughput = () => {
    if (!selectedTest) return 0;
    
    const totalRequests = selectedTest.protectedResults?.totalRequests || 0;
    const avgTime = selectedTest.protectedResults?.avgTime || 0;
    
    if (totalRequests === 0 || avgTime === 0) return 0;
    
    // Cálculo simples de throughput baseado no tempo médio de resposta
    return totalRequests / (totalRequests * avgTime);
  };

  // Calcular o consumo da configuração atual
  const calculateConfigurationEfficiency = () => {
    const theoretical = calculateTheoreticalLimit();
    const throughput = calculateThroughput();
    
    const usage = parseFloat(theoretical.effectiveLimit) > 0 
      ? (throughput / parseFloat(theoretical.effectiveLimit)) * 100 
      : 0;
    
    return {
      usage: usage.toFixed(2),
      isOptimal: usage > 75, // Se estamos utilizando mais de 75% da capacidade teórica
      throughput: throughput.toFixed(2)
    };
  };

  // Obter recomendações baseadas na análise
  const getRecommendations = () => {
    const rejectionRate = calculateRejectionRate();
    const responseTime = calculateResponseTimeVsTimeout();
    const efficiency = calculateConfigurationEfficiency();
    const theoretical = calculateTheoreticalLimit();
    const analysis = analyzeBulkheadRateLimit();
    
    const recommendations = [];
    
    // Analisar taxa de rejeição
    if (rejectionRate > 10) {
      // Verificar a causa da rejeição
      if (analysis.primaryBottleneck === 'bulkhead') {
        recommendations.push('Considere aumentar o maxConcurrentCalls ou maxQueueSize no Bulkhead');
      } else {
        recommendations.push('Considere aumentar o limit ou a window do Rate Limit');
      }
    }
    
    // Analisar tempo de resposta vs. timeout
    if (responseTime.percentOfTimeout > 80) {
      recommendations.push('O tempo médio de resposta está muito próximo do timeout de fila. Considere aumentar o queueTimeout ou otimizar o processamento.');
    }
    
    // Analisar eficiência da configuração
    if (parseFloat(efficiency.usage) < 50) {
      recommendations.push('A configuração atual está subutilizada. Você pode reduzir recursos ou processar mais requisições.');
    }
    
    // Se nenhuma recomendação for gerada, a configuração parece boa
    if (recommendations.length === 0) {
      recommendations.push('A configuração atual parece equilibrada para a carga atual.');
    }
    
    return recommendations;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isConnected={isConnected} onRefreshMetrics={refreshMetrics} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
          <Activity className="h-6 w-6 mr-2 text-primary" />
          Análise de Resiliência
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda - Análise e Gráficos */}
          <div className="lg:col-span-8 space-y-6">
            {/* Resumo Bulkhead */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Análise de Bulkhead e Rate Limit
                </CardTitle>
                <CardDescription>
                  Análise comparativa entre tempo de processamento e configurações de resiliência
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Métricas Bulkhead */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Bulkhead</h3>

                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Chamadas Concorrentes
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {calculateBulkheadUtilization().utilizationPercent} / {calculateBulkheadUtilization().total}
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            {calculateBulkheadUtilization().utilizationPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${calculateBulkheadUtilization().utilizationPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Clock3 className="h-3 w-3 mr-1" />
                          Tempo de Resposta vs. Timeout
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {calculateResponseTimeVsTimeout().avgTimeMs.toFixed(0)}ms / {calculateResponseTimeVsTimeout().queueTimeoutMs}ms
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              calculateResponseTimeVsTimeout().isHealthy 
                                ? 'text-green-600' 
                                : 'text-amber-600'
                            }`}
                          >
                            {calculateResponseTimeVsTimeout().percentOfTimeout.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              calculateResponseTimeVsTimeout().isHealthy 
                                ? 'bg-green-600' 
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${calculateResponseTimeVsTimeout().percentOfTimeout}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas Rate Limit */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Rate Limit</h3>

                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          Utilização de Rate Limit
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {metrics?.ratelimit.success} / {metrics?.ratelimit.available}
                          </span>
                          <span className="text-sm font-medium text-indigo-600">
                            {calculateRateLimitUtilization().utilizationPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${calculateRateLimitUtilization().utilizationPercent}%` }}
                          ></div>
                        </div>
                      </div>


                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <BarChart4 className="h-4 w-4 mr-1.5" />
                    Utilização de Recursos
                  </h3>
                  <div className="h-60 bg-white border border-neutral-200 rounded-md p-2">
                    <ChartWrapper
                      type="bar"
                      data={prepareUtilizationData()}
                      barConfigs={[
                        { dataKey: 'utilização', name: 'Utilizado', color: 'rgba(79, 70, 229, 0.7)' },
                        { dataKey: 'disponível', name: 'Disponível', color: 'rgba(229, 231, 235, 0.7)' }
                      ]}
                      xAxisKey="name"
                      height="100%"
                      stackId="utilization"
                      showGrid={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card><Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Análise de Bulkhead e Rate Limit
                </CardTitle>
                <CardDescription>
                  Análise comparativa entre tempo de processamento e configurações de resiliência
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Métricas Bulkhead */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Bulkhead</h3>

                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Chamadas Concorrentes
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {calculateBulkheadUtilization().total}
                          </span>
                        </div>
                      </div>


                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Clock3 className="h-3 w-3 mr-1" />
                          Tempo de Resposta vs. Timeout
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {calculateResponseTimeVsTimeout().avgTimeMs.toFixed(0)}ms / {calculateResponseTimeVsTimeout().queueTimeoutMs}ms
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              calculateResponseTimeVsTimeout().isHealthy 
                                ? 'text-green-600' 
                                : 'text-amber-600'
                            }`}
                          >
                            {calculateResponseTimeVsTimeout().percentOfTimeout.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              calculateResponseTimeVsTimeout().isHealthy 
                                ? 'bg-green-600' 
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${calculateResponseTimeVsTimeout().percentOfTimeout}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas Rate Limit */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">Rate Limit</h3>

                    <div className="space-y-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          Requisições com sucesso
                        </div>
                        <div className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
                          <span>
                            {metrics?.ratelimit.success}
                          </span>
                        </div>

                      </div>
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1 flex items-center">
                          <Layers className="h-3 w-3 mr-1" />
                          Causa de Rejeições
                        </div>
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-blue-500 mr-1.5"></div>
                            <span className="text-sm">Bulkhead</span>
                          </div>
                          <span className="text-sm font-medium">
                            {metrics?.bulkhead.rejected}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-indigo-500 mr-1.5"></div>
                            <span className="text-sm">Rate Limit</span>
                          </div>
                          <span className="text-sm font-medium">
                            {metrics?.ratelimit.rejected}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                    <BarChart4 className="h-4 w-4 mr-1.5" />
                    Utilização de Recursos
                  </h3>
                  <div className="h-60 bg-white border border-neutral-200 rounded-md p-2">
                    <ChartWrapper
                      type="bar"
                      data={prepareUtilizationData()}
                      barConfigs={[
                        { dataKey: 'utilização', name: 'Utilizado', color: 'rgba(79, 70, 229, 0.7)' },
                        { dataKey: 'disponível', name: 'Disponível', color: 'rgba(229, 231, 235, 0.7)' }
                      ]}
                      xAxisKey="name"
                      height="100%"
                      stackId="utilization"
                      showGrid={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Análise de Desempenho */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Análise de Capacidade
                </CardTitle>
                <CardDescription>
                  Throughput atual vs. capacidade teórica baseada nas configurações
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                    <div className="text-xs text-neutral-500 mb-1">Throughput Atual</div>
                    <div className="text-xl font-semibold text-neutral-800">
                      {calculateConfigurationEfficiency().throughput} <span className="text-sm font-normal">req/s</span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Baseado no tempo médio de resposta</div>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                    <div className="text-xs text-neutral-500 mb-1">Capacidade Teórica</div>
                    <div className="text-xl font-semibold text-neutral-800">
                      {calculateTheoreticalLimit().effectiveLimit} <span className="text-sm font-normal">req/s</span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">Limitado por: {calculateTheoreticalLimit().limitingFactor}</div>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                    <div className="text-xs text-neutral-500 mb-1">Utilização da Capacidade</div>
                    <div className="text-xl font-semibold text-neutral-800">
                      {calculateConfigurationEfficiency().usage}%
                    </div>
                    <div className={`text-xs ${parseFloat(calculateConfigurationEfficiency().usage) > 75 ? 'text-green-600' : 'text-amber-600'} mt-1`}>
                      {parseFloat(calculateConfigurationEfficiency().usage) > 75 ? 'Ótimo' : 'Subutilizado'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1.5 text-blue-600" />
                    Recomendações
                  </h3>
                  <ul className="space-y-2">
                    {getRecommendations().map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Coluna da Direita - Configurações e Histórico */}
          <div className="lg:col-span-4 space-y-6">
            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Atuais</CardTitle>
                <CardDescription>
                  Valores configurados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Bulkhead</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Max Concurrent Calls:</span>
                        <span className="font-medium">{getBulkheadConfig().maxConcurrentCalls}</span>
                      </div>

                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Rate Limiting</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Limit:</span>
                        <span className="font-medium">{metrics?.ratelimit.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Window:</span>
                        <span className="font-medium">{metrics?.ratelimit.remainingWindow}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={refreshMetrics}
                    disabled={isLoadingMetrics}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                  Atualizar Métricas
                </Button>
              </CardFooter>
            </Card>



            {/* Dados do teste */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados dos Testes</CardTitle>
                <CardDescription>
                  {selectedTest 
                    ? `${selectedTest.description || 'Sem descrição'}`
                    : 'Nenhum teste selecionado'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTest ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1">Tempo Médio (Protegido)</div>
                        <div className="text-lg font-semibold text-neutral-800">
                          {formatTime(selectedTest.protectedResults?.avgTime)}
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1">Tempo Médio (Não Protegido)</div>
                        <div className="text-lg font-semibold text-neutral-800">
                          {formatTime(selectedTest.unprotectedResults?.avgTime)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso (Protegido)</div>
                        <div className="text-lg font-semibold text-neutral-800">
                          {selectedTest.protectedResults?.successRate || '0%'}
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                        <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso (Não Protegido)</div>
                        <div className="text-lg font-semibold text-neutral-800">
                          {selectedTest.unprotectedResults?.successRate || '0%'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <p className="mb-2">Nenhum teste realizado</p>
                    <p className="text-sm">Execute testes no Dashboard para ver análises detalhadas.</p>
                  </div>
                )}
              </CardContent>
              {testHistory.length > 0 && (
                <CardFooter className="flex flex-col space-y-2">
                  <div className="text-sm font-medium mb-1">Testes Disponíveis</div>
                  <div className="w-full max-h-40 overflow-y-auto space-y-2">
                    {testHistory.map((test) => (
                      <button
                        key={test.id}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedTestId === test.id 
                            ? 'bg-blue-50 border border-blue-200 text-blue-800' 
                            : 'hover:bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => setSelectedTestId(test.id)}
                      >
                        <div className="font-medium truncate">
                          {test.description || 'Teste sem descrição'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(test.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
