import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocalStorage, TestHistory } from '@/hooks/use-local-storage';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { 
  BarChart, 
  ClipboardList, 
  Clock, 
  Save, 
  Trash2, 
  ArrowRightLeft, 
  History,
  Plus,
  Circle,
  ScrollText
} from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TestResults } from '@/lib/types';

interface TestHistoryProps {
  protectedResults: TestResults | null;
  unprotectedResults: TestResults | null;
}

export function TestHistoryPanel({ protectedResults, unprotectedResults }: TestHistoryProps) {
  const { testHistory, saveTestRun, removeTestRun, clearHistory } = useLocalStorage();
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedTest, setSelectedTest] = useState<TestHistory | null>(null);
  
  // Formata a data para exibição
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Formata tempo de resposta para ms
  const formatTime = (time: number | undefined) => {
    if (time === undefined) return '0ms';
    return `${(time * 1000).toFixed(0)}ms`;
  };
  
  // Prepara dados de comparação entre períodos
  const prepareComparisonData = (test1: TestHistory, test2: TestHistory) => {
    return [
      { 
        name: 'Taxa de Sucesso Protegido', 
        [formatDate(test1.timestamp)]: test1.protectedResults?.successCount || 0, 
        [formatDate(test2.timestamp)]: test2.protectedResults?.successCount || 0 
      },
      { 
        name: 'Taxa de Sucesso Não Protegido', 
        [formatDate(test1.timestamp)]: test1.unprotectedResults?.successCount || 0, 
        [formatDate(test2.timestamp)]: test2.unprotectedResults?.successCount || 0 
      },
      { 
        name: 'Tempo Médio Protegido (ms)', 
        [formatDate(test1.timestamp)]: (test1.protectedResults?.avgTime || 0) * 1000, 
        [formatDate(test2.timestamp)]: (test2.protectedResults?.avgTime || 0) * 1000
      },
      { 
        name: 'Tempo Médio Não Protegido (ms)', 
        [formatDate(test1.timestamp)]: (test1.unprotectedResults?.avgTime || 0) * 1000, 
        [formatDate(test2.timestamp)]: (test2.unprotectedResults?.avgTime || 0) * 1000
      },
      { 
        name: 'Rejeitados Protegido', 
        [formatDate(test1.timestamp)]: test1.protectedResults?.rejectedCount || 0, 
        [formatDate(test2.timestamp)]: test2.protectedResults?.rejectedCount || 0 
      },
      { 
        name: 'Rejeitados Não Protegido', 
        [formatDate(test1.timestamp)]: test1.unprotectedResults?.rejectedCount || 0, 
        [formatDate(test2.timestamp)]: test2.unprotectedResults?.rejectedCount || 0 
      }
    ];
  };
  
  // Prepara dados de sucessos vs rejeições por teste
  const prepareSuccessRejectionData = (test: TestHistory) => {
    return [
      { 
        name: 'Protegido', 
        Sucesso: test.protectedResults?.successCount || 0,
        Rejeitado: test.protectedResults?.rejectedCount || 0 
      },
      { 
        name: 'Não Protegido', 
        Sucesso: test.unprotectedResults?.successCount || 0,
        Rejeitado: test.unprotectedResults?.rejectedCount || 0
      }
    ];
  };
  
  // Prepara dados para gráfico de radar mostrando as características do teste
  const prepareRadarData = (test: TestHistory) => {
    const normalizeValue = (value: number, max: number) => (value / max) * 100;
    
    // Valores máximos para normalização
    const maxAvgTime = 300; // 300ms como tempo máximo
    const maxSuccess = test.protectedResults?.totalRequests || test.unprotectedResults?.totalRequests || 100;
    const maxRejected = test.protectedResults?.totalRequests || test.unprotectedResults?.totalRequests || 100;
    
    return [
      {
        subject: 'Taxa de Sucesso',
        Protegido: normalizeValue(test.protectedResults?.successCount || 0, maxSuccess),
        'Não Protegido': normalizeValue(test.unprotectedResults?.successCount || 0, maxSuccess),
        fullMark: 100,
      },
      {
        subject: 'Tempo de Resposta',
        // Invertemos a lógica aqui, quanto menor o tempo, melhor
        Protegido: 100 - normalizeValue((test.protectedResults?.avgTime || 0) * 1000, maxAvgTime),
        'Não Protegido': 100 - normalizeValue((test.unprotectedResults?.avgTime || 0) * 1000, maxAvgTime),
        fullMark: 100,
      },
      {
        subject: 'Rejeitados',
        // Invertemos a lógica aqui também, menos rejeições é melhor
        Protegido: 100 - normalizeValue(test.protectedResults?.rejectedCount || 0, maxRejected),
        'Não Protegido': 100 - normalizeValue(test.unprotectedResults?.rejectedCount || 0, maxRejected),
        fullMark: 100,
      },
      {
        subject: 'Estabilidade',
        // Calculamos a estabilidade pela consistência dos tempos de resposta
        // (quanto menor o desvio padrão, melhor)
        Protegido: test.protectedResults ? 80 : 0, // Simplificado para este exemplo
        'Não Protegido': test.unprotectedResults ? 60 : 0, // Simplificado para este exemplo
        fullMark: 100,
      },
      {
        subject: 'Throughput',
        // Taxa de sucesso por unidade de tempo - maior é melhor
        Protegido: test.protectedResults ? 75 : 0, // Simplificado para este exemplo
        'Não Protegido': test.unprotectedResults ? 85 : 0, // Simplificado para este exemplo
        fullMark: 100,
      }
    ];
  };
  
  // Salva os resultados atuais no localStorage
  const handleSaveCurrentTest = () => {
    if (protectedResults || unprotectedResults) {
      saveTestRun(protectedResults, unprotectedResults, saveDescription);
      setSaveDescription('');
    }
  };
  
  // Verifica se existem resultados para salvar
  const hasResults = !!(protectedResults || unprotectedResults);
  
  // Verifica se existem pelo menos 2 testes para comparação
  const canCompareTests = testHistory.length >= 2;
  
  const [selectedHistoryTab, setSelectedHistoryTab] = useState<'list' | 'details' | 'compare'>('list');
  const [testToCompare1, setTestToCompare1] = useState<string | null>(null);
  const [testToCompare2, setTestToCompare2] = useState<string | null>(null);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="border-b border-neutral-200">
        <div className="px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <History className="h-5 w-5 mr-2 text-primary" />
            Histórico de Testes
          </h2>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!hasResults}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Teste
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
                      onClick={handleSaveCurrentTest}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Salvar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearHistory}
              disabled={testHistory.length === 0}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </div>
        </div>
        
        <div className="flex border-b border-neutral-200">
          <button
            className={`px-5 py-3 text-sm font-medium ${
              selectedHistoryTab === 'list'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setSelectedHistoryTab('list')}
          >
            <ClipboardList className="h-4 w-4 mr-1 inline-block" />
            Lista
          </button>
          <button
            className={`px-5 py-3 text-sm font-medium ${
              selectedHistoryTab === 'details'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setSelectedHistoryTab('details')}
            disabled={!selectedTest}
          >
            <ScrollText className="h-4 w-4 mr-1 inline-block" />
            Detalhes
          </button>
          <button
            className={`px-5 py-3 text-sm font-medium ${
              selectedHistoryTab === 'compare'
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
            onClick={() => setSelectedHistoryTab('compare')}
            disabled={!canCompareTests}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1 inline-block" />
            Comparar
          </button>
        </div>
      </div>
      
      <div className="p-5">
        {/* Lista de testes */}
        {selectedHistoryTab === 'list' && (
          <div>
            {testHistory.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 text-neutral-400" />
                <p>Nenhum teste salvo.</p>
                <p className="text-sm mt-1">Execute um teste e salve-o para ver o histórico.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testHistory.map((test) => (
                  <div 
                    key={test.id} 
                    className={`bg-neutral-50 rounded-md p-3 border ${
                      selectedTest?.id === test.id 
                        ? 'border-primary' 
                        : 'border-neutral-200'
                    } cursor-pointer hover:border-primary transition-colors`}
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">
                          {test.description || 'Teste sem descrição'}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(test.timestamp)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTest(test);
                            setSelectedHistoryTab('details');
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTestRun(test.id);
                            if (selectedTest?.id === test.id) {
                              setSelectedTest(null);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">
                        <span className="text-neutral-500">Protegido: </span>
                        <span className="font-medium">
                          {test.protectedResults 
                            ? `${test.protectedResults.successCount}/${test.protectedResults.totalRequests}`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-neutral-500">Não Protegido: </span>
                        <span className="font-medium">
                          {test.unprotectedResults
                            ? `${test.unprotectedResults.successCount}/${test.unprotectedResults.totalRequests}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Detalhes do teste selecionado */}
        {selectedHistoryTab === 'details' && selectedTest && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-medium text-neutral-800">
                {selectedTest.description || 'Teste sem descrição'}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                <Clock className="h-4 w-4 mr-1 inline-block" />
                {formatDate(selectedTest.timestamp)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Gráfico de Sucesso vs Rejeição */}
              <div className="bg-white border border-neutral-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Sucessos vs Rejeições</h4>
                <div className="h-60">
                  <ChartWrapper
                    type="bar"
                    data={prepareSuccessRejectionData(selectedTest)}
                    barConfigs={[
                      { dataKey: 'Sucesso', color: 'rgba(16, 185, 129, 0.7)' },
                      { dataKey: 'Rejeitado', color: 'rgba(239, 68, 68, 0.7)' }
                    ]}
                    xAxisKey="name"
                    height="100%"
                    showGrid={true}
                  />
                </div>
              </div>
              
              {/* Gráfico Radar */}
              <div className="bg-white border border-neutral-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Análise de Performance</h4>
                <div className="h-60">
                  <ChartWrapper
                    type="radar"
                    data={prepareRadarData(selectedTest)}
                    radarConfigs={{
                      dataKeys: ['Protegido', 'Não Protegido'],
                      colors: ['rgba(0, 114, 245, 0.6)', 'rgba(239, 68, 68, 0.6)']
                    }}
                    height="100%"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
                  <Circle className="h-3 w-3 mr-1 text-primary" fill="currentColor" />
                  Endpoint Protegido
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.protectedResults ? selectedTest.protectedResults.successRate : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Tempo Médio</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.protectedResults ? formatTime(selectedTest.protectedResults.avgTime) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.protectedResults 
                        ? `${selectedTest.protectedResults.successCount}/${selectedTest.protectedResults.totalRequests}` 
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.protectedResults ? selectedTest.protectedResults.rejectedCount : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-md p-3 border border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
                  <Circle className="h-3 w-3 mr-1 text-neutral-400" />
                  Endpoint Não Protegido
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Taxa de Sucesso</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.unprotectedResults ? selectedTest.unprotectedResults.successRate : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Tempo Médio</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.unprotectedResults ? formatTime(selectedTest.unprotectedResults.avgTime) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Sucesso/Total</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.unprotectedResults 
                        ? `${selectedTest.unprotectedResults.successCount}/${selectedTest.unprotectedResults.totalRequests}` 
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Rejeitados</div>
                    <div className="text-lg font-semibold text-neutral-800">
                      {selectedTest.unprotectedResults ? selectedTest.unprotectedResults.rejectedCount : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Comparação entre testes */}
        {selectedHistoryTab === 'compare' && (
          <div>
            {testHistory.length < 2 ? (
              <div className="text-center py-8 text-neutral-500">
                <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 text-neutral-400" />
                <p>É necessário ter pelo menos 2 testes salvos para comparar.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <Label htmlFor="test1" className="block text-sm font-medium text-neutral-700 mb-1">
                      Primeiro Teste
                    </Label>
                    <select
                      id="test1"
                      className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                      value={testToCompare1 || ''}
                      onChange={(e) => setTestToCompare1(e.target.value)}
                    >
                      <option value="">Selecione um teste</option>
                      {testHistory.map((test) => (
                        <option key={`test1-${test.id}`} value={test.id}>
                          {formatDate(test.timestamp)} - {test.description || 'Sem descrição'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="test2" className="block text-sm font-medium text-neutral-700 mb-1">
                      Segundo Teste
                    </Label>
                    <select
                      id="test2"
                      className="w-full rounded-md border border-neutral-300 p-2 text-sm"
                      value={testToCompare2 || ''}
                      onChange={(e) => setTestToCompare2(e.target.value)}
                    >
                      <option value="">Selecione um teste</option>
                      {testHistory.map((test) => (
                        <option key={`test2-${test.id}`} value={test.id}>
                          {formatDate(test.timestamp)} - {test.description || 'Sem descrição'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {testToCompare1 && testToCompare2 ? (
                  <div>
                    <div className="bg-white border border-neutral-200 rounded-md p-3 mb-5">
                      <h4 className="text-sm font-medium text-neutral-700 mb-2">Comparação de Métricas</h4>
                      <div className="h-80">
                        <ChartWrapper
                          type="bar"
                          data={prepareComparisonData(
                            testHistory.find(t => t.id === testToCompare1)!,
                            testHistory.find(t => t.id === testToCompare2)!
                          )}
                          barConfigs={[
                            { 
                              dataKey: formatDate(testHistory.find(t => t.id === testToCompare1)!.timestamp), 
                              color: 'rgba(0, 114, 245, 0.6)' 
                            },
                            { 
                              dataKey: formatDate(testHistory.find(t => t.id === testToCompare2)!.timestamp), 
                              color: 'rgba(239, 68, 68, 0.6)' 
                            }
                          ]}
                          xAxisKey="name"
                          height="100%"
                          showGrid={true}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white border border-neutral-200 rounded-md p-3">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Análise Comparativa</h4>
                        <div className="prose prose-sm max-w-none">
                          <p>
                            Os testes selecionados apresentam diferenças significativas em:
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              <strong>Tempo de resposta:</strong> {' '}
                              {Math.abs((
                                (testHistory.find(t => t.id === testToCompare1)!.protectedResults?.avgTime || 0) -
                                (testHistory.find(t => t.id === testToCompare2)!.protectedResults?.avgTime || 0)
                              ) * 1000).toFixed(1)}ms de diferença no endpoint protegido.
                            </li>
                            <li>
                              <strong>Taxa de sucesso:</strong> {' '}
                              {Math.abs(
                                (testHistory.find(t => t.id === testToCompare1)!.protectedResults?.successCount || 0) -
                                (testHistory.find(t => t.id === testToCompare2)!.protectedResults?.successCount || 0)
                              )} requisições de diferença no endpoint protegido.
                            </li>
                            <li>
                              <strong>Rejeições:</strong> {' '}
                              {Math.abs(
                                (testHistory.find(t => t.id === testToCompare1)!.protectedResults?.rejectedCount || 0) -
                                (testHistory.find(t => t.id === testToCompare2)!.protectedResults?.rejectedCount || 0)
                              )} rejeições de diferença no endpoint protegido.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <ArrowRightLeft className="h-8 w-8 mx-auto mb-3 text-neutral-400" />
                    <p>Selecione dois testes para comparar.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}