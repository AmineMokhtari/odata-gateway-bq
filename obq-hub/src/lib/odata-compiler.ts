/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface QueryNode {
  tableName: string;
  select: string[];
  expands: Record<string, QueryNode>;
}

/**
 * Compiles a parenthesized nested OData V4 query string based on visual selected paths.
 */
export function compileODataUrl(
  serviceRoot: string,
  rootTable: string,
  selectedPaths: string[]
): string {
  if (!rootTable) return '';

  const rootNode: QueryNode = {
    tableName: rootTable,
    select: [],
    expands: {}
  };

  // Gather selected columns for root table
  selectedPaths.forEach(path => {
    if (path.includes('.') && !path.includes('->')) {
      const [table, col] = path.split('.');
      if (table === rootTable) {
        rootNode.select.push(col);
      }
    }
  });

  // Recursive expands builder
  function buildExpands(currentNode: QueryNode) {
    const parentTable = currentNode.tableName;
    
    selectedPaths.forEach(path => {
      if (path.includes('->')) {
        const [source, target] = path.split('->');
        if (source === parentTable) {
          if (selectedPaths.includes(target)) {
            const childNode: QueryNode = {
              tableName: target,
              select: [],
              expands: {}
            };
            
            selectedPaths.forEach(p => {
              if (p.includes('.') && !p.includes('->')) {
                const [table, col] = p.split('.');
                if (table === target) {
                  childNode.select.push(col);
                }
              }
            });

            buildExpands(childNode);
            currentNode.expands[target] = childNode;
          }
        }
      }
    });
  }

  buildExpands(rootNode);

  // Stringifier compiler
  function compileNode(node: QueryNode, isTopLevel = false): string {
    const selectStr = node.select.length > 0 ? `$select=${node.select.join(',')}` : '';
    
    const expandParts = Object.entries(node.expands).map(([relation, child]) => {
      const childQuery = compileNode(child, false);
      return childQuery ? `${relation}(${childQuery})` : relation;
    });
    const expandStr = expandParts.length > 0 ? `$expand=${expandParts.join(',')}` : '';
    
    const separator = isTopLevel ? '&' : ';';
    const parts = [selectStr, expandStr].filter(Boolean);
    return parts.join(separator);
  }

  const queryParams = compileNode(rootNode, true);
  return queryParams ? `${serviceRoot}/${rootTable}?${queryParams}` : `${serviceRoot}/${rootTable}`;
}
