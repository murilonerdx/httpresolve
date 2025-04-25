import { useState, useEffect } from 'react';
import { TestResults } from '@/lib/types';

// Definição de estrutura para histórico de testes
export interface TestHistory {
  id: string;
  timestamp: number;
  protectedResults: TestResults | null;
  unprotectedResults: TestResults | null;
  description?: string;
}

// Chave usada para armazenamento
const STORAGE_KEY = 'bulkhead_test_history';

export function useLocalStorage() {
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  
  // Carrega o histórico do localStorage ao inicializar
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setTestHistory(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Erro ao ler dados do LocalStorage:', error);
    }
  }, []);
  
  // Salva um novo teste no histórico
  const saveTestRun = (protectedResults: TestResults | null, unprotectedResults: TestResults | null, description?: string) => {
    try {
      const newTestRun: TestHistory = {
        id: generateId(),
        timestamp: Date.now(),
        protectedResults,
        unprotectedResults,
        description
      };
      
      const updatedHistory = [...testHistory, newTestRun];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setTestHistory(updatedHistory);
      return newTestRun.id;
    } catch (error) {
      console.error('Erro ao salvar teste no LocalStorage:', error);
      return null;
    }
  };
  
  // Remove um teste do histórico
  const removeTestRun = (id: string) => {
    try {
      const updatedHistory = testHistory.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setTestHistory(updatedHistory);
      return true;
    } catch (error) {
      console.error('Erro ao remover teste do LocalStorage:', error);
      return false;
    }
  };
  
  // Limpa todo o histórico
  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setTestHistory([]);
      return true;
    } catch (error) {
      console.error('Erro ao limpar histórico do LocalStorage:', error);
      return false;
    }
  };
  
  // Gera um ID único para cada teste
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  return {
    testHistory,
    saveTestRun,
    removeTestRun,
    clearHistory
  };
}