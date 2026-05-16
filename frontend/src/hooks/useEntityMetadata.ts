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

import { useState, useEffect } from 'react';
import { getMetadata, type NavigationProperty, type EntityProperty } from '@/app/actions/odata';

export type { NavigationProperty, EntityProperty };

export const useEntityMetadata = (projectId: string, datasetId: string, entitySet: string) => {
  const [navProps, setNavProps] = useState<NavigationProperty[]>([]);
  const [properties, setProperties] = useState<EntityProperty[]>([]);
  const [tableDescription, setTableDescription] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !datasetId || !entitySet) {
      setNavProps([]);
      setProperties([]);
      setTableDescription(undefined);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const data = await getMetadata(projectId, datasetId, entitySet);
        
        setProperties(data.properties);
        setNavProps(data.navProps);
        setTableDescription(data.tableDescription);
      } catch (err: any) {
        console.error('Failed to fetch entity metadata via Server Action:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [projectId, datasetId, entitySet]);

  return { navProps, properties, tableDescription, loading };
};
