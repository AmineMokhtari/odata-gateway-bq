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

'use server'

import { gatewayClient } from '@/lib/gateway-client';
import { XMLParser } from 'fast-xml-parser';

export interface NavigationProperty {
  name: string;
  type: string;
}

export interface EntityProperty {
  name: string;
  type: string;
  isNumeric: boolean;
  description?: string;
}

export interface MetadataResult {
  properties: EntityProperty[];
  navProps: NavigationProperty[];
  tableDescription?: string;
  error?: any;
}

export interface ConnectionStatusResult {
  status: 'listening' | 'connected' | 'anonymous';
  lastActive: number | null;
  serverTime: number;
  error?: any;
}

/**
 * Fetches the OData Service Root (list of tables/entity sets)
 */
export async function getServiceRoot(projectId: string, datasetId: string) {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}`, {
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: data.error || { message: `Gateway returned ${response.status}` } };
    }

    return data;
  } catch (err: any) {
    console.error(`[odata] Failed to fetch service root for ${projectId}/${datasetId}:`, err.message);
    return { error: err.data?.error || { message: err.message || 'Failed to connect to gateway' } };
  }
}

/**
 * Fetches and parses OData Metadata
 */
export async function getMetadata(projectId: string, datasetId: string, entitySet: string): Promise<MetadataResult> {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}/$metadata`, {
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
    const xml = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true
    });
    
    const jsonObj = parser.parse(xml);
    const schema = jsonObj['edmx:Edmx']['edmx:DataServices']['Schema'];
    
    // OData metadata can have multiple EntityTypes and EntitySets
    const entityTypes = Array.isArray(schema.EntityType) ? schema.EntityType : [schema.EntityType];
    const entitySets = Array.isArray(schema.EntityContainer.EntitySet) 
      ? schema.EntityContainer.EntitySet 
      : [schema.EntityContainer.EntitySet];

    // 1. Find EntityType name from EntitySet
    console.log(`[getMetadata] Looking for entitySet: "${entitySet}" in projectId: "${projectId}", datasetId: "${datasetId}"`);
    console.log('[getMetadata] Available EntitySets:', JSON.stringify(entitySets, null, 2));
    
    let targetSet = entitySets.find((s: any) => s.Name?.toLowerCase() === entitySet?.toLowerCase());
    
    if (!targetSet) {
      console.log(`[getMetadata] Direct EntitySet not found for "${entitySet}". Attempting NavigationProperty resolution fallback...`);
      // Resolve entitySet as a fully-qualified or short navigation property name
      const localEntitySetName = entitySet.split('.').pop()?.toLowerCase();
      let foundType: string | undefined;
      
      for (const et of entityTypes) {
        if (et.NavigationProperty) {
          const navs = Array.isArray(et.NavigationProperty) ? et.NavigationProperty : [et.NavigationProperty];
          const matchedNav = navs.find((n: any) => 
            n.Name?.toLowerCase() === localEntitySetName || 
            n.Name?.toLowerCase() === entitySet.toLowerCase()
          );
          if (matchedNav) {
            foundType = matchedNav.Type;
            console.log(`[getMetadata] Found matching NavigationProperty: "${matchedNav.Name}" with type: "${foundType}"`);
            break;
          }
        }
      }
      
      if (foundType) {
        // Extract base EntityType name (e.g. "Collection(interactions.Customer)" -> "Customer")
        const baseTypeName = foundType.replace(/Collection\(([^)]+)\)/, '$1').split('.').pop()?.toLowerCase();
        
        // Find corresponding EntitySet exposing this EntityType
        targetSet = entitySets.find((s: any) => {
          const setTypeName = s.EntityType?.split('.').pop()?.toLowerCase();
          return setTypeName === baseTypeName;
        });
        
        if (targetSet) {
          console.log(`[getMetadata] Successfully resolved navigation property to target EntitySet: "${targetSet.Name}"`);
        }
      }
    }

    if (!targetSet) {
      console.error(`[getMetadata] FAILED: EntitySet "${entitySet}" not found in metadata container!`);
      throw new Error(`EntitySet ${entitySet} not found in metadata`);
    }
    
    const entityTypeName = targetSet.EntityType.split('.').pop();
    
    // 2. Find EntityType definition
    const targetType = entityTypes.find((t: any) => t.Name?.toLowerCase() === entityTypeName?.toLowerCase());
    if (!targetType) throw new Error(`EntityType ${entityTypeName} not found in metadata`);

    // 3. Extract Properties
    const rawProps = Array.isArray(targetType.Property) ? targetType.Property : [targetType.Property];
    const properties = rawProps.map((p: any) => {
      const type = p.Type || '';
      const numericTypes = ['Edm.Int64', 'Edm.Int32', 'Edm.Double', 'Edm.Decimal', 'Edm.Single'];
      
      // Extract Description from Annotations
      let description: string | undefined;
      if (p.Annotation) {
        const annotations = Array.isArray(p.Annotation) ? p.Annotation : [p.Annotation];
        const descAnn = annotations.find((a: any) => a.Term === 'Org.OData.Core.V1.Description');
        description = descAnn?.String;
      }

      return {
        name: p.Name,
        type: type,
        isNumeric: numericTypes.includes(type),
        description
      };
    });

    // 4. Extract Navigation Properties
    let navProps: NavigationProperty[] = [];
    if (targetType.NavigationProperty) {
      const rawNavs = Array.isArray(targetType.NavigationProperty) 
        ? targetType.NavigationProperty 
        : [targetType.NavigationProperty];
      navProps = rawNavs.map((n: any) => ({
        name: n.Name,
        type: n.Type
      }));
    }

    // 5. Extract Table Description
    let tableDescription: string | undefined;
    if (targetType.Annotation) {
      const annotations = Array.isArray(targetType.Annotation) ? targetType.Annotation : [targetType.Annotation];
      const descAnn = annotations.find((a: any) => a.Term === 'Org.OData.Core.V1.Description');
      tableDescription = descAnn?.String;
    }

    return { properties, navProps, tableDescription };
  } catch (err: any) {
    console.error(`[odata] Failed to parse metadata for ${entitySet}:`, err.message);
    return {
      properties: [],
      navProps: [],
      error: err.data?.error || { message: err.message, elena_tip: err.data?.error?.elena_tip }
    };
  }
}

/**
 * Fetches connection pulse status (Story 4.3 Migration)
 */
export async function getConnectionStatus(projectId: string, datasetId: string): Promise<ConnectionStatusResult> {
  try {
    const response = await gatewayClient.get(`/v1/connection-status/${projectId}/${datasetId}`, {
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`Failed to fetch connection status: ${response.status}`);
    return await response.json();
  } catch (err: any) {
    console.error(`[odata] Connection status error for ${projectId}/${datasetId}:`, err.message);
    return { 
      status: 'listening', 
      lastActive: null, 
      serverTime: Date.now(),
      error: err.data?.error || { message: err.message, elena_tip: err.data?.error?.elena_tip }
    };
  }
}

/**
 * Fetches query explanation / dry-run data (Story 3.1 Migration)
 */
export async function explainQuery(projectId: string, datasetId: string, entitySet: string, query: string) {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}/${entitySet}?${query}&explain=true`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || `Gateway returned ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[odata] Explain failed for ${entitySet}:`, err.message);
    return { error: err.data?.error || { message: err.message, elena_tip: err.data?.error?.elena_tip } };
  }
}

/**
 * Executes a pre-execution dry-run audit for visual builder queries
 */
export async function dryRunQueryAction(projectId: string, datasetId: string, entitySet: string, query: string) {
  try {
    const response = await gatewayClient.get(`/v1/${projectId}/${datasetId}/${entitySet}?${query}&explain=true`, {
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: {
          status: response.status,
          code: data.error?.code || 'ExplainFailed',
          message: data.error?.message || 'Explain failed',
          details: data.error?.details || [],
          elena_tip: data.error?.elena_tip
        }
      };
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error(`[odata] Dry-run failed for ${entitySet}:`, err.message);
    return {
      success: false,
      error: {
        status: err.status || 500,
        code: err.data?.error?.code || 'NetworkError',
        message: err.message || 'Network error during dry-run',
        details: err.data?.error?.details || [],
        elena_tip: err.data?.error?.elena_tip
      }
    };
  }
}
