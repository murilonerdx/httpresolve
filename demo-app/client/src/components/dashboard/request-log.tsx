import React from 'react';
import { Button } from '@/components/ui/button';
import { RequestLog } from '@/lib/types';
import { X, CheckCircle, XCircle, List } from 'lucide-react';

interface RequestLogPanelProps {
  logs: RequestLog[];
  onClearLogs: () => void;
}

export function RequestLogPanel({ logs, onClearLogs }: RequestLogPanelProps) {
  // Format time
  const formatTime = (time: number) => {
    return `${time.toFixed(3)}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="font-semibold flex items-center">
          <List className="h-5 w-5 mr-2 text-primary" />
          Request Log
        </h2>
        <Button size="icon" variant="ghost" onClick={onClearLogs}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="custom-scrollbar overflow-y-auto h-80">
        <div className="divide-y divide-neutral-100">
          {logs.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted-foreground">
              No requests logged yet. Run a test to see results.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="px-4 py-2 flex items-start">
                <div className="shrink-0 mt-0.5">
                  {log.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="ml-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium">{log.type}:</span>
                    <span className="ml-1 bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-xs">{log.status}</span>
                    <span className="ml-1.5 text-neutral-500 text-xs">{formatTime(log.time)}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">ID: {log.id}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
