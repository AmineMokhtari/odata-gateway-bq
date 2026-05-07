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

import { Dialect } from '../visitor.js';

export type TranslationPolicy = 'OPTIMIZE_FOR_COST' | 'OPTIMIZE_FOR_LATENCY';

export class BigQueryDialect implements Dialect {
  constructor(private policy: TranslationPolicy = 'OPTIMIZE_FOR_COST') {}

  public escapeIdentifier(name: string): string {
    return `\`${name}\``;
  }

  public renderLiteral(value: any, type: string, paramName: string): string {
    // Return the parameter reference for BigQuery
    return `@${paramName}`;
  }

  public renderBinaryExpression(left: string, operator: string, right: string): string {
    const odataToSql: Record<string, string> = {
      'eq': '=', 'ne': '!=', 'gt': '>', 'ge': '>=', 'lt': '<', 'le': '<=',
      'and': 'AND', 'or': 'OR',
      'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'mod': '%'
    };
    const sqlOp = odataToSql[operator] || operator.toUpperCase();
    return `(${left} ${sqlOp} ${right})`;
  }

  public renderUnaryExpression(operator: string, expression: string): string {
    return `${operator.toUpperCase()} ${expression}`;
  }

  public renderSelect(properties: string[]): string {
    if (properties.length === 0) return 'SELECT *';
    return `SELECT ${properties.join(', ')}`;
  }

  public renderFilter(expression: string): string {
    return `WHERE ${expression}`;
  }

  /**
   * Example of Policy-driven pattern selection for $expand
   */
  public renderExpand(parentTable: string, nestedTable: string): string {
    if (this.policy === 'OPTIMIZE_FOR_COST') {
      // Pattern: Array Subquery (Saves scan costs if child table is large)
      return `ARRAY(SELECT AS STRUCT * FROM ${this.escapeIdentifier(nestedTable)} WHERE parent_id = t.id)`;
    } else {
      // Pattern: Left Join (Faster latency for small/medium datasets)
      return `LEFT JOIN ${this.escapeIdentifier(nestedTable)} ON ...`;
    }
  }
}
