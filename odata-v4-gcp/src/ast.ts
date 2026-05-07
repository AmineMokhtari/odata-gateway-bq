/**
 * Semantic AST Node Definitions for OData v4
 */

export type NodeType = 
  | 'Query' 
  | 'Filter' 
  | 'Select' 
  | 'Expand' 
  | 'OrderBy' 
  | 'Top' 
  | 'Skip' 
  | 'Count'
  | 'Literal' 
  | 'Property' 
  | 'BinaryExpression' 
  | 'UnaryExpression' 
  | 'MethodCall';

export abstract class ASTNode {
  abstract type: NodeType;
  constructor(public start: number, public end: number) {}
}

export class QueryNode extends ASTNode {
  type: NodeType = 'Query';
  constructor(
    start: number, end: number,
    public options: Map<string, ASTNode> = new Map()
  ) {
    super(start, end);
  }
}

export class FilterNode extends ASTNode {
  type: NodeType = 'Filter';
  constructor(start: number, end: number, public expression: ASTNode) {
    super(start, end);
  }
}

export class SelectNode extends ASTNode {
  type: NodeType = 'Select';
  constructor(start: number, end: number, public properties: PropertyNode[]) {
    super(start, end);
  }
}

export class PropertyNode extends ASTNode {
  type: NodeType = 'Property';
  constructor(start: number, end: number, public name: string) {
    super(start, end);
  }
}

export class LiteralNode extends ASTNode {
  type: NodeType = 'Literal';
  constructor(start: number, end: number, public value: any, public literalType: string) {
    super(start, end);
  }
}

export class BinaryExpressionNode extends ASTNode {
  type: NodeType = 'BinaryExpression';
  constructor(
    start: number, end: number,
    public left: ASTNode,
    public operator: string,
    public right: ASTNode
  ) {
    super(start, end);
  }
}

export class UnaryExpressionNode extends ASTNode {
  type: NodeType = 'UnaryExpression';
  constructor(
    start: number, end: number,
    public operator: string,
    public expression: ASTNode
  ) {
    super(start, end);
  }
}

export interface OrderByItem {
  property: PropertyNode;
  direction: 'asc' | 'desc';
}

export class OrderByNode extends ASTNode {
  type: NodeType = 'OrderBy';
  constructor(start: number, end: number, public items: OrderByItem[]) {
    super(start, end);
  }
}

export class ExpandItem extends ASTNode {
  type: NodeType = 'ExpandItem';
  constructor(
    start: number, end: number,
    public navigationProperty: PropertyNode,
    public query?: QueryNode
  ) {
    super(start, end);
  }
}

export class ExpandNode extends ASTNode {
  type: NodeType = 'Expand';
  constructor(start: number, end: number, public items: ExpandItem[]) {
    super(start, end);
  }
}

export class SearchNode extends ASTNode {
  type: NodeType = 'Search';
  constructor(start: number, end: number, public expression: string) {
    super(start, end);
  }
}

export class ComputeItem extends ASTNode {
  type: NodeType = 'ComputeItem';
  constructor(
    start: number, end: number,
    public expression: ASTNode,
    public alias: string
  ) {
    super(start, end);
  }
}

export class ComputeNode extends ASTNode {
  type: NodeType = 'Compute';
  constructor(start: number, end: number, public items: ComputeItem[]) {
    super(start, end);
  }
}
