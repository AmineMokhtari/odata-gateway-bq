'use client'

import { useState, useEffect } from 'react';

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

export const useEntityMetadata = (baseUrl: string, entitySet: string) => {
  const [navProps, setNavProps] = useState<NavigationProperty[]>([]);
  const [properties, setProperties] = useState<EntityProperty[]>([]);
  const [tableDescription, setTableDescription] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!baseUrl || !entitySet) {
      setNavProps([]);
      setProperties([]);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/$metadata`);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        const xml = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        
        // 1. Find the EntityType name for the given EntitySet
        const entitySetNode = doc.querySelector(`EntitySet[Name="${entitySet}"]`);
        if (!entitySetNode) return;
        
        const entityTypeFull = entitySetNode.getAttribute('EntityType');
        if (!entityTypeFull) return;
        
        const entityTypeName = entityTypeFull.split('.').pop();
        
        // 2. Find the EntityType node
        const entityTypeNode = doc.querySelector(`EntityType[Name="${entityTypeName}"]`);
        if (!entityTypeNode) return;
        
        // 3. Extract Standard Properties
        const props = Array.from(entityTypeNode.querySelectorAll('Property')).map(node => {
          const type = node.getAttribute('Type') || '';
          const numericTypes = ['Edm.Int64', 'Edm.Int32', 'Edm.Double', 'Edm.Decimal', 'Edm.Single'];
          
          const descNode = node.querySelector('Annotation[Term="Org.OData.Core.V1.Description"]');
          const description = descNode ? descNode.getAttribute('String') || undefined : undefined;

          return {
            name: node.getAttribute('Name') || '',
            type: type,
            isNumeric: numericTypes.includes(type),
            description
          };
        });

        const tableDescNode = Array.from(entityTypeNode.children).find(
          child => child.nodeName === 'Annotation' && child.getAttribute('Term') === 'Org.OData.Core.V1.Description'
        );
        const tableDesc = tableDescNode ? tableDescNode.getAttribute('String') || undefined : undefined;
        setTableDescription(tableDesc);
        
        // 4. Extract NavigationProperties
        const navs = Array.from(entityTypeNode.querySelectorAll('NavigationProperty')).map(node => ({
          name: node.getAttribute('Name') || '',
          type: node.getAttribute('Type') || ''
        }));
        
        setProperties(props);
        setNavProps(navs);
      } catch (err) {
        console.error('Error parsing entity metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [baseUrl, entitySet]);

  return { navProps, properties, tableDescription, loading };
};
