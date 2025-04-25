import React, { useEffect, useState } from 'react';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { RequestLog } from '@/lib/types';
import { BarChart } from 'lucide-react';

interface LiveRequestsProps {
  requestLogs: RequestLog[];
  protectedRunning: boolean;
  unprotectedRunning: boolean;
}

export function LiveRequestsPanel({ requestLogs, protectedRunning, unprotectedRunning }: LiveRequestsProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Create a timeline of the last 30 seconds
    const generateTimePoints = () => {
      const now = Date.now();
      const timePoints = Array.from({ length: 20 }, (_, i) => {
        const timePoint = now - (19 - i) * 1000; // Latest 20 seconds
        return {
          time: timePoint,
          label: `-${19 - i}s`,
          Protected: 0,
          Unprotected: 0,
        };
      });

      // Count requests in each time bucket
      requestLogs.forEach(log => {
        if (!log.timestamp) return;
        
        // Find which time bucket this request belongs to
        const bucketIndex = timePoints.findIndex((point, index, array) => {
          if (index === array.length - 1) return log.timestamp! >= point.time;
          return log.timestamp! >= point.time && log.timestamp! < array[index + 1].time;
        });

        if (bucketIndex !== -1) {
          if (log.type === 'PROTECTED') {
            timePoints[bucketIndex].Protected++;
          } else {
            timePoints[bucketIndex].Unprotected++;
          }
        }
      });

      setChartData(timePoints.map(point => ({
        name: point.label,
        Protected: point.Protected,
        Unprotected: point.Unprotected
      })));
    };

    // Initial data
    generateTimePoints();

    // Update every second
    const interval = setInterval(generateTimePoints, 1000);
    
    return () => clearInterval(interval);
  }, [requestLogs]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          Live Requests
        </h2>
      </div>
      
      <div className="p-4 h-64">
        <ChartWrapper
          type="line"
          data={chartData}
          lineConfigs={[
            { 
              dataKey: 'Protected', 
              color: 'rgba(0, 114, 245, 1)',
              fill: 'rgba(0, 114, 245, 0.1)',
              name: 'Protected'
            },
            { 
              dataKey: 'Unprotected', 
              color: 'rgba(239, 68, 68, 1)',
              fill: 'rgba(239, 68, 68, 0.1)',
              name: 'Unprotected'
            }
          ]}
          xAxisKey="name"
          height="100%"
        />
      </div>
    </div>
  );
}
