import { useState, useCallback } from 'react';
import { RequestLog, TestResults } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestConfig {
  protectedUrl: string;
  unprotectedUrl: string;
  numRequests: number;
  testType: 'protected' | 'unprotected' | 'both';
}

export function useRequestTest() {
  const [isRunningProtected, setIsRunningProtected] = useState(false);
  const [isRunningUnprotected, setIsRunningUnprotected] = useState(false);
  const [protectedResults, setProtectedResults] = useState<TestResults | null>(null);
  const [unprotectedResults, setUnprotectedResults] = useState<TestResults | null>(null);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const { toast } = useToast();

  // Clear logs
  const clearLogs = useCallback(() => {
    setRequestLogs([]);
  }, []);

  // Reset all test results
  const resetResults = useCallback(() => {
    setProtectedResults(null);
    setUnprotectedResults(null);
    clearLogs();
    toast({
      title: "Reset complete",
      description: "All test results have been cleared",
    });
  }, [clearLogs, toast]);

  // Add a log entry
  const addLogEntry = useCallback((log: RequestLog) => {
    setRequestLogs(prevLogs => {
      // Keep logs sorted by most recent first
      const newLogs = [log, ...prevLogs];
      // Only keep the last 100 logs
      if (newLogs.length > 100) {
        return newLogs.slice(0, 100);
      }
      return newLogs;
    });
  }, []);

  // Process results for each endpoint type

  const processResults = useCallback((results: any, isProtected: boolean) => {
    if (!results) return;

    const testResults: TestResults = {
      successRate: results.successRate,
      avgTime: results.avgTime,
      successCount: results.successCount,
      totalRequests: results.totalRequests,
      rejectedCount: results.rejectedCount,
      responseTimes: results.responseTimes || [],
      statusCodes: results.statusCodes || {}
    };

    // ...log adding

    if (isProtected) {
      setProtectedResults(testResults);
      setIsRunningProtected(false);
    } else {
      setUnprotectedResults(testResults);
      setIsRunningUnprotected(false);
    }
  }, [addLogEntry]);

  // Run tests
  const runTest = useCallback(async (config: TestConfig) => {
    const { protectedUrl, unprotectedUrl, numRequests, testType } = config;

    // Set running state
    if (testType === 'protected' || testType === 'both') {
      setProtectedResults(null); // <--- Adicionado aqui!
      setIsRunningProtected(true);
    }
    if (testType === 'unprotected' || testType === 'both') {
      setUnprotectedResults(null); // <--- Adicionado aqui!
      setIsRunningUnprotected(true);
    }

    toast({
      title: "Test started",
      description: `Running ${numRequests} requests to ${testType === 'both' ? 'both endpoints' : testType + ' endpoint'}`,
    });

    try {
      // Run protected endpoint test
      if (testType === 'protected' || testType === 'both') {
        const protectedResponse = await apiRequest('POST', '/api/test/run', {
          url: protectedUrl,
          numRequests,
          type: 'protected'
        });
        const protectedData = await protectedResponse.json();
        processResults(protectedData, true);
      }

      // Run unprotected endpoint test
      if (testType === 'unprotected' || testType === 'both') {
        const unprotectedResponse = await apiRequest('POST', '/api/test/run', {
          url: unprotectedUrl,
          numRequests,
          type: 'unprotected'
        });
        const unprotectedData = await unprotectedResponse.json();
        processResults(unprotectedData, false);
      }

      toast({
        title: "Test completed",
        description: "Request test completed successfully",
      });
    } catch (error) {
      console.error('Error running test:', error);
      
      // Reset running states
      setIsRunningProtected(false);
      setIsRunningUnprotected(false);
      
      toast({
        title: "Test failed",
        description: "An error occurred while running the test",
        variant: "destructive"
      });
    }
  }, [processResults, toast]);

  // Export results to JSON
  const exportResults = useCallback(() => {
    if (!protectedResults && !unprotectedResults) {
      toast({
        title: "No results to export",
        description: "Run a test first to generate results",
        variant: "destructive"
      });
      return;
    }

    const results = {
      timestamp: new Date().toISOString(),
      protected: protectedResults,
      unprotected: unprotectedResults,
    };

    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `resilience-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast({
      title: "Export complete",
      description: "Results have been exported to JSON",
    });
  }, [protectedResults, unprotectedResults, toast]);

  return {
    runTest,
    isRunningProtected,
    isRunningUnprotected,
    protectedResults,
    unprotectedResults,
    requestLogs,
    clearLogs,
    resetResults,
    exportResults,
  };
}
