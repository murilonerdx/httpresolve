import axios from "axios";

// In-memory storage for test runs and logs
const inMemoryTestRuns: any[] = [];
const inMemoryRequestLogs: any[] = [];

/**
 * Storage service for handling test data
 */
export const storage = {
  /**
   * Run a test against a specified URL with a number of parallel requests
   */
  async runTest(url: string, numRequests: number, type: string): Promise<any> {
    // Initialize results object
    const results = {
      url,
      type,
      totalRequests: numRequests,
      successCount: 0,
      rejectedCount: 0,
      successRate: '0%',
      avgTime: 0,
      responseTimes: [] as number[],
      statusCodes: {} as Record<string, number>,
      requests: [] as any[],
    };

    try {
      // Generate all requests
      const requests = Array.from({ length: numRequests }, (_, i) => {
        return makeRequest(url, i + 1, type);
      });

      // Execute all requests in parallel
      const responses = await Promise.all(requests);

      // Process responses
      responses.forEach(response => {
        results.requests.push(response);
        results.responseTimes.push(response.time);

        // Count status codes
        const status = response.status.toString();
        results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;

        // Count successes/failures
        if (response.status === 200) {
          results.successCount++;
        } else {
          results.rejectedCount++;
        }
      });

      // Calculate metrics
      if (results.responseTimes.length > 0) {
        results.avgTime = results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length;
      }
      
      results.successRate = `${Math.round((results.successCount / numRequests) * 100)}%`;

      return results;
    } catch (error) {
      console.error(`Error running test against ${url}:`, error);
      throw error;
    }
  },

  /**
   * Save a test run in memory
   */
  async saveTestRun(data: { protectedUrl: string, unprotectedUrl: string, numRequests: number, result: any }) {
    try {
      // Create a new test run with an auto-incremented ID
      const testRunId = inMemoryTestRuns.length + 1;
      
      const testRun = {
        id: testRunId,
        createdAt: new Date(),
        protectedUrl: data.protectedUrl || 'http://example.com',
        unprotectedUrl: data.unprotectedUrl || 'http://example.com',
        numRequests: data.numRequests,
        result: data.result,
      };

      // Save to in-memory storage
      inMemoryTestRuns.push(testRun);

      // If the result has individual requests, save them as request logs
      if (data.result.requests && Array.isArray(data.result.requests)) {
        data.result.requests.forEach((req: any, index: number) => {
          const logEntry = {
            id: inMemoryRequestLogs.length + 1,
            testRunId: testRunId,
            type: data.result.type || 'UNKNOWN',
            url: data.result.url || '',
            status: req.status,
            timeInSeconds: req.time.toString(),
            requestId: req.id,
            success: req.status === 200,
            createdAt: new Date()
          };
          
          inMemoryRequestLogs.push(logEntry);
        });
      }

      return testRun;
    } catch (error) {
      console.error('Error saving test run:', error);
      throw error;
    }
  },

  /**
   * Get recent test runs from memory
   */
  async getRecentTestRuns(limit: number = 10) {
    try {
      // Sort by creation date descending and take the latest entries
      return [...inMemoryTestRuns]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent test runs:', error);
      throw error;
    }
  },

  /**
   * Get request logs for a test run from memory
   */
  async getRequestLogs(testRunId: number) {
    try {
      // Filter logs by test run ID and sort by request ID
      return inMemoryRequestLogs
        .filter(log => log.testRunId === testRunId)
        .sort((a, b) => a.requestId - b.requestId);
    } catch (error) {
      console.error('Error getting request logs:', error);
      throw error;
    }
  },
};

/**
 * Make a single request to the specified URL
 */
import http from "http";
import https from "https";

// Configuração de agentes HTTP com alto limite de conexões simultâneas
const httpAgent = new http.Agent({
  keepAlive: true,  // mantém conexões vivas entre requisições
  maxSockets: 1000, // suporta muitas conexões simultâneas
  timeout: 1000    // timeout em ms
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 1000,
  timeout: 1000
});

async function makeRequest(url: string, id: number, type: string) {
  const startTime = performance.now();
  try {
    const isHttps = url.startsWith("https://");

    // Configuração correta do Axios com o agente HTTP
    const response = await axios.get(url, {
      timeout: 60000,
      // Para Node.js, use 'agent' em vez de httpAgent/httpsAgent
      agent: isHttps ? httpsAgent : httpAgent,
      validateStatus: () => true,
    });

    const endTime = performance.now();
    const timeInSeconds = (endTime - startTime) / 1000;

    return {
      id,
      status: response.status,
      time: timeInSeconds,
      type,
    };
  } catch (error) {
    const endTime = performance.now();
    const timeInSeconds = (endTime - startTime) / 1000;

    // Para erros de rede/timeout
    return {
      id,
      status: error?.response?.status || 0,
      time: timeInSeconds,
      type,
      error: (error as Error).message,
    };
  }
}
