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

import { Visitor, Dialect } from './visitor.js';
import { BigQueryDialect, TranslationPolicy } from './dialects/bigquery.js';
import * as AST from './ast.js';

export class Translator extends Visitor {
  private params: Record<string, any> = {};
  private paramCounter = 0;
  private tableStack: string[] = [];

  constructor(
    dialect: Dialect,
    private getRelationship?: ((parentTable: string, navProp: string) => { referencedTable: string, column: string, referencedColumn: string } | null)
  ) {
    super(dialect);
  }

  public translate(
    node: AST.ASTNode,
    context?: { params?: Record<string, any>, counter?: number, currentTable?: string }
  ): { sql: string, params: Record<string, any>, counter: number, options: Record<string, any> } {
    if (context) {
      this.params = context.params || {};
      this.paramCounter = context.counter || 0;
      if (context.currentTable) {
        this.tableStack = [context.currentTable];
      } else {
        this.tableStack = [];
      }
    } else {
      this.params = {};
      this.paramCounter = 0;
      this.tableStack = [];
    }
    
    // For a QueryNode, we return a structured object
    if (node instanceof AST.QueryNode) {
      const options: Record<string, any> = {};
      
      const selectNode = node.options.get('select') as AST.SelectNode;
      options.select = this.visit(selectNode || new AST.SelectNode(0, 0, []));

      const filterNode = node.options.get('filter') as AST.FilterNode;
      if (filterNode) options.where = this.visit(filterNode);

      const orderByNode = node.options.get('orderby') as AST.OrderByNode;
      if (orderByNode) options.orderby = this.visit(orderByNode);

      const topNode = node.options.get('top') as AST.LiteralNode;
      if (topNode) options.limit = this.visit(topNode);

      const skipNode = node.options.get('skip') as AST.LiteralNode;
      if (skipNode) options.offset = this.visit(skipNode);

      const expandNode = node.options.get('expand') as AST.ExpandNode;
      if (expandNode) options.expand = this.visit(expandNode);

      const searchNode = node.options.get('search') as AST.SearchNode;
      if (searchNode) options.search = this.visit(searchNode);

      const computeNode = node.options.get('compute') as AST.ComputeNode;
      if (computeNode) options.compute = this.visit(computeNode);

      return { sql: '', params: this.params, counter: this.paramCounter, options };
    }

    const sql = this.visit(node);
    return { sql, params: this.params, counter: this.paramCounter, options: {} };
  }

  protected visitQuery(node: AST.QueryNode): string {
    // Legacy visitQuery, not used by translate() anymore but kept for Visitor contract
    return '';
  }

  protected visitFilter(node: AST.FilterNode): string {
    return this.dialect.renderFilter(this.visit(node.expression));
  }

  protected visitSelect(node: AST.SelectNode): string {
    const props = node.properties.map(p => this.dialect.escapeIdentifier(p.name));
    return this.dialect.renderSelect(props);
  }

  protected visitBinaryExpression(node: AST.BinaryExpressionNode): string {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return this.dialect.renderBinaryExpression(left, node.operator, right);
  }

  protected visitLiteral(node: AST.LiteralNode): string {
    const paramName = `p${this.paramCounter++}`;
    this.params[paramName] = node.value;
    return this.dialect.renderLiteral(node.value, node.literalType, paramName);
  }

  protected visitProperty(node: AST.PropertyNode): string {
    return this.dialect.escapeIdentifier(node.name);
  }

  protected visitOrderBy(node: AST.OrderByNode): string {
    const items = node.items.map(item => {
      return `${this.dialect.escapeIdentifier(item.property.name)} ${item.direction.toUpperCase()}`;
    });
    return `ORDER BY ${items.join(', ')}`;
  }

  protected visitExpand(node: AST.ExpandNode): string[] {
    return node.items.map(item => this.visit(item));
  }

  protected visitExpandItem(node: AST.ExpandItem): string {
    const navProp = node.navigationProperty.name;
    const parentTable = this.tableStack[this.tableStack.length - 1] || '';
    
    let referencedTable = this.dialect.escapeIdentifier(navProp);
    let joinCondition = '';
    
    if (this.getRelationship && parentTable) {
      const rel = this.getRelationship(parentTable, navProp);
      if (rel) {
        referencedTable = rel.referencedTable;
        
        const parentTableRef = parentTable.startsWith('`') ? parentTable : `\`${parentTable}\``;
        const childColEscaped = rel.referencedColumn.startsWith('`') ? rel.referencedColumn : `\`${rel.referencedColumn}\``;
        const parentColEscaped = rel.column.startsWith('`') ? rel.column : `\`${rel.column}\``;
        
        joinCondition = `${childColEscaped} = ${parentTableRef}.${parentColEscaped}`;
      }
    }
    
    let innerSelect = 'SELECT *';
    let innerWhere = '';
    let innerOrderby = '';
    let innerLimit = '';
    
    if (node.query) {
      const savedStack = [...this.tableStack];
      const result = this.translate(node.query, {
        params: this.params,
        counter: this.paramCounter,
        currentTable: navProp
      });
      this.paramCounter = result.counter; // Update counter
      this.tableStack = savedStack; // Restore stack
      
      innerSelect = result.options.select || 'SELECT *';
      
      // Append child expands to innerSelect
      if (result.options.expand && result.options.expand.length > 0) {
        innerSelect += (innerSelect === 'SELECT *' ? '' : ', ') + result.options.expand.join(', ');
      }
      
      innerWhere = result.options.where || '';
      innerOrderby = result.options.orderby || '';
      innerLimit = result.options.limit ? ` LIMIT ${result.options.limit}` : '';
    }
    
    // Inject joinCondition into innerWhere
    if (joinCondition) {
      if (innerWhere) {
        innerWhere = innerWhere.replace(/WHERE\s+/i, `WHERE (${joinCondition}) AND `);
      } else {
        innerWhere = `WHERE ${joinCondition}`;
      }
    }
    
    // Render SELECT AS STRUCT
    const selectAsStruct = innerSelect.replace(/^SELECT\s+/i, 'SELECT AS STRUCT ');
    
    return `ARRAY(${selectAsStruct} FROM ${referencedTable} ${innerWhere}${innerOrderby}${innerLimit}) AS \`${navProp}\``;
  }

  protected visitSearch(node: AST.SearchNode): string {
    const paramName = `p${this.paramCounter++}`;
    this.params[paramName] = node.expression;
    // Note: 't' is the alias for the main table in the final query
    return `SEARCH(t, @${paramName})`;
  }

  protected visitCompute(node: AST.ComputeNode): string[] {
    return node.items.map(item => this.visit(item));
  }

  protected visitComputeItem(node: AST.ComputeItem): string {
    const expr = this.visit(node.expression);
    return `(${expr}) AS \`${node.alias}\``;
  }
}

// CLI / Execution entry point
export function runTranslation(astData: any, policy: TranslationPolicy = 'OPTIMIZE_FOR_COST') {
  const dialect = new BigQueryDialect(policy);
  const translator = new Translator(dialect);
  
  // Reconstruct AST from JSON (simplified)
  // In a real scenario, we'd have a factory to turn JSON back into typed classes
  // For the demo, we assume the input is already structured correctly or cast it.
  return translator.translate(astData);
}
