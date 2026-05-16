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
import { getConnectionStatus } from '@/app/actions/odata';

interface UseConnectionStatusProps {
  projectId: string;
  datasetId: string;
  interval?: number;
}

export function useConnectionStatus({ projectId, datasetId, interval = 5000 }: UseConnectionStatusProps) {
  const [state, setState] = useState<ConnectionState>('listening');
  const [lastActive, setLastActive] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!projectId || !datasetId) return;

    try {
      // Use Server Action (Story 9.1)
      const data = await getConnectionStatus(projectId, datasetId);
      
      if (data.status === 'connected') {
        setState('connected');
        setLastActive(data.lastActive);
      } else if (data.status === 'anonymous') {
        setError('Not authenticated');
      } else {
        setState('listening');
      }
    } catch (err: any) {
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
