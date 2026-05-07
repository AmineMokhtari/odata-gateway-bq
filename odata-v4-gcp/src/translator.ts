import { Visitor, Dialect } from './visitor.js';
import { BigQueryDialect, TranslationPolicy } from './dialects/bigquery.js';
import * as AST from './ast.js';

export class Translator extends Visitor {
  private params: Record<string, any> = {};
  private paramCounter = 0;

  constructor(dialect: Dialect) {
    super(dialect);
  }

  public translate(node: AST.ASTNode, context?: { params: Record<string, any>, counter: number }): { sql: string, params: Record<string, any>, counter: number, options: Record<string, any> } {
    if (context) {
      this.params = context.params;
      this.paramCounter = context.counter;
    } else {
      this.params = {};
      this.paramCounter = 0;
    }
    
    // For a QueryNode, we return a structured object
    if (node instanceof AST.QueryNode) {
      const options: Record<string, string> = {};
      
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
