import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Activity } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface HeaderProps {
  isConnected: boolean;
  onRefreshMetrics: () => void;
}

export function Header({ isConnected, onRefreshMetrics }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-neutral-800">ResilientAPI Tester</h1>
        </div>

        <div className="flex items-center space-x-6">
          <nav className="flex items-center space-x-1">
            <Link href="/">
              <div className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                location === '/' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
                Dashboard
              </div>
            </Link>
            <Link href="/analise">
              <div className={`px-3 py-2 text-sm font-medium rounded-md flex items-center cursor-pointer ${
                location === '/analise' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
                <Activity className="h-4 w-4 mr-1" />
                Análise
              </div>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <span className="flex items-center text-sm text-neutral-600">
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <Button size="sm" variant="default" onClick={onRefreshMetrics}>
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Atualizar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
