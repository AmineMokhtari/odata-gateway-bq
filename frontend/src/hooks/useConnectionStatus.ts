'use client'

import { useState, useEffect, useCallback } from 'react';
import { type ConnectionState } from '@/components/marketplace/SuccessPulseBadge';

interface UseConnectionStatusProps {
  projectId: string;
  datasetId: string;
  interval?: number;
}

interface ConnectionStatusResponse {
  status: 'listening' | 'connected' | 'anonymous';
  lastActive: number | null;
  serverTime: number;
}

export function useConnectionStatus({ projectId, datasetId, interval = 5000 }: UseConnectionStatusProps) {
  const [state, setState] = useState<ConnectionState>('listening');
  const [lastActive, setLastActive] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!projectId || !datasetId) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/v1/connection-status/${projectId}/${datasetId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch connection status');
      }

      const data: ConnectionStatusResponse = await response.json();
      
      if (data.status === 'connected') {
        setState('connected');
        setLastActive(data.lastActive);
      } else if (data.status === 'anonymous') {
        setError('Not authenticated');
      } else {
        setState('listening');
      }
    } catch (err: any) {
      console.error('Polling error:', err.message);
      setError(err.message);
    }
  }, [projectId, datasetId]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Setup polling
    const timer = setInterval(() => {
      fetchStatus();
    }, interval);

    return () => clearInterval(timer);
  }, [fetchStatus, interval]);

  return { state, lastActive, error };
}
