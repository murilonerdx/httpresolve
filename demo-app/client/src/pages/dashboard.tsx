import React, { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { ConfigPanel } from '@/components/dashboard/config-panel';
import { TestResultsComponent } from '@/components/dashboard/test-results';
import { ActuatorMetricsPanel } from '@/components/dashboard/actuator-metrics';
import { LiveRequestsPanel } from '@/components/dashboard/live-requests';
import { RequestLogPanel } from '@/components/dashboard/request-log';
import { TestHistoryPanel } from '@/components/dashboard/test-history';
import { Footer } from '@/components/dashboard/footer';
import { useRequestTest } from '@/hooks/use-request-test';
import { useActuator } from '@/hooks/use-actuator';

export default function Dashboard() {
  // Configuration state
  const [protectedUrl, setProtectedUrl] = useState<string>('http://localhost:8080/demo/pagamento-protegido');
  const [unprotectedUrl, setUnprotectedUrl] = useState<string>('http://localhost:8080/demo/pagamento-livre');
  const [numRequests, setNumRequests] = useState<number>(400);
  const [actuatorUrl, setActuatorUrl] = useState<string>('http://localhost:8080/actuator/metrics');

  // Custom hooks
  const {
    runTest,
    isRunningProtected,
    isRunningUnprotected,
    protectedResults,
    unprotectedResults,
    requestLogs,
    clearLogs,
    resetResults,
    exportResults,
  } = useRequestTest();

  const {
    metrics,
    isLoading: isLoadingMetrics,
    refreshMetrics,
    isConnected,
  } = useActuator(actuatorUrl);

  // Handler functions
  const handleRunBothTests = () => {
    runTest({
      protectedUrl,
      unprotectedUrl,
      numRequests,
      testType: 'both',
    });
  };

  const handleRunProtectedTest = () => {
    runTest({
      protectedUrl,
      unprotectedUrl,
      numRequests,
      testType: 'protected',
    });
  };

  const handleRunUnprotectedTest = () => {
    runTest({
      protectedUrl,
      unprotectedUrl,
      numRequests,
      testType: 'unprotected',
    });
  };

  const handleRefreshMetrics = () => {
    refreshMetrics();
  };

  const isRunning = isRunningProtected || isRunningUnprotected;

  return (
    <div className="min-h-screen flex flex-col">
      <Header isConnected={isConnected} onRefreshMetrics={handleRefreshMetrics} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Config + Results) */}
          <div className="lg:col-span-8 space-y-6">
            <ConfigPanel
              protectedUrl={protectedUrl}
              setProtectedUrl={setProtectedUrl}
              unprotectedUrl={unprotectedUrl}
              setUnprotectedUrl={setUnprotectedUrl}
              numRequests={numRequests}
              setNumRequests={setNumRequests}
              actuatorUrl={actuatorUrl}
              setActuatorUrl={setActuatorUrl}
              onRunBothTests={handleRunBothTests}
              onRunProtectedTest={handleRunProtectedTest}
              onRunUnprotectedTest={handleRunUnprotectedTest}
              onResetTests={resetResults}
              isRunning={isRunning}
            />
            
            <TestResultsComponent
              protectedResults={protectedResults}
              unprotectedResults={unprotectedResults}
              isRunning={isRunning}
              onExportResults={exportResults}
            />
            
            <TestHistoryPanel
              protectedResults={protectedResults}
              unprotectedResults={unprotectedResults}
            />
          </div>
          
          {/* Right Column (Metrics) */}
          <div className="lg:col-span-4 space-y-6">
            <ActuatorMetricsPanel
              metrics={metrics}
              onRefresh={handleRefreshMetrics}
              isLoading={isLoadingMetrics}
            />
            
            <LiveRequestsPanel
              requestLogs={requestLogs}
              protectedRunning={isRunningProtected}
              unprotectedRunning={isRunningUnprotected}
            />
            
            <RequestLogPanel
              logs={requestLogs}
              onClearLogs={clearLogs}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
