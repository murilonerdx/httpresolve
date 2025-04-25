// Request log entry
export interface RequestLog {
  type: 'PROTECTED' | 'UNPROTECTED';
  status: number;
  time: number;
  id: number;
  success: boolean;
  timestamp?: number;
}

// Test results
export interface TestResults {
  successRate: string;
  avgTime: number;
  successCount: number;
  totalRequests: number;
  rejectedCount: number;
  responseTimes: number[];
  statusCodes: Record<string, number>;
}

// Actuator metrics
export interface ActuatorMetrics {
  bulkhead: {
    available?: number;
    queueSize?: number;
    rejected?: number;
    success?: number;
  };
  ratelimit: {
    available?: number;
    rejected?: number;
    remainingWindow?: string;
    success?: number;
  };
  system: {
    cpuCount?: number;
    cpuUsage?: number;
  };
  jvm: {
    threadsLive?: number;
    memoryUsed?: number;
  };
}

// Test request
export interface TestRequest {
  url: string;
  numRequests: number;
  type: string;
}

// Actuator metric response
export interface ActuatorMetricResponse {
  name: string;
  description: string;
  baseUnit: string;
  measurements: {
    statistic: string;
    value: number;
  }[];
  availableTags: {
    tag: string;
    values: string[];
  }[];
}
