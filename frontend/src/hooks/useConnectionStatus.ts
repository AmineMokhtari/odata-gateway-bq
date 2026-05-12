/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client'

import { useState, useEffect, useCallback } from 'react';
import { type ConnectionState } from '@/components/catalog/SuccessPulseBadge';

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
      const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || (typeof window !== 'undefined' ? `${window.location.origin}/web/api/gateway` : 'http://localhost:3005');
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
      // Silence standard network fetch errors in console as they are expected during startup/restarts
      if (err.message && !/fetch/i.test(err.message)) {
        console.error('Polling error:', err.message);
      }
      setError(err.message);
      setState('listening');
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
