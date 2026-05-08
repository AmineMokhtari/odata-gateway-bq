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
import { Visitor } from './visitor.js';
import { BigQueryDialect } from './dialects/bigquery.js';
import * as AST from './ast.js';
export class Translator extends Visitor {
    params = {};
    paramCounter = 0;
    constructor(dialect) {
        super(dialect);
    }
    translate(node, context) {
        if (context) {
            this.params = context.params;
            this.paramCounter = context.counter;
        }
        else {
            this.params = {};
            this.paramCounter = 0;
        }
        // For a QueryNode, we return a structured object
        if (node instanceof AST.QueryNode) {
            const options = {};
            const selectNode = node.options.get('select');
            options.select = this.visit(selectNode || new AST.SelectNode(0, 0, []));
            const filterNode = node.options.get('filter');
            if (filterNode)
                options.where = this.visit(filterNode);
            const orderByNode = node.options.get('orderby');
            if (orderByNode)
                options.orderby = this.visit(orderByNode);
            const topNode = node.options.get('top');
            if (topNode)
                options.limit = this.visit(topNode);
            const skipNode = node.options.get('skip');
            if (skipNode)
                options.offset = this.visit(skipNode);
            const expandNode = node.options.get('expand');
            if (expandNode)
                options.expand = this.visit(expandNode);
            const searchNode = node.options.get('search');
            if (searchNode)
                options.search = this.visit(searchNode);
            const computeNode = node.options.get('compute');
            if (computeNode)
                options.compute = this.visit(computeNode);
            return { sql: '', params: this.params, counter: this.paramCounter, options };
        }
        const sql = this.visit(node);
        return { sql, params: this.params, counter: this.paramCounter, options: {} };
    }
    visitQuery(node) {
        // Legacy visitQuery, not used by translate() anymore but kept for Visitor contract
        return '';
    }
    visitFilter(node) {
        return this.dialect.renderFilter(this.visit(node.expression));
    }
    visitSelect(node) {
        const props = node.properties.map(p => this.dialect.escapeIdentifier(p.name));
        return this.dialect.renderSelect(props);
    }
    visitBinaryExpression(node) {
        const left = this.visit(node.left);
        const right = this.visit(node.right);
        return this.dialect.renderBinaryExpression(left, node.operator, right);
    }
    visitLiteral(node) {
        const paramName = `p${this.paramCounter++}`;
        this.params[paramName] = node.value;
        return this.dialect.renderLiteral(node.value, node.literalType, paramName);
    }
    visitProperty(node) {
        return this.dialect.escapeIdentifier(node.name);
    }
    visitOrderBy(node) {
        const items = node.items.map(item => {
            return `${this.dialect.escapeIdentifier(item.property.name)} ${item.direction.toUpperCase()}`;
        });
        return `ORDER BY ${items.join(', ')}`;
    }
    visitExpand(node) {
        return node.items.map(item => this.visit(item));
    }
    visitExpandItem(node) {
        const navProp = node.navigationProperty.name;
        const nestedTable = this.dialect.escapeIdentifier(navProp);
        let innerSelect = 'SELECT *';
        let innerWhere = '';
        let innerOrderby = '';
        let innerLimit = '';
        if (node.query) {
            // Recurse using current context to accumulate params
            const result = this.translate(node.query, { params: this.params, counter: this.paramCounter });
            this.paramCounter = result.counter; // Update counter
            innerSelect = result.options.select || 'SELECT *';
            innerWhere = result.options.where || '';
            innerOrderby = result.options.orderby || '';
            innerLimit = result.options.limit ? ` LIMIT ${result.options.limit}` : '';
        }
        // Pattern: BigQuery Sub-query
        // Note: This logic assumes the caller will handle the relationship join columns.
        // For the translator, we provide the subquery structure.
        return `ARRAY(${innerSelect} FROM ${nestedTable} ${innerWhere}${innerOrderby}${innerLimit}) AS \`${navProp}\``;
    }
    visitSearch(node) {
        const paramName = `p${this.paramCounter++}`;
        this.params[paramName] = node.expression;
        // Note: 't' is the alias for the main table in the final query
        return `SEARCH(t, @${paramName})`;
    }
    visitCompute(node) {
        return node.items.map(item => this.visit(item));
    }
    visitComputeItem(node) {
        const expr = this.visit(node.expression);
        return `(${expr}) AS \`${node.alias}\``;
    }
}
// CLI / Execution entry point
export function runTranslation(astData, policy = 'OPTIMIZE_FOR_COST') {
    const dialect = new BigQueryDialect(policy);
    const translator = new Translator(dialect);
    // Reconstruct AST from JSON (simplified)
    // In a real scenario, we'd have a factory to turn JSON back into typed classes
    // For the demo, we assume the input is already structured correctly or cast it.
    return translator.translate(astData);
}
//# sourceMappingURL=translator.js.map