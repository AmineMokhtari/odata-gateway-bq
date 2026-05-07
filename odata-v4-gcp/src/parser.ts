import { Token, TokenType } from './lexer.js';
import * as AST from './ast.js';

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): AST.QueryNode {
    const start = this.pos;
    const options = new Map<string, AST.ASTNode>();

    while (this.current().type !== TokenType.EOF) {
      if (this.current().type === TokenType.Delimiter && (this.current().value === '?' || this.current().value === '&')) {
        this.consume();
        continue;
      }

      if (this.current().type === TokenType.SystemQueryOption) {
        const optionToken = this.consume();
        this.expect(TokenType.Delimiter, '=');
        
        const optionName = optionToken.value.substring(1); // remove $
        let node: AST.ASTNode;

        switch (optionName) {
          case 'filter':
            node = this.parseFilter();
            break;
          case 'select':
            node = this.parseSelect();
            break;
          case 'top':
            node = this.parseTop();
            break;
          case 'skip':
            node = this.parseSkip();
            break;
          case 'count':
            node = this.parseCount();
            break;
          case 'orderby':
            node = this.parseOrderBy();
            break;
          case 'expand':
            node = this.parseExpand();
            break;
          case 'search':
            node = this.parseSearch();
            break;
          case 'compute':
            node = this.parseCompute();
            break;
          default:
            throw new Error(`Unsupported system query option: ${optionToken.value}`);
        }
        options.set(optionName, node);
      } else if (this.current().value === '&') {
        this.consume();
      } else {
        throw new Error(`Unexpected token ${this.current().value} at position ${this.current().start}`);
      }
    }

    return new AST.QueryNode(start, this.current().start, options);
  }

  private parseFilter(): AST.FilterNode {
    const start = this.current().start;
    const expression = this.parseExpression();
    return new AST.FilterNode(start, this.current().start, expression);
  }

  private parseSelect(): AST.SelectNode {
    const start = this.current().start;
    const properties: AST.PropertyNode[] = [];
    
    do {
      if (this.current().value === ',') this.consume();
      const propToken = this.expect(TokenType.Identifier);
      properties.push(new AST.PropertyNode(propToken.start, propToken.end, propToken.value));
    } while (this.current().value === ',');

    return new AST.SelectNode(start, this.current().start, properties);
  }

  private parseExpression(): AST.ASTNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): AST.ASTNode {
    let left = this.parseLogicalAnd();
    while (this.matchOperator('or')) {
      const op = this.consume().value;
      const right = this.parseLogicalAnd();
      left = new AST.BinaryExpressionNode(left.start, right.end, left, op, right);
    }
    return left;
  }

  private parseLogicalAnd(): AST.ASTNode {
    let left = this.parseComparison();
    while (this.matchOperator('and')) {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = new AST.BinaryExpressionNode(left.start, right.end, left, op, right);
    }
    return left;
  }

  private parseComparison(): AST.ASTNode {
    let left = this.parseAdditive();
    const comparisonOps = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'has', 'in'];
    if (this.current().type === TokenType.Operator && comparisonOps.includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseAdditive();
      return new AST.BinaryExpressionNode(left.start, right.end, left, op, right);
    }
    return left;
  }

  private parseAdditive(): AST.ASTNode {
    let left = this.parseMultiplicative();
    const additiveOps = ['add', 'sub'];
    while (this.current().type === TokenType.Operator && additiveOps.includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = new AST.BinaryExpressionNode(left.start, right.end, left, op, right);
    }
    return left;
  }

  private parseMultiplicative(): AST.ASTNode {
    let left = this.parsePrimary();
    const multiplicativeOps = ['mul', 'div', 'mod'];
    while (this.current().type === TokenType.Operator && multiplicativeOps.includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parsePrimary();
      left = new AST.BinaryExpressionNode(left.start, right.end, left, op, right);
    }
    return left;
  }

  private parsePrimary(): AST.ASTNode {
    const token = this.current();
    
    if (token.type === TokenType.Identifier) {
      this.consume();
      return new AST.PropertyNode(token.start, token.end, token.value);
    }

    if (token.type === TokenType.String) {
      this.consume();
      return new AST.LiteralNode(token.start, token.end, token.value, 'String');
    }

    if (token.type === TokenType.Number) {
      this.consume();
      const num = parseFloat(token.value);
      const isDate = token.value.includes('-');
      return new AST.LiteralNode(token.start, token.end, isDate ? token.value : num, 'Number');
    }

    if (token.type === TokenType.Boolean) {
      this.consume();
      return new AST.LiteralNode(token.start, token.end, token.value === 'true', 'Boolean');
    }

    if (token.value === '(') {
      this.consume();
      const expr = this.parseExpression();
      this.expect(TokenType.Delimiter, ')');
      return expr;
    }

    throw new Error(`Unexpected token ${token.value} in expression at position ${token.start}`);
  }

  private parseTop(): AST.LiteralNode {
    const token = this.expect(TokenType.Number);
    return new AST.LiteralNode(token.start, token.end, parseInt(token.value, 10), 'Number');
  }

  private parseSkip(): AST.LiteralNode {
    const token = this.expect(TokenType.Number);
    return new AST.LiteralNode(token.start, token.end, parseInt(token.value, 10), 'Number');
  }

  private parseCount(): AST.LiteralNode {
    const token = this.expect(TokenType.Boolean);
    return new AST.LiteralNode(token.start, token.end, token.value === 'true', 'Boolean');
  }

  private parseOrderBy(): AST.OrderByNode {
    const start = this.current().start;
    const items: AST.OrderByItem[] = [];
    do {
      if (this.current().value === ',') this.consume();
      const prop = this.expect(TokenType.Identifier);
      let direction: 'asc' | 'desc' = 'asc';
      if (this.current().type === TokenType.Identifier && (this.current().value === 'asc' || this.current().value === 'desc')) {
        direction = this.consume().value as 'asc' | 'desc';
      }
      items.push({ property: new AST.PropertyNode(prop.start, prop.end, prop.value), direction });
    } while (this.current().value === ',');
    return new AST.OrderByNode(start, this.current().start, items);
  }

  private parseExpand(): AST.ExpandNode {
    const start = this.current().start;
    const items: AST.ExpandItem[] = [];
    do {
      if (this.current().value === ',') this.consume();
      items.push(this.parseExpandItem());
    } while (this.current().value === ',');
    return new AST.ExpandNode(start, this.current().start, items);
  }

  private parseExpandItem(): AST.ExpandItem {
    const start = this.current().start;
    const propToken = this.expect(TokenType.Identifier);
    const navProp = new AST.PropertyNode(propToken.start, propToken.end, propToken.value);
    
    let query: AST.QueryNode | undefined;
    if (this.current().value === '(') {
      this.consume();
      query = this.parseNestedOptions();
      this.expect(TokenType.Delimiter, ')');
    }
    
    return new AST.ExpandItem(start, this.current().start, navProp, query);
  }

  private parseNestedOptions(): AST.QueryNode {
    const start = this.current().start;
    const options = new Map<string, AST.ASTNode>();
    
    while (this.current().value !== ')' && this.current().type !== TokenType.EOF) {
      if (this.current().value === ';') {
        this.consume();
        continue;
      }
      
      const optionToken = this.consume();
      let optionName: string;
      if (optionToken.type === TokenType.SystemQueryOption) {
        optionName = optionToken.value.substring(1);
      } else if (optionToken.type === TokenType.Identifier) {
        optionName = optionToken.value;
      } else {
        throw new Error(`Unexpected token ${optionToken.value} in nested options`);
      }

      this.expect(TokenType.Delimiter, '=');
      
      let node: AST.ASTNode;
      switch (optionName) {
        case 'filter': node = this.parseFilter(); break;
        case 'select': node = this.parseSelect(); break;
        case 'top': node = this.parseTop(); break;
        case 'skip': node = this.parseSkip(); break;
        case 'orderby': node = this.parseOrderBy(); break;
        case 'expand': node = this.parseExpand(); break;
        default: throw new Error(`Unsupported nested option: ${optionName}`);
      }
      options.set(optionName, node);
    }
    
    return new AST.QueryNode(start, this.current().start, options);
  }

  private parseCompute(): AST.ComputeNode {
    const start = this.current().start;
    const items: AST.ComputeItem[] = [];
    do {
      if (this.current().value === ',') this.consume();
      
      const exprStart = this.current().start;
      const expression = this.parseExpression();
      
      // Expect 'as' keyword (might be lexed as Identifier)
      const asToken = this.consume();
      if (asToken.value.toLowerCase() !== 'as') {
        throw new Error(`Expected 'as' in $compute at position ${asToken.start}`);
      }
      
      const aliasToken = this.expect(TokenType.Identifier);
      items.push(new AST.ComputeItem(exprStart, aliasToken.end, expression, aliasToken.value));
    } while (this.current().value === ',');
    
    return new AST.ComputeNode(start, this.current().start, items);
  }

  private parseSearch(): AST.SearchNode {
    const start = this.current().start;
    // For now, we capture the literal value of the search expression
    // A full implementation would parse the search expression tree
    let value = '';
    while (this.current().type !== TokenType.EOF && this.current().value !== '&' && this.current().value !== ';') {
      const token = this.consume();
      value += (value ? ' ' : '') + token.value;
    }
    return new AST.SearchNode(start, this.current().start, value);
  }

  private current() { return this.tokens[this.pos]; }
  private consume() { return this.tokens[this.pos++]; }
  private matchOperator(op: string) { return this.current().type === TokenType.Operator && this.current().value === op; }
  
  private expect(type: TokenType, value?: string): Token {
    const token = this.current();
    if (token.type !== type || (value && token.value !== value)) {
      throw new Error(`Expected ${value || TokenType[type]} at position ${token.start}, found ${token.value}`);
    }
    return this.consume();
  }
}
