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
export class BigQueryDialect {
    policy;
    constructor(policy = 'OPTIMIZE_FOR_COST') {
        this.policy = policy;
    }
    escapeIdentifier(name) {
        return `\`${name}\``;
    }
    renderLiteral(value, type, paramName) {
        // Return the parameter reference for BigQuery
        return `@${paramName}`;
    }
    renderBinaryExpression(left, operator, right) {
        const odataToSql = {
            'eq': '=', 'ne': '!=', 'gt': '>', 'ge': '>=', 'lt': '<', 'le': '<=',
            'and': 'AND', 'or': 'OR',
            'add': '+', 'sub': '-', 'mul': '*', 'div': '/', 'mod': '%'
        };
        const sqlOp = odataToSql[operator] || operator.toUpperCase();
        return `(${left} ${sqlOp} ${right})`;
    }
    renderUnaryExpression(operator, expression) {
        return `${operator.toUpperCase()} ${expression}`;
    }
    renderSelect(properties) {
        if (properties.length === 0)
            return 'SELECT *';
        return `SELECT ${properties.join(', ')}`;
    }
    renderFilter(expression) {
        return `WHERE ${expression}`;
    }
    /**
     * Example of Policy-driven pattern selection for $expand
     */
    renderExpand(parentTable, nestedTable) {
        if (this.policy === 'OPTIMIZE_FOR_COST') {
            // Pattern: Array Subquery (Saves scan costs if child table is large)
            return `ARRAY(SELECT AS STRUCT * FROM ${this.escapeIdentifier(nestedTable)} WHERE parent_id = t.id)`;
        }
        else {
            // Pattern: Left Join (Faster latency for small/medium datasets)
            return `LEFT JOIN ${this.escapeIdentifier(nestedTable)} ON ...`;
        }
    }
}
//# sourceMappingURL=bigquery.js.map