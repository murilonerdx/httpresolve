import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw, ShieldAlert, ShieldOff } from 'lucide-react';

interface ConfigPanelProps {
  protectedUrl: string;
  setProtectedUrl: (url: string) => void;
  unprotectedUrl: string;
  setUnprotectedUrl: (url: string) => void;
  numRequests: number;
  setNumRequests: (num: number) => void;
  actuatorUrl: string;
  setActuatorUrl: (url: string) => void;
  onRunBothTests: () => void;
  onRunProtectedTest: () => void;
  onRunUnprotectedTest: () => void;
  onResetTests: () => void;
  isRunning: boolean;
}

export function ConfigPanel({
  protectedUrl,
  setProtectedUrl,
  unprotectedUrl,
  setUnprotectedUrl,
  numRequests,
  setNumRequests,
  actuatorUrl,
  setActuatorUrl,
  onRunBothTests,
  onRunProtectedTest,
  onRunUnprotectedTest,
  onResetTests,
  isRunning
}: ConfigPanelProps) {
  const incrementRequests = () => {
    setNumRequests(Math.min(numRequests + 10, 1000));
  };

  const decrementRequests = () => {
    setNumRequests(Math.max(numRequests - 10, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <svg className="h-5 w-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M12 2v2" />
          <path d="M12 22v-2" />
          <path d="m17 20.66-1-1.73" />
          <path d="M11 10.27 7 3.34" />
          <path d="m20.66 17-1.73-1" />
          <path d="m3.34 7 1.73 1" />
          <path d="M14 12h8" />
          <path d="M2 12h2" />
          <path d="m20.66 7-1.73 1" />
          <path d="m3.34 17 1.73-1" />
          <path d="m17 3.34-1 1.73" />
          <path d="m7 20.66 1-1.73" />
        </svg>
        Configuração de Teste
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="protectedUrl" className="block text-sm font-medium text-neutral-700 mb-1">URL do Endpoint Protegido</Label>
          <Input
            id="protectedUrl"
            type="text"
            value={protectedUrl}
            onChange={(e) => setProtectedUrl(e.target.value)}
            className="w-full"
            disabled={isRunning}
          />
        </div>
        <div>
          <Label htmlFor="unprotectedUrl" className="block text-sm font-medium text-neutral-700 mb-1">URL do Endpoint Não Protegido</Label>
          <Input
            id="unprotectedUrl"
            type="text"
            value={unprotectedUrl}
            onChange={(e) => setUnprotectedUrl(e.target.value)}
            className="w-full"
            disabled={isRunning}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <Label htmlFor="numRequests" className="block text-sm font-medium text-neutral-700 mb-1">Número de Requisições Paralelas</Label>
          <div className="flex">
            <Input
              id="numRequests"
              type="number"
              value={numRequests}
              onChange={(e) => setNumRequests(Number(e.target.value))}
              min={1}
              max={1000}
              className="flex-1 rounded-r-none"
              disabled={isRunning}
            />
            <div className="flex">
              <button
                className="px-3 py-2 bg-neutral-100 border-y border-r border-neutral-300 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                onClick={decrementRequests}
                disabled={isRunning || numRequests <= 1}
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                className="px-3 py-2 bg-neutral-100 border-y border-r border-neutral-300 rounded-r-md text-neutral-700 hover:bg-neutral-200 disabled:opacity-50"
                onClick={incrementRequests}
                disabled={isRunning || numRequests >= 1000}
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="actuatorUrl" className="block text-sm font-medium text-neutral-700 mb-1">URL do Metrics Actuator</Label>
          <Input
            id="actuatorUrl"
            type="text"
            value={actuatorUrl}
            onChange={(e) => setActuatorUrl(e.target.value)}
            className="w-full"
            disabled={isRunning}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <Button
            variant="default"
            size="sm"
            className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            onClick={onRunBothTests}
            disabled={isRunning}
          >
            <Play className="h-4 w-4 mr-2" />
            Executar Comparação
          </Button>
        </div>
        <div className="col-span-2 md:col-span-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center border-red-200 text-red-600 hover:bg-red-50"
            onClick={onResetTests}
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar Testes
          </Button>
        </div>
        <div className="col-span-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center border-green-200 text-green-600 hover:bg-green-50"
            onClick={onRunProtectedTest}
            disabled={isRunning}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Testar Protegido
          </Button>
        </div>
        <div className="col-span-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={onRunUnprotectedTest}
            disabled={isRunning}
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Testar Não Protegido
          </Button>
        </div>
      </div>
    </div>
  );
}
