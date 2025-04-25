import React, { useState } from 'react';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { TestResults } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BarChart, Download, Shield, Save } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestResultsComponentProps {
  protectedResults: TestResults | null;
  unprotectedResults: TestResults | null;
  isRunning: boolean;
  onExportResults: () => void;
}

export function TestResultsComponent({
  protectedResults,
  unprotectedResults,
  isRunning,
  onExportResults
}: TestResultsComponentProps) {
  const [activeTab, setActiveTab] = useState<'protected' | 'unprotected' | 'comparison'>('protected');
  const { saveTestRun } = useLocalStorage();
  const { toast } = useToast();
  const [saveDescription, setSaveDescription] = useState('');

  // Prepare data for time distribution chart
  const prepareTimeDistData = (results: TestResults | null) => {
    if (!results || !results.responseTimes.length) return [];
    
    const timeRanges = [
      { range: '0-50ms', count: 0 },
      { range: '51-100ms', count: 0 },
      { range: '101-200ms', count: 0 },
      { range: '201-300ms', count: 0 },
      { range: '301-400ms', count: 0 },
      { range: '400+ms', count: 0 },
    ];

    results.responseTimes.forEach(time => {
      const timeInMs = time * 1000; // Convert to ms
      if (timeInMs <= 50) timeRanges[0].count++;
      else if (timeInMs <= 100) timeRanges[1].count++;
      else if (timeInMs <= 200) timeRanges[2].count++;
      else if (timeInMs <= 300) timeRanges[3].count++;
      else if (timeInMs <= 400) timeRanges[4].count++;
      else timeRanges[5].count++;
    });

    return timeRanges;
  };

  // Prepare data for status distribution chart
  const prepareStatusData = (results: TestResults | null) => {
    if (!results || !results.statusCodes) return [];
    
    return Object.entries(results.statusCodes).map(([status, count]) => ({
      name: getStatusName(status),
      value: count
    }));
  };

  // Get status name based on code
  const getStatusName = (statusCode: string) => {
    switch (statusCode) {
      case '200': return 'Sucesso (200)';
      case '429': return 'Limite de Taxa (429)';
      case '503': return 'Serviço Indisponível (503)';
      default: return `Status ${statusCode}`;
    }
  };

  // Prepare data for comparison chart
  const prepareComparisonData = () => {
    const timeRanges = ['0-50ms', '51-100ms', '101-200ms', '201-300ms', '301-400ms', '400+ms'];
    const protectedData = prepareTimeDistData(protectedResults);
    const unprotectedData = prepareTimeDistData(unprotectedResults);
    
    return timeRanges.map((range, index) => ({
      name: range,
      Protegido: protectedData[index]?.count || 0,
      'Não Protegido': unprotectedData[index]?.count || 0
    }));
  };

  // Status code comparison data
  const prepareStatusComparisonData = () => {
    const allStatusCodes = new Set<string>();
    
    if (protectedResults?.statusCodes) {
      Object.keys(protectedResults.statusCodes).forEach(code => allStatusCodes.add(code));
    }
    
    if (unprotectedResults?.statusCodes) {
      Object.keys(unprotectedResults.statusCodes).forEach(code => allStatusCodes.add(code));
    }
    
    return Array.from(allStatusCodes).map(code => ({
      name: getStatusName(code),
      Protegido: protectedResults?.statusCodes[code] || 0,
      'Não Protegido': unprotectedResults?.statusCodes[code] || 0
    }));
  };

  // Status indicator for the running test
  const getStatusIndicator = () => {
    if (isRunning) {
      return (
        <span className="px-2 py-1 bg-neutral-100 rounded-md text-neutral-600 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
          Executando Testes...
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-neutral-100 rounded-md text-neutral-600 flex items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 mr-1.5"></span>
        Inativo
      </span>
    );
  };

  // Format processing time
  const formatTime = (time: number | undefined) => {
    if (time === undefined) return '0ms';
    return `${(time * 1000).toFixed(0)}ms`;
  };
  
  // Função para salvar os resultados do teste
  const handleSaveResults = () => {
    if (protectedResults || unprotectedResults) {
      const testId = saveTestRun(protectedResults, unprotectedResults, saveDescription);
      if (testId) {
        toast({
          title: "Resultados salvos",
          description: "Os resultados do teste foram salvos no histórico.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar os resultados do teste.",
          variant: "destructive",
        });
      }
      setSaveDescription('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="border-b border-neutral-200">
        <div className="px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-primary" />
            Resultados do Teste
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            {getStatusIndicator()}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!protectedResults && !unprotectedResults}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salvar Resultados</DialogTitle>
                  <DialogDescription>
                    Adicione uma descrição opcional para este teste.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="description">Descrição</Label>
                  <Input 
                    id="description" 
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Ex: Teste com 400 requisições paralelas"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button 
                      onClick={handleSaveResults}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Salvar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onExportResults}
              disabled={!protectedResults && !unprotectedResults}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-5 py-3 text-sm font-medium ${
              activeTab === 'protected'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setActiveTab('protected')}
          >
            Protegido
          </button>
          <button
            className={`px-5 py-3 text-sm font-medium ${
              activeTab === 'unprotected'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setActiveTab('unprotected')}
          >
            Não Protegido
          </button>
          <button
            className={`px-5 py-3 text-sm font-medium ${
              activeTab === 'comparison'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setActiveTab('comparison')}
          >
            Comparação
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Protected Results View */}
        {activeTab === 'protected' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {protectedResults ? protectedResults.successRate : '0%'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Tempo Médio Resposta</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {protectedResults ? formatTime(protectedResults.avgTime) : '0ms'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {protectedResults ? `${protectedResults.successCount}/${protectedResults.totalRequests}` : '0/0'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {protectedResults ? protectedResults.rejectedCount : '0'}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Distribuição de Tempo de Resposta</h3>
              <div className="bg-white border border-neutral-200 rounded-md p-2 h-64">
                <ChartWrapper
                  type="bar"
                  data={prepareTimeDistData(protectedResults)}
                  barConfigs={[{ dataKey: 'count', name: 'Requisições' }]}
                  xAxisKey="range"
                  height="100%"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Distribuição de Status de Resposta</h3>
              <div className="h-44">
                <ChartWrapper
                  type="pie"
                  data={prepareStatusData(protectedResults)}
                  pieConfigs={{
                    dataKey: 'value',
                    nameKey: 'name',
                    colors: ['rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)']
                  }}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Unprotected Results View */}
        {activeTab === 'unprotected' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {unprotectedResults ? unprotectedResults.successRate : '0%'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Tempo Médio Resposta</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {unprotectedResults ? formatTime(unprotectedResults.avgTime) : '0ms'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {unprotectedResults ? `${unprotectedResults.successCount}/${unprotectedResults.totalRequests}` : '0/0'}
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                <div className="text-xl font-semibold text-neutral-800">
                  {unprotectedResults ? unprotectedResults.rejectedCount : '0'}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Distribuição de Tempo de Resposta</h3>
              <div className="bg-white border border-neutral-200 rounded-md p-2 h-64">
                <ChartWrapper
                  type="bar"
                  data={prepareTimeDistData(unprotectedResults)}
                  barConfigs={[{ dataKey: 'count', name: 'Requisições' }]}
                  xAxisKey="range"
                  height="100%"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Distribuição de Status de Resposta</h3>
              <div className="h-44">
                <ChartWrapper
                  type="pie"
                  data={prepareStatusData(unprotectedResults)}
                  pieConfigs={{
                    dataKey: 'value',
                    nameKey: 'name',
                    colors: ['rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)']
                  }}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Comparison View */}
        {activeTab === 'comparison' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-primary" />
                  Endpoint Protegido
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {protectedResults ? protectedResults.successRate : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Tempo Médio Resposta</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {protectedResults ? formatTime(protectedResults.avgTime) : '0ms'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {protectedResults ? `${protectedResults.successCount}/${protectedResults.totalRequests}` : '0/0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {protectedResults ? protectedResults.rejectedCount : '0'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-neutral-400" fill="none" />
                  Endpoint Não Protegido
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {unprotectedResults ? unprotectedResults.successRate : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Tempo Médio Resposta</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {unprotectedResults ? formatTime(unprotectedResults.avgTime) : '0ms'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {unprotectedResults ? `${unprotectedResults.successCount}/${unprotectedResults.totalRequests}` : '0/0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {unprotectedResults ? unprotectedResults.rejectedCount : '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Comparação de Tempo de Resposta</h3>
            <div className="bg-white border border-neutral-200 rounded-md p-3 mb-4 h-64">
              <ChartWrapper
                type="bar"
                data={prepareComparisonData()}
                barConfigs={[
                  { dataKey: 'Protegido', color: 'rgba(0, 114, 245, 0.6)' },
                  { dataKey: 'Não Protegido', color: 'rgba(239, 68, 68, 0.6)' }
                ]}
                xAxisKey="name"
                height="100%"
              />
            </div>
            
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Distribuição de Códigos de Status</h3>
            <div className="bg-white border border-neutral-200 rounded-md p-3 h-64">
              <ChartWrapper
                type="bar"
                data={prepareStatusComparisonData()}
                barConfigs={[
                  { dataKey: 'Protegido', color: 'rgba(0, 114, 245, 0.6)' },
                  { dataKey: 'Não Protegido', color: 'rgba(239, 68, 68, 0.6)' }
                ]}
                xAxisKey="name"
                height="100%"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
