import React from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type ChartType = 'bar' | 'line' | 'pie' | 'radar';

interface ChartWrapperProps {
  type: ChartType;
  data: any[];
  width?: number | string;
  height?: number | string;
  className?: string;
  barConfigs?: {
    dataKey: string;
    color?: string;
    name?: string;
  }[];
  lineConfigs?: {
    dataKey: string;
    color?: string;
    name?: string;
    strokeWidth?: number;
    dot?: boolean;
    fill?: string;
  }[];
  pieConfigs?: {
    dataKey: string;
    nameKey?: string;
    colors?: string[];
    innerRadius?: number;
    outerRadius?: number;
    labelLine?: boolean;
  };
  radarConfigs?: {
    dataKeys: string[];
    colors?: string[];
    fillOpacity?: number;
    angleAxisKey?: string;
  };
  xAxisKey?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  stackId?: string;
}

const defaultColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ChartWrapper({
  type,
  data,
  width = '100%',
  height = 300,
  className = '',
  barConfigs,
  lineConfigs,
  pieConfigs,
  radarConfigs,
  xAxisKey = 'name',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  legendPosition = 'bottom',
  stackId,
}: ChartWrapperProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Helper para converter de tipo 'left'/'right'/'top'/'bottom' para o que o Recharts espera
  const getLegendPosition = (position: 'top' | 'right' | 'bottom' | 'left'): 'top' | 'bottom' => {
    return position === 'bottom' || position === 'top' ? position : 'bottom';
  };

  // Helper para conversão de alinhamento horizontal para Recharts
  const getLegendAlign = (position: 'top' | 'right' | 'bottom' | 'left'): 'left' | 'center' | 'right' => {
    if (position === 'left') return 'left';
    if (position === 'right') return 'right';
    return 'center';
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && (
              <Legend 
                layout="horizontal" 
                verticalAlign={getLegendPosition(legendPosition)}
                align={getLegendAlign(legendPosition)}
              />
            )}
            {barConfigs?.map((config, index) => (
              <Bar
                key={config.dataKey}
                dataKey={config.dataKey}
                name={config.name || config.dataKey}
                fill={config.color || defaultColors[index % defaultColors.length]}
                stackId={stackId}
              />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && (
              <Legend 
                layout="horizontal" 
                verticalAlign={getLegendPosition(legendPosition)}
                align={getLegendAlign(legendPosition)}
              />
            )}
            {lineConfigs?.map((config, index) => {
              const color = config.color || defaultColors[index % defaultColors.length];
              return (
                <Line
                  key={config.dataKey}
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.name || config.dataKey}
                  stroke={color}
                  strokeWidth={config.strokeWidth || 2}
                  dot={config.dot ?? true}
                  activeDot={{ r: 6 }}
                  fill={config.fill || 'transparent'}
                />
              );
            })}
          </LineChart>
        );
      case 'pie':
        if (!pieConfigs) return null;
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={pieConfigs.dataKey}
              nameKey={pieConfigs.nameKey || 'name'}
              innerRadius={pieConfigs.innerRadius || 0}
              outerRadius={pieConfigs.outerRadius || '80%'}
              fill={defaultColors[0]}
              labelLine={pieConfigs.labelLine !== false}
              label={pieConfigs.labelLine !== false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    pieConfigs.colors
                      ? pieConfigs.colors[index % pieConfigs.colors.length]
                      : defaultColors[index % defaultColors.length]
                  }
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && (
              <Legend 
                layout="horizontal" 
                verticalAlign={getLegendPosition(legendPosition)}
                align={getLegendAlign(legendPosition)}
              />
            )}
          </PieChart>
        );
      case 'radar':
        if (!radarConfigs) return null;
        return (
          <RadarChart outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={radarConfigs.angleAxisKey || 'subject'} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {radarConfigs.dataKeys.map((dataKey, index) => {
              const color = radarConfigs.colors?.[index % (radarConfigs.colors.length || 1)] || 
                defaultColors[index % defaultColors.length];
              return (
                <Radar
                  key={dataKey}
                  name={dataKey}
                  dataKey={dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={radarConfigs.fillOpacity || 0.6}
                />
              );
            })}
            {showTooltip && <Tooltip />}
            {showLegend && (
              <Legend 
                layout="horizontal" 
                verticalAlign={getLegendPosition(legendPosition)}
                align={getLegendAlign(legendPosition)}
              />
            )}
          </RadarChart>
        );
      default:
        return <BarChart data={data}><XAxis/><YAxis/></BarChart>;
    }
  };

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart() || <BarChart data={[{name: 'Sem dados', value: 0}]}><XAxis/><YAxis/></BarChart>}
      </ResponsiveContainer>
    </div>
  );
}
